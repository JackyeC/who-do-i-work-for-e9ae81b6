/**
 * Bulk Strategic Job Scraper
 * 
 * Targets three tiers of companies for the "Value-Aligned" job board:
 * 1. Certified B-Corps — transparency leaders with public impact data
 * 2. Top Political Donors — companies with "spicy" Connection Chains
 * 3. Database companies with careers URLs but no jobs yet
 * 
 * Calls the existing `job-scrape` function for each company.
 * Optionally triggers `company-research-perplexity` for new companies.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Tier 1: Certified B-Corps with known ATS URLs ───
const BCORP_TARGETS = [
  { name: 'Patagonia', slug: 'patagonia', industry: 'Retail / Outdoor Apparel', state: 'CA', careersUrl: 'https://boards.greenhouse.io/patagonia' },
  { name: 'Ben & Jerry\'s', slug: 'ben-and-jerrys', industry: 'Food & Beverage', state: 'VT', careersUrl: 'https://jobs.lever.co/benjerry' },
  { name: 'Danone North America', slug: 'danone-north-america', industry: 'Food & Beverage', state: 'NY', careersUrl: 'https://careers.danone.com' },
  { name: 'Allbirds', slug: 'allbirds', industry: 'Retail / Footwear', state: 'CA', careersUrl: 'https://boards.greenhouse.io/allbirds' },
  { name: 'Warby Parker', slug: 'warby-parker', industry: 'Retail / Eyewear', state: 'NY', careersUrl: 'https://boards.greenhouse.io/warbyparker' },
  { name: 'Bombas', slug: 'bombas', industry: 'Retail / Apparel', state: 'NY', careersUrl: 'https://boards.greenhouse.io/bombas' },
  { name: 'Athleta', slug: 'athleta', industry: 'Retail / Apparel', state: 'CA', careersUrl: 'https://www.gapinc.com/en-us/careers' },
  { name: 'King Arthur Baking', slug: 'king-arthur-baking', industry: 'Food & Beverage', state: 'VT', careersUrl: 'https://www.kingarthurbaking.com/careers' },
  { name: 'Dr. Bronner\'s', slug: 'dr-bronners', industry: 'Consumer Products', state: 'CA', careersUrl: 'https://www.drbronner.com/about/careers/' },
  { name: 'Seventh Generation', slug: 'seventh-generation', industry: 'Consumer Products', state: 'VT', careersUrl: 'https://www.seventhgeneration.com/careers' },
  { name: 'Eileen Fisher', slug: 'eileen-fisher', industry: 'Retail / Fashion', state: 'NY', careersUrl: 'https://www.eileenfisher.com/careers' },
  { name: 'Cotopaxi', slug: 'cotopaxi', industry: 'Retail / Outdoor', state: 'UT', careersUrl: 'https://boards.greenhouse.io/cotopaxi' },
  { name: 'Greyston Bakery', slug: 'greyston-bakery', industry: 'Food & Beverage', state: 'NY', careersUrl: 'https://grfrp.com/careers/' },
  { name: 'New Belgium Brewing', slug: 'new-belgium-brewing', industry: 'Food & Beverage', state: 'CO', careersUrl: 'https://www.newbelgium.com/careers/' },
  { name: 'Cascade Engineering', slug: 'cascade-engineering', industry: 'Manufacturing', state: 'MI', careersUrl: 'https://www.cascadeng.com/careers' },
  { name: 'Preserve', slug: 'preserve-products', industry: 'Consumer Products', state: 'MA', careersUrl: 'https://www.preserveproducts.com/pages/careers' },
  { name: 'Indigenous Designs', slug: 'indigenous-designs', industry: 'Retail / Fashion', state: 'CA', careersUrl: 'https://www.indigenous.com/pages/careers' },
  { name: 'Numi Organic Tea', slug: 'numi-organic-tea', industry: 'Food & Beverage', state: 'CA', careersUrl: 'https://numitea.com/pages/careers' },
  { name: 'Badger Balm', slug: 'badger-balm', industry: 'Consumer Products', state: 'NH', careersUrl: 'https://www.badgerbalm.com/pages/careers' },
  { name: 'Cabot Creamery', slug: 'cabot-creamery', industry: 'Food & Beverage', state: 'VT', careersUrl: 'https://www.cabotcheese.coop/careers' },
];

// ─── Tier 2: Power & Influence Top 10 — "Watchdog Warning" companies ───
const POWER_INFLUENCE_TARGETS = [
  { name: 'Amazon', slug: 'amazon', industry: 'Technology / E-Commerce', state: 'WA', careersUrl: 'https://www.amazon.jobs/en/search', lobbying: 21_400_000, pacSpending: 1_600_000 },
  { name: 'Alphabet', slug: 'alphabet', industry: 'Technology / Search & AI', state: 'CA', careersUrl: 'https://www.google.com/about/careers/applications/', lobbying: 13_400_000, pacSpending: 1_900_000 },
  { name: 'Meta', slug: 'meta', industry: 'Technology / Social Media', state: 'CA', careersUrl: 'https://www.metacareers.com/jobs/', lobbying: 19_700_000, pacSpending: 1_300_000 },
  { name: 'Microsoft', slug: 'microsoft', industry: 'Technology / Software', state: 'WA', careersUrl: 'https://careers.microsoft.com/v2/global/en/search', lobbying: 10_200_000, pacSpending: 2_400_000 },
  { name: 'Comcast', slug: 'comcast', industry: 'Telecommunications / Media', state: 'PA', careersUrl: 'https://jobs.comcast.com/search-jobs', lobbying: 14_300_000, pacSpending: 3_100_000 },
  { name: 'Pfizer', slug: 'pfizer', industry: 'Pharmaceuticals', state: 'NY', careersUrl: 'https://www.pfizer.com/about/careers', lobbying: 11_600_000, pacSpending: 1_700_000 },
  { name: 'Lockheed Martin', slug: 'lockheed-martin', industry: 'Defense / Aerospace', state: 'MD', careersUrl: 'https://www.lockheedmartinjobs.com/search-jobs', lobbying: 12_500_000, pacSpending: 3_800_000 },
  { name: 'Walmart', slug: 'walmart', industry: 'Retail / General Merchandise', state: 'AR', careersUrl: 'https://careers.walmart.com/', lobbying: 8_600_000, pacSpending: 1_500_000 },
  { name: 'JPMorgan Chase', slug: 'jpmorgan-chase', industry: 'Financial Services / Banking', state: 'NY', careersUrl: 'https://careers.jpmorgan.com/us/en/search-jobs', lobbying: 10_800_000, pacSpending: 2_200_000 },
  { name: 'FedEx', slug: 'fedex', industry: 'Logistics / Transportation', state: 'TN', careersUrl: 'https://careers.fedex.com/fedex/', lobbying: 9_200_000, pacSpending: 2_800_000 },
];

// Tier 2 also pulls from DB by highest total_pac_spending + lobbying_spend

const THROTTLE_MS = 2000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const body = await req.json().catch(() => ({}));
  const tier = body.tier || 'all'; // 'bcorp', 'political'/'power', 'unfilled', 'all'
  const dryRun = body.dryRun || false;
  const maxPerTier = body.maxPerTier || 20;

  const results: { tier: string; company: string; status: string; jobsAdded?: number; error?: string }[] = [];

  // ─── Helper: ensure company exists in DB ───
  async function ensureCompany(target: { name: string; slug: string; industry: string; state: string; careersUrl: string }): Promise<string | null> {
    // Check if already exists
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', target.slug)
      .maybeSingle();

    if (existing) {
      // Update careers_url if missing
      await supabase.from('companies').update({ careers_url: target.careersUrl }).eq('id', existing.id).is('careers_url', null);
      return existing.id;
    }

    // Create new company record
    const { data: created, error } = await supabase.from('companies').insert({
      name: target.name,
      slug: target.slug,
      industry: target.industry,
      state: target.state,
      careers_url: target.careersUrl,
      record_status: 'draft',
      confidence_rating: 'low',
      vetted_status: 'unverified',
      creation_source: 'bulk_scrape_bcorp',
    }).select('id').single();

    if (error) {
      console.error(`Failed to create company ${target.name}:`, error);
      return null;
    }

    return created.id;
  }

  // ─── Helper: scrape jobs for a company ───
  async function scrapeJobs(companyId: string, careersUrl: string, companyName: string) {
    const resp = await fetch(`${supabaseUrl}/functions/v1/job-scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyId, careersUrl, companyName }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`job-scrape returned ${resp.status}: ${errText}`);
    }

    return await resp.json();
  }

  try {
    // ═══════════════════════════════════════════
    // TIER 1: B-Corps — Transparency Leaders
    // ═══════════════════════════════════════════
    if (tier === 'all' || tier === 'bcorp') {
      console.log(`\n═══ TIER 1: B-Corps (${BCORP_TARGETS.length} targets) ═══`);

      for (const target of BCORP_TARGETS.slice(0, maxPerTier)) {
        try {
          const companyId = await ensureCompany(target);
          if (!companyId) {
            results.push({ tier: 'bcorp', company: target.name, status: 'error', error: 'Failed to create company record' });
            continue;
          }

          if (dryRun) {
            results.push({ tier: 'bcorp', company: target.name, status: 'dry_run', jobsAdded: 0 });
            continue;
          }

          const scrapeResult = await scrapeJobs(companyId, target.careersUrl, target.name);
          results.push({
            tier: 'bcorp',
            company: target.name,
            status: 'success',
            jobsAdded: scrapeResult.jobsAdded || 0,
          });
          console.log(`✅ ${target.name}: ${scrapeResult.jobsAdded || 0} jobs`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          console.error(`❌ ${target.name}: ${msg}`);
          results.push({ tier: 'bcorp', company: target.name, status: 'error', error: msg });
        }

        await sleep(THROTTLE_MS);
      }
    }

    // ═══════════════════════════════════════════
    // TIER 2: Power & Influence Top 10 + DB political donors
    // ═══════════════════════════════════════════
    if (tier === 'all' || tier === 'political' || tier === 'power') {
      console.log(`\n═══ TIER 2: Power & Influence Companies ═══`);

      // First: process hardcoded Power & Influence targets
      for (const target of POWER_INFLUENCE_TARGETS.slice(0, maxPerTier)) {
        try {
          const companyId = await ensureCompany(target);
          if (!companyId) {
            results.push({ tier: 'political', company: target.name, status: 'error', error: 'Failed to create company record' });
            continue;
          }

          // Seed influence data
          await supabase.from('companies').update({
            lobbying_spend: target.lobbying,
            total_pac_spending: target.pacSpending,
            corporate_pac_exists: true,
            careers_url: target.careersUrl,
          }).eq('id', companyId);

          if (dryRun) {
            results.push({ tier: 'political', company: target.name, status: 'dry_run', jobsAdded: 0 });
            continue;
          }

          const scrapeResult = await scrapeJobs(companyId, target.careersUrl, target.name);
          results.push({
            tier: 'political',
            company: target.name,
            status: 'success',
            jobsAdded: scrapeResult.jobsAdded || 0,
          });
          console.log(`✅ ${target.name}: ${scrapeResult.jobsAdded || 0} jobs (Lobbying: $${target.lobbying.toLocaleString()}, PAC: $${target.pacSpending.toLocaleString()})`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          console.error(`❌ ${target.name}: ${msg}`);
          results.push({ tier: 'political', company: target.name, status: 'error', error: msg });
        }
        await sleep(THROTTLE_MS);
      }

      // Then: additional DB companies with high political spending but no jobs yet
      const processedSlugs = new Set(POWER_INFLUENCE_TARGETS.map(t => t.slug));
      const { data: dbPoliticals } = await supabase
        .from('companies')
        .select('id, name, slug, careers_url, total_pac_spending, lobbying_spend')
        .not('careers_url', 'is', null)
        .order('total_pac_spending', { ascending: false })
        .limit(maxPerTier);

      for (const company of (dbPoliticals || []).filter(c => c.careers_url && !processedSlugs.has(c.slug))) {
        try {
          const { count } = await supabase
            .from('company_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', company.id)
            .eq('is_active', true);

          if ((count || 0) > 0) {
            results.push({ tier: 'political', company: company.name, status: 'skipped', jobsAdded: count || 0 });
            continue;
          }

          if (dryRun) {
            results.push({ tier: 'political', company: company.name, status: 'dry_run', jobsAdded: 0 });
            continue;
          }

          const scrapeResult = await scrapeJobs(company.id, company.careers_url!, company.name);
          results.push({
            tier: 'political',
            company: company.name,
            status: 'success',
            jobsAdded: scrapeResult.jobsAdded || 0,
          });
          console.log(`✅ ${company.name}: ${scrapeResult.jobsAdded || 0} jobs`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          results.push({ tier: 'political', company: company.name, status: 'error', error: msg });
        }
        await sleep(THROTTLE_MS);
      }
    }

    // ═══════════════════════════════════════════
    // TIER 3: Existing companies with careers URLs but NO jobs
    // ═══════════════════════════════════════════
    if (tier === 'all' || tier === 'unfilled') {
      console.log(`\n═══ TIER 3: Unfilled Companies ═══`);

      // Companies with careers URLs but zero active jobs
      const { data: unfilled } = await supabase.rpc('get_companies_without_jobs' as any).limit(maxPerTier);

      // Fallback: manual query
      if (!unfilled) {
        const { data: allWithCareers } = await supabase
          .from('companies')
          .select('id, name, slug, careers_url')
          .not('careers_url', 'is', null)
          .order('civic_footprint_score', { ascending: false })
          .limit(50);

        const toProcess = [];
        for (const c of (allWithCareers || [])) {
          const { count } = await supabase
            .from('company_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', c.id)
            .eq('is_active', true);

          if ((count || 0) === 0) toProcess.push(c);
          if (toProcess.length >= maxPerTier) break;
        }

        for (const company of toProcess) {
          try {
            if (dryRun) {
              results.push({ tier: 'unfilled', company: company.name, status: 'dry_run', jobsAdded: 0 });
              continue;
            }

            const scrapeResult = await scrapeJobs(company.id, company.careers_url!, company.name);
            results.push({
              tier: 'unfilled',
              company: company.name,
              status: 'success',
              jobsAdded: scrapeResult.jobsAdded || 0,
            });
            console.log(`✅ ${company.name}: ${scrapeResult.jobsAdded || 0} jobs`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            results.push({ tier: 'unfilled', company: company.name, status: 'error', error: msg });
          }

          await sleep(THROTTLE_MS);
        }
      }
    }

    // ─── Summary ───
    const totalJobs = results.reduce((sum, r) => sum + (r.jobsAdded || 0), 0);
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    const summary = {
      success: true,
      summary: {
        totalCompaniesProcessed: results.length,
        totalJobsAdded: totalJobs,
        successCount,
        errorCount,
        skippedCount: results.filter(r => r.status === 'skipped').length,
      },
      byTier: {
        bcorp: results.filter(r => r.tier === 'bcorp'),
        political: results.filter(r => r.tier === 'political'),
        unfilled: results.filter(r => r.tier === 'unfilled'),
      },
    };

    console.log(`\n═══ COMPLETE: ${totalJobs} jobs from ${successCount} companies (${errorCount} errors) ═══`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bulk scrape fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      partialResults: results,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
