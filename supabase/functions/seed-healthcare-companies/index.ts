/**
 * Seed Healthcare Companies
 * 
 * Seeds ~12 companies with documented healthcare-related activity,
 * then triggers sync-healthcare-signals for each.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const HEALTHCARE_COMPANIES = [
  { name: 'Amazon', industry: 'Technology / E-Commerce', state: 'WA', description: 'Amazon Pharmacy, Amazon Clinic, DOL healthcare access investigations, mental health programs.' },
  { name: 'UnitedHealth Group', industry: 'Health Insurance', state: 'MN', description: 'Largest US health insurer. Major healthcare lobbying on ACA, Medicare Advantage, mental health parity.' },
  { name: 'CVS Health', industry: 'Healthcare / Pharmacy', state: 'RI', description: 'PBM and pharmacy giant. Major lobbying on pharmacy benefit regulation and drug pricing.' },
  { name: 'Johnson & Johnson', industry: 'Pharmaceuticals', state: 'NJ', description: 'Pharmaceutical and medical device manufacturer. Lobbying on FDA, drug pricing under IRA.' },
  { name: 'Pfizer', industry: 'Pharmaceuticals', state: 'NY', description: 'Major pharma. Lobbied heavily on Inflation Reduction Act drug pricing, patent protections, vaccine policy.' },
  { name: 'Walmart', industry: 'Retail', state: 'AR', description: 'Walmart Health clinics (closed 2024). Pharmacy regulation lobbying. DOL EBSA benefits investigation.' },
  { name: 'Starbucks', industry: 'Food & Beverage', state: 'WA', description: 'Gender-affirming care pioneer. 20 free therapy sessions via Lyra. Reproductive healthcare travel benefit.' },
  { name: 'Apple', industry: 'Technology', state: 'CA', description: 'Fertility benefits (egg freezing, IVF). Gender-affirming care coverage. Apple Health initiatives.' },
  { name: 'Microsoft', industry: 'Technology', state: 'WA', description: 'Comprehensive fertility, gender-affirming care, and mental health benefits. HRC CEI 100/100.' },
  { name: 'Tesla', industry: 'Automotive / EV', state: 'TX', description: 'Reports of high deductibles, limited mental health. OSHA referral on injury reporting suppression.' },
  { name: 'Meta Platforms', industry: 'Technology', state: 'CA', description: '$40K fertility benefits. Lyra Health mental health partnership. Comprehensive healthcare package.' },
  { name: 'Dollar General', industry: 'Retail', state: 'TN', description: 'Reports of inadequate healthcare coverage for part-time and seasonal workers.' },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const results: { company: string; status: string }[] = [];

    for (const company of HEALTHCARE_COMPANIES) {
      const slug = slugify(company.name);

      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      let companyId: string;

      if (existing) {
        companyId = existing.id;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            slug,
            industry: company.industry,
            state: company.state,
            description: company.description,
            creation_source: 'seed-healthcare',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          console.warn(`[seed-healthcare] Failed to insert ${company.name}:`, insertErr);
          results.push({ company: company.name, status: 'insert_failed' });
          continue;
        }
        companyId = inserted.id;
      }

      try {
        const { error: syncErr } = await supabase.functions.invoke('sync-healthcare-signals', {
          body: { companyId, companyName: company.name },
        });

        if (syncErr) {
          console.warn(`[seed-healthcare] Sync failed for ${company.name}:`, syncErr);
          results.push({ company: company.name, status: 'sync_failed' });
        } else {
          results.push({ company: company.name, status: 'synced' });
        }
      } catch (e) {
        console.warn(`[seed-healthcare] Sync error for ${company.name}:`, e);
        results.push({ company: company.name, status: 'sync_error' });
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[seed-healthcare] Done. ${results.filter(r => r.status === 'synced').length}/${results.length} succeeded.`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[seed-healthcare] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
