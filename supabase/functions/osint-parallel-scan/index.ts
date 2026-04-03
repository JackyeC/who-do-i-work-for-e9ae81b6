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

const SOURCE_FAMILY_TO_FUNCTIONS: Record<string, string[]> = {
  news: ['sync-gdelt'],
  fec: ['sync-openfec'],
  sec: ['sync-sec-edgar'],
  osha: ['sync-workplace-enforcement'],
  warn: ['warn-scan'],
  careers: ['scrape-careers-page'],
  nlrb: ['sync-labor-rights'],
  bls: ['sync-bls-data'],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Auth gate: validate user JWT, service-role, or allow anonymous (scans are public)
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || '';
  const isServiceRole = token === supabaseKey;

  // If an auth header is provided but it's not service-role, validate the JWT
  // with getClaims so preview/session tokens do not trigger an upstream 401.
  if (authHeader?.startsWith('Bearer ') && !isServiceRole && token) {
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    // If token is invalid, log but still allow (scan data is public)
    if (claimsError || !claimsData?.claims?.sub) {
      console.warn('[osint-parallel-scan] Invalid JWT provided, proceeding as anonymous');
    }
  }

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

    // Check if company is private (not publicly traded)
    const { data: companyRow } = await supabase
      .from('companies')
      .select('is_publicly_traded')
      .eq('id', companyId)
      .single();

    const isPrivate = companyRow?.is_publicly_traded === false;

    // Public company sources (SEC/FEC heavy)
    const publicSources = [
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
      'detect-contradictions',
    ];

    // Private company sources (labor/regulatory/enforcement heavy)
    const privateSources = [
      'sync-opensanctions',
      'sync-wikidata',
      'sync-opencorporates',
      'sync-gdelt',
      'sync-court-records',
      'sync-civil-rights-signals',
      'sync-labor-rights',
      'sync-workplace-enforcement',
      'enrich-private-company',
      'detect-contradictions',
    ];

    // Route to the appropriate source list
    const allSources = isPrivate ? privateSources : publicSources;

    const requestedSources = sources?.length ? sources : allSources;
    const sourcesToRun = [...new Set(
      requestedSources.flatMap((source: string) => SOURCE_FAMILY_TO_FUNCTIONS[source] ?? [source])
    )];

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
      'warn-scan': 'warn',
      'scrape-careers-page': 'careers',
      'sync-civil-rights-signals': 'civil_rights',
      'sync-labor-rights': 'labor_rights',
      'sync-workplace-enforcement': 'workplace_enforcement',
      'sync-bls-data': 'bls',
      'enrich-private-company': 'private_enrichment',
      'detect-contradictions': 'contradiction_detection',
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

    // Fire all stale sources IN PARALLEL using direct fetch (not supabase.functions.invoke)
    // to ensure proper auth header propagation
    const functionsBaseUrl = `${supabaseUrl}/functions/v1`;
    const authHeader = req.headers.get('Authorization');

    const results = await Promise.allSettled(
      staleSources.map(async (functionName) => {
        const fnStart = Date.now();
        try {
          const payload = buildFunctionPayload(functionName, companyId, companyName);
          const response = await fetch(`${functionsBaseUrl}/${functionName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': anonKey,
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json().catch(() => ({}));
          return {
            source: functionName,
            success: response.ok && data?.success !== false,
            duration: Date.now() - fnStart,
            data,
            error: !response.ok ? `HTTP ${response.status}` : data?.error,
          };
        } catch (e: any) {
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

    // Refresh company_coverage_summary from actual signal tables
    await refreshCoverageSummary(supabase, companyId);

    // Trigger signal engine after scan completes (fire-and-forget)
    fetch(`${functionsBaseUrl}/generate-company-signals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ companyId }),
    }).catch(err => console.warn('[osint-parallel-scan] Signal generation failed:', err));

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

  } catch (error: any) {
    console.error('[osint-parallel-scan] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

/**
 * Refresh company_coverage_summary by counting actual signal rows per source family.
 */
async function refreshCoverageSummary(supabase: any, companyId: string) {
  const now = new Date().toISOString();

  // Map source_family → table(s) to count
  const sourceTables: Record<string, { table: string; dateCol?: string; filter?: Record<string, string>; skipCompanyId?: boolean }[]> = {
    news: [{ table: 'company_news_signals', dateCol: 'published_at' }],
    fec: [{ table: 'company_party_breakdown' }, { table: 'company_spending_history' }, { table: 'company_super_pacs' }],
    sec: [{ table: 'company_report_sections', filter: { section_type: 'sec_filings' } }],
    osha: [{ table: 'workplace_enforcement_signals' }],
    warn: [{ table: 'company_warn_notices' }],
    careers: [{ table: 'company_careers_signals' }, { table: 'company_jobs' }],
    nlrb: [{ table: 'labor_rights_signals' }],
    bls: [{ table: 'bls_wage_benchmarks', skipCompanyId: true }],
  };

  for (const [family, tables] of Object.entries(sourceTables)) {
    let totalCount = 0;
    let latestDate: string | null = null;

    for (const src of tables) {
      try {
        let query = supabase.from(src.table).select('*', { count: 'exact', head: true });

        if (!src.skipCompanyId) {
          query = query.eq('company_id', companyId);
        }

        if (src.filter) {
          for (const [key, val] of Object.entries(src.filter)) {
            query = query.eq(key, val);
          }
        }

        const { count, error } = await query;
        if (!error && count) totalCount += count;

        // Try to get latest date
        if (src.dateCol && !latestDate) {
          const dateQuery = supabase
            .from(src.table)
            .select(src.dateCol)
            .order(src.dateCol, { ascending: false })
            .limit(1);
          if (!src.skipCompanyId) dateQuery.eq('company_id', companyId);
          const { data: latest } = await dateQuery.maybeSingle();
          if (latest?.[src.dateCol]) latestDate = latest[src.dateCol];
        }
      } catch (_e) {
        // Table might not exist, skip
      }
    }

    const status = totalCount >= 5 ? 'rich' : totalCount > 0 ? 'limited' : 'no_trail';

    await supabase.from('company_coverage_summary').upsert({
      company_id: companyId,
      source_family: family,
      signal_count: totalCount,
      last_signal_date: latestDate,
      last_checked_at: now,
      coverage_status: status,
      summary_text: null,
      updated_at: now,
    }, { onConflict: 'company_id,source_family' });
  }

  console.log(`[osint-parallel-scan] Coverage summary refreshed for ${companyId}`);
}

function buildFunctionPayload(functionName: string, companyId: string, companyName: string) {
  switch (functionName) {
    case 'warn-scan':
      return {
        company_id: companyId,
        company_name: companyName,
        national: true,
      };
    case 'scrape-careers-page':
      return {
        company_id: companyId,
        company_name: companyName,
      };
    default:
      return { companyId, companyName };
  }
}
