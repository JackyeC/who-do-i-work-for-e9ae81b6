const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BATCH_SIZE = 5;

// Common careers page paths to discover
const CAREERS_PATHS = ['/careers', '/jobs', '/work-with-us', '/join-us', '/join', '/opportunities', '/openings'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Step 1: Get all companies ───
    const { data: companies, error: fetchErr } = await supabase
      .from('companies')
      .select('id, name, careers_url, website_url')
      .order('name')
      .limit(1000);

    if (fetchErr || !companies) {
      return new Response(JSON.stringify({ success: false, error: fetchErr?.message || 'No companies' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ─── Step 2: Careers page discovery for companies without careers_url ───
    const needsDiscovery = companies.filter(c => !c.careers_url && c.website_url);
    let discovered = 0;
    for (const company of needsDiscovery.slice(0, 10)) {
      const baseUrl = company.website_url!.replace(/\/$/, '');
      for (const path of CAREERS_PATHS) {
        try {
          const resp = await fetch(`${baseUrl}${path}`, { method: 'HEAD', redirect: 'follow' });
          if (resp.ok) {
            const finalUrl = resp.url || `${baseUrl}${path}`;
            await supabase.from('companies').update({ careers_url: finalUrl }).eq('id', company.id);
            company.careers_url = finalUrl;
            discovered++;
            console.log(`Discovered careers page for ${company.name}: ${finalUrl}`);
            break;
          }
        } catch { /* continue */ }
      }
    }

    // ─── Step 3: Smart refresh prioritization ───
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Get recently scraped companies
    const { data: recentScrapes } = await supabase
      .from('company_jobs')
      .select('company_id, scraped_at')
      .gte('scraped_at', sevenDaysAgo);
    const recentlyScrapedIds = new Set((recentScrapes || []).map(s => s.company_id));

    // Get watched companies (higher priority — refresh every 3 days)
    const { data: watchedCompanies } = await supabase
      .from('user_company_watchlist')
      .select('company_id');
    const watchedIds = new Set((watchedCompanies || []).map(w => w.company_id));

    // Get companies with recent search interest
    const { data: recentlySearched } = await supabase
      .from('company_signal_scans')
      .select('company_id')
      .gte('scan_timestamp', threeDaysAgo);
    const searchedIds = new Set((recentlySearched || []).map(s => s.company_id));

    const withCareersUrl = companies.filter(c => c.careers_url);

    // Priority sort: watched > searched > never scraped > stale
    const needsScraping = withCareersUrl
      .filter(c => {
        if (watchedIds.has(c.id) || searchedIds.has(c.id)) {
          // Refresh watched/searched every 3 days
          const recentScrape = (recentScrapes || []).find(s => s.company_id === c.id);
          if (recentScrape && new Date(recentScrape.scraped_at) > new Date(threeDaysAgo)) return false;
          return true;
        }
        return !recentlyScrapedIds.has(c.id);
      })
      .sort((a, b) => {
        const aWatched = watchedIds.has(a.id) ? 0 : 1;
        const bWatched = watchedIds.has(b.id) ? 0 : 1;
        if (aWatched !== bWatched) return aWatched - bWatched;
        const aSearched = searchedIds.has(a.id) ? 0 : 1;
        const bSearched = searchedIds.has(b.id) ? 0 : 1;
        return aSearched - bSearched;
      });

    console.log(`${companies.length} companies total. ${discovered} careers pages discovered. ${needsScraping.length} need scraping. Processing ${BATCH_SIZE}.`);

    // ─── Step 4: Scrape batch ───
    const batch = needsScraping.slice(0, BATCH_SIZE);
    const results: any[] = [];

    for (const company of batch) {
      console.log(`Scraping: ${company.name} (${company.careers_url})`);
      try {
        const resp = await fetch(`${supabaseUrl}/functions/v1/job-scrape`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: company.id, careersUrl: company.careers_url, companyName: company.name }),
        });

        const data = await resp.json();
        results.push({
          company: company.name,
          success: data.success,
          jobsAdded: data.jobsAdded || 0,
          sourceType: data.sourceType,
          sourcePlatform: data.sourcePlatform,
          error: data.error,
          isWatched: watchedIds.has(company.id),
        });

        if (data.success) {
          console.log(`✅ ${company.name}: ${data.jobsAdded} jobs via ${data.sourcePlatform || 'unknown'}`);
        } else {
          console.error(`❌ ${company.name}: ${data.error}`);
        }

        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        console.error(`❌ ${company.name} error:`, e);
        results.push({ company: company.name, success: false, error: String(e) });
      }
    }

    const totalJobs = results.reduce((sum, r) => sum + (r.jobsAdded || 0), 0);

    // ─── Step 5: Trigger dream job detection if new jobs were added ───
    if (totalJobs > 0) {
      try {
        console.log('Triggering dream job detection...');
        await fetch(`${supabaseUrl}/functions/v1/dream-job-detect`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
      } catch (e) {
        console.warn('Dream job detection trigger failed (non-blocking):', e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: batch.length,
      remaining: needsScraping.length - batch.length,
      careersDiscovered: discovered,
      totalJobsAdded: totalJobs,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Batch job scrape error:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
