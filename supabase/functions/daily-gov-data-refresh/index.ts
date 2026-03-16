/**
 * Daily Government Data Refresh
 * 
 * Nightly scheduled job that refreshes OpenFEC, Congress, LDA (lobbying),
 * and USASpending data for the most-tracked companies.
 * 
 * All APIs are free — no API keys required except FEC_API_KEY (optional).
 * Triggered via pg_cron once per day at 2 AM UTC.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_COMPANIES_PER_RUN = 25;

// Government data sources to refresh
const GOV_SOURCES = [
  { name: 'sync-openfec', label: 'OpenFEC (PACs & Donations)' },
  { name: 'sync-lobbying', label: 'Senate LDA (Lobbying)' },
  { name: 'sync-federal-contracts', label: 'USASpending (Contracts)' },
  { name: 'sync-congress-votes', label: 'Congress.gov (Legislation)' },
  { name: 'sync-labor-rights', label: 'Labor Rights (DOL/NLRB/BLS)' },
  { name: 'sync-immigration-signals', label: 'Immigration (H-1B/H-2A/H-2B/DOL)' },
  { name: 'sync-climate-signals', label: 'Climate (EPA GHGRP/ECHO)' },
  { name: 'sync-gun-policy-signals', label: 'Gun Policy (ATF/FEC)' },
  { name: 'sync-civil-rights-signals', label: 'Civil Rights (EEOC/CourtListener/HRC)' },
  { name: 'sync-healthcare-signals', label: 'Healthcare (DOL EBSA/CMS/Benefits)' },
] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Get the most-tracked companies
    const { data: tracked } = await supabase
      .from('tracked_companies')
      .select('company_id, companies!inner(id, name)')
      .eq('is_active', true)
      .limit(500);

    if (!tracked?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tracked companies', refreshed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count tracking frequency and pick top N
    const counts = new Map<string, { count: number; name: string }>();
    for (const t of tracked) {
      const company = t.companies as any;
      if (!company) continue;
      const existing = counts.get(company.id) || { count: 0, name: company.name };
      existing.count++;
      counts.set(company.id, existing);
    }

    const topCompanies = [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, MAX_COMPANIES_PER_RUN);

    const results: Record<string, { success: number; failed: number }> = {};
    for (const src of GOV_SOURCES) {
      results[src.name] = { success: 0, failed: 0 };
    }

    for (const [companyId, info] of topCompanies) {
      for (const source of GOV_SOURCES) {
        try {
          const body: Record<string, string> = {
            companyId,
            companyName: info.name,
          };

          // sync-congress-votes needs candidate data from FEC first
          // sync-openfec and sync-lobbying just need companyId/companyName

          const { error } = await supabase.functions.invoke(source.name, { body });

          if (error) {
            console.warn(`[${source.name}] Failed for ${info.name}: ${error.message}`);
            results[source.name].failed++;
          } else {
            results[source.name].success++;
          }
        } catch (e) {
          console.warn(`[${source.name}] Error for ${info.name}:`, e);
          results[source.name].failed++;
        }

        // Throttle: 3s between calls to respect free API rate limits
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    const summary = Object.entries(results)
      .map(([k, v]) => `${k}: ${v.success}✓ ${v.failed}✗`)
      .join(', ');

    console.log(`[daily-gov-refresh] Done. ${topCompanies.length} companies. ${summary}`);

    return new Response(
      JSON.stringify({
        success: true,
        companiesProcessed: topCompanies.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[daily-gov-refresh] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
