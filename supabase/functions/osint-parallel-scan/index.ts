/**
 * OSINT Parallel Scan Orchestrator
 * 
 * Triggers all OSINT data sources in parallel for maximum speed.
 * Instead of sequential provider chains, fires all free APIs simultaneously.
 * Returns aggregated results as they complete.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, companyName, sources } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[osint-parallel-scan] START: ${companyName} (${companyId})`);
    const startTime = Date.now();

    // Define all OSINT source functions to call in parallel
    const allSources = [
      'sync-opensanctions',
      'sync-wikidata',
      'sync-opencorporates',
      'sync-openfec',
      'sync-gdelt',
      'sync-court-records',
      'sync-lobbying',
      'sync-federal-contracts',
      'sync-insider-trades',
      'sync-sec-edgar',
    ];

    const sourcesToRun = sources?.length ? sources : allSources;

    // Check freshness first — skip sources that are still current
    const { data: existingSections } = await supabase
      .from('company_report_sections')
      .select('section_type, last_successful_update, freshness_ttl_hours')
      .eq('company_id', companyId);

    const sectionMap = new Map(
      (existingSections || []).map(s => [s.section_type, s])
    );

    // Map edge function names to section types for freshness checking
    const functionToSection: Record<string, string> = {
      'sync-opensanctions': 'sanctions_screening',
      'sync-wikidata': 'wikidata_enrichment',
      'sync-opencorporates': 'corporate_structure',
      'sync-openfec': 'political_influence',
      'sync-gdelt': 'news',
      'sync-court-records': 'legal_risk',
      'sync-lobbying': 'lobbying',
      'sync-federal-contracts': 'government_contracts',
      'sync-insider-trades': 'insider_trading',
      'sync-sec-edgar': 'sec_filings',
    };

    const freshSources: string[] = [];
    const staleSources: string[] = [];

    for (const source of sourcesToRun) {
      const sectionType = functionToSection[source];
      const existing = sectionType ? sectionMap.get(sectionType) : null;
      
      if (existing?.last_successful_update) {
        const ttlMs = (existing.freshness_ttl_hours || 168) * 3600000;
        const age = Date.now() - new Date(existing.last_successful_update).getTime();
        if (age < ttlMs) {
          freshSources.push(source);
          continue;
        }
      }
      staleSources.push(source);
    }

    console.log(`[osint-parallel-scan] Fresh: ${freshSources.length}, Stale: ${staleSources.length}`);

    if (staleSources.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'All sources are current',
        fresh: freshSources,
        stale: [],
        duration: Date.now() - startTime,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fire all stale sources IN PARALLEL
    const results = await Promise.allSettled(
      staleSources.map(async (functionName) => {
        const fnStart = Date.now();
        try {
          const { data, error } = await supabase.functions.invoke(functionName, {
            body: { companyId, companyName },
          });
          return {
            source: functionName,
            success: !error && data?.success !== false,
            duration: Date.now() - fnStart,
            data: data,
            error: error?.message || data?.error,
          };
        } catch (e) {
          return {
            source: functionName,
            success: false,
            duration: Date.now() - fnStart,
            error: e instanceof Error ? e.message : 'Unknown error',
          };
        }
      })
    );

    const summary = results.map(r => {
      if (r.status === 'fulfilled') return r.value;
      return { source: 'unknown', success: false, error: r.reason?.message || 'Promise rejected' };
    });

    const succeeded = summary.filter(s => s.success).length;
    const failed = summary.filter(s => !s.success).length;
    const totalDuration = Date.now() - startTime;

    // Update company last_scan_attempted
    await supabase.from('companies').update({
      last_scan_attempted: new Date().toISOString(),
    }).eq('id', companyId);

    console.log(`[osint-parallel-scan] COMPLETE: ${succeeded}/${staleSources.length} succeeded in ${totalDuration}ms`);

    return new Response(JSON.stringify({
      success: true,
      totalDuration,
      sourcesRun: staleSources.length,
      succeeded,
      failed,
      fresh: freshSources,
      results: summary,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[osint-parallel-scan] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
