/**
 * Daily Intelligence Preload
 * 
 * Scheduled job that refreshes intelligence for high-traffic companies
 * so their pages are always cached and fast on load.
 * 
 * Triggered via pg_cron once per day.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SECTIONS_TO_PRELOAD = ['careers', 'news', 'reputation', 'worker_sentiment'];
const MAX_COMPANIES_PER_RUN = 20;

// Freshness TTLs in hours
const FRESHNESS_TTL: Record<string, number> = {
  careers: 48,
  news: 24,
  worker_sentiment: 72,
  reputation: 168,
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get popular companies: those most tracked by users
    const { data: popularCompanies } = await supabase
      .from('tracked_companies')
      .select('company_id, companies!inner(id, name, website_url, careers_url)')
      .eq('is_active', true)
      .limit(200);

    if (!popularCompanies?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tracked companies to preload', refreshed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count tracking frequency per company
    const trackCounts = new Map<string, { count: number; name: string; url: string | null }>();
    for (const tc of popularCompanies) {
      const company = tc.companies as any;
      if (!company) continue;
      const existing = trackCounts.get(company.id) || { count: 0, name: company.name, url: company.website_url || company.careers_url };
      existing.count++;
      trackCounts.set(company.id, existing);
    }

    // Sort by popularity and take top N
    const sorted = [...trackCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, MAX_COMPANIES_PER_RUN);

    let refreshed = 0;
    let skipped = 0;

    for (const [companyId, info] of sorted) {
      for (const section of SECTIONS_TO_PRELOAD) {
        // Check if data is still fresh
        const { data: existing } = await supabase
          .from('company_report_sections')
          .select('last_successful_update')
          .eq('company_id', companyId)
          .eq('section_type', section)
          .maybeSingle();

        if (existing?.last_successful_update) {
          const ttlHours = FRESHNESS_TTL[section] || 168;
          const age = Date.now() - new Date(existing.last_successful_update).getTime();
          if (age < ttlHours * 3600000) {
            skipped++;
            continue;
          }
        }

        // Trigger refresh via the refresh-intelligence function
        try {
          await supabase.functions.invoke('refresh-intelligence', {
            body: {
              companyId,
              companyName: info.name,
              section,
              url: info.url,
              triggeredBy: 'schedule',
            },
          });
          refreshed++;
        } catch (e: any) {
          console.warn(`Preload failed for ${info.name}/${section}:`, e);
        }

        // Small delay to avoid hammering providers
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log(`Preload complete: ${refreshed} refreshed, ${skipped} skipped (still fresh)`);

    return new Response(
      JSON.stringify({ success: true, refreshed, skipped, companiesChecked: sorted.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('daily-intelligence-preload error:', error);
    return new Response(
      JSON.stringify({ success: false, error: "Request failed" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
