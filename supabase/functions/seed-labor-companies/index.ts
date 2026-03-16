/**
 * Seed Labor Companies
 * 
 * One-time function that ensures 15 target labor-rights companies
 * exist in the directory and triggers sync-labor-rights scans for each.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const LABOR_COMPANIES = [
  { name: 'Amazon', slug: 'amazon', industry: 'Technology', state: 'WA', description: 'E-commerce and cloud computing giant. Subject to OSHA violations, WHD cases, and significant anti-union activity including NLRB complaints at multiple warehouses.', known_for: 'Anti-union activity, OSHA violations, warehouse safety' },
  { name: 'Starbucks', slug: 'starbucks', industry: 'Food & Beverage', state: 'WA', description: 'Global coffeehouse chain at the center of the largest US union organizing wave since the 1930s. Over 400 NLRB unfair labor practice complaints filed.', known_for: 'Union-busting NLRB complaints, Workers United campaign' },
  { name: 'Walmart', slug: 'walmart', industry: 'Retail', state: 'AR', description: 'Largest private employer in the US with a long history of wage violations, anti-union activity, and DOL enforcement actions.', known_for: 'Wage violations, anti-union history, WHD cases' },
  { name: 'Tyson Foods', slug: 'tyson-foods', industry: 'Food & Agriculture', state: 'AR', description: 'One of the largest meatpacking companies. Extensive OSHA violation history, immigration labor issues, and workplace safety concerns.', known_for: 'OSHA violations, meatpacking safety, immigration labor' },
  { name: 'Tesla', slug: 'tesla', industry: 'Automotive', state: 'TX', description: 'Electric vehicle manufacturer with multiple NLRB complaints, OSHA violations at Fremont plant, and anti-union social media activity by executives.', known_for: 'NLRB complaints, safety violations, anti-union tweets' },
  { name: 'Dollar General', slug: 'dollar-general', industry: 'Retail', state: 'TN', description: 'Discount retailer designated an OSHA "severe violator" for repeated willful safety violations across hundreds of stores.', known_for: 'OSHA severe violator, blocked exits, understaffing' },
  { name: 'Costco', slug: 'costco', industry: 'Retail', state: 'WA', description: 'Warehouse club retailer known for above-average wages, good benefits, and relatively positive labor relations compared to industry peers.', known_for: 'Pro-worker wages, good benefits, union-neutral' },
  { name: 'Patagonia', slug: 'patagonia', industry: 'Retail & Apparel', state: 'CA', description: 'Outdoor apparel company known as a B-Corp with strong pro-labor stances, fair trade certification, and worker-friendly policies.', known_for: 'Pro-labor, B-Corp, fair trade, worker advocacy' },
  { name: 'REI', slug: 'rei', industry: 'Retail', state: 'WA', description: 'Consumer cooperative that experienced a unionization wave starting in 2022, with multiple stores organizing with RWDSU.', known_for: 'Unionization wave, cooperative structure, RWDSU' },
  { name: "Trader Joe's", slug: 'trader-joes', industry: 'Grocery', state: 'CA', description: 'Specialty grocery chain where employees formed Trader Joe\'s United, an independent union, at multiple locations starting in 2022.', known_for: 'Independent union drives, Trader Joe\'s United' },
  { name: 'UPS', slug: 'ups', industry: 'Logistics', state: 'GA', description: 'Largest unionized employer in the US. The 2023 Teamsters contract covering 340,000 workers was the largest private-sector union contract in history.', known_for: 'Major Teamsters union contract, largest private union' },
  { name: 'John Deere', slug: 'john-deere', industry: 'Manufacturing', state: 'IL', description: 'Heavy equipment manufacturer where 10,000+ UAW workers went on strike in 2021, winning significant wage and benefit improvements.', known_for: 'UAW strike 2021, manufacturing union, right to repair' },
  { name: "Kellogg's", slug: 'kelloggs', industry: 'Food & Beverage', state: 'MI', description: 'Cereal manufacturer where BCTGM union workers struck for 77 days in 2021 over two-tier wage system and permanent vs temporary worker treatment.', known_for: 'BCTGM strike, two-tier wage system, worker solidarity' },
  { name: 'Chipotle', slug: 'chipotle', industry: 'Food & Beverage', state: 'CA', description: 'Fast-casual restaurant chain with multiple NLRB violations including illegally closing a unionized store in Augusta, Maine.', known_for: 'NLRB violations, store closures, child labor violations' },
  { name: 'Apple', slug: 'apple', industry: 'Technology', state: 'CA', description: 'Technology giant facing retail union organizing at Apple Stores nationwide, with IAM and CWA unions leading campaigns.', known_for: 'Retail union drives, IAM/CWA organizing, Towson store' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const results: { company: string; status: string; signalsFound?: number }[] = [];

    for (const company of LABOR_COMPANIES) {
      console.log(`[seed-labor] Processing: ${company.name}`);

      // Check if company exists
      let { data: existing } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', company.name)
        .limit(1)
        .maybeSingle();

      // Also check slug
      if (!existing) {
        const { data: bySlug } = await supabase
          .from('companies')
          .select('id, name')
          .eq('slug', company.slug)
          .maybeSingle();
        existing = bySlug;
      }

      let companyId: string;

      if (existing) {
        companyId = existing.id;
        console.log(`[seed-labor] Found existing: ${existing.name} (${companyId})`);
      } else {
        // Insert new company
        const { data: inserted, error: insertErr } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            slug: company.slug,
            industry: company.industry,
            state: company.state,
            description: company.description,
            creation_source: 'labor_rights_seed',
            record_status: 'active',
            confidence_rating: 'medium',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          console.error(`[seed-labor] Failed to insert ${company.name}:`, insertErr);
          results.push({ company: company.name, status: 'insert_failed' });
          continue;
        }
        companyId = inserted.id;
        console.log(`[seed-labor] Created: ${company.name} (${companyId})`);
      }

      // Trigger labor rights scan
      try {
        const { data: scanResult, error: scanErr } = await supabase.functions.invoke('sync-labor-rights', {
          body: { companyId, companyName: company.name },
        });

        if (scanErr) {
          console.warn(`[seed-labor] Scan failed for ${company.name}:`, scanErr);
          results.push({ company: company.name, status: 'scan_failed' });
        } else {
          results.push({
            company: company.name,
            status: 'success',
            signalsFound: scanResult?.totalSignals || 0,
          });
        }
      } catch (e) {
        console.warn(`[seed-labor] Scan error for ${company.name}:`, e);
        results.push({ company: company.name, status: 'scan_error' });
      }

      // Throttle between companies (respect API rate limits)
      await new Promise(r => setTimeout(r, 5000));
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const totalSignals = results.reduce((s, r) => s + (r.signalsFound || 0), 0);

    console.log(`[seed-labor] COMPLETE: ${successCount}/${LABOR_COMPANIES.length} companies, ${totalSignals} total signals`);

    return new Response(JSON.stringify({
      success: true,
      companiesProcessed: LABOR_COMPANIES.length,
      companiesSucceeded: successCount,
      totalSignals,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[seed-labor] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
