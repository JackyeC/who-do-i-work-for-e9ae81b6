/**
 * Seed Civil Rights Companies
 * 
 * Seeds ~12 companies with documented civil rights activity,
 * then triggers sync-civil-rights-signals for each.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CIVIL_RIGHTS_COMPANIES = [
  { name: 'Tesla', industry: 'Automotive / EV', state: 'TX', description: 'EEOC race discrimination lawsuit for Fremont factory. HRC CEI non-participant.' },
  { name: 'Meta Platforms', industry: 'Technology', state: 'CA', description: '$14.25M DOJ/EEOC settlement for discriminating against US workers. HRC CEI 100/100.' },
  { name: 'Amazon', industry: 'Technology / E-Commerce', state: 'WA', description: 'EEOC disability discrimination suit. HRC CEI 100/100. Racial equity pledges post-2020.' },
  { name: 'Walt Disney Company', industry: 'Entertainment', state: 'CA', description: 'HRC CEI 100/100. Public advocacy on LGBTQ rights (Florida "Don\'t Say Gay" opposition).' },
  { name: 'Target Corporation', industry: 'Retail', state: 'MN', description: 'EEOC settlement for discriminatory pre-employment tests. HRC CEI 100/100. DEI rollback controversy 2024.' },
  { name: 'FedEx', industry: 'Logistics', state: 'TN', description: '$3.5M EEOC settlement for refusing to hire deaf package handlers.' },
  { name: 'Dollar General', industry: 'Retail', state: 'TN', description: '$6M EEOC race discrimination settlement over criminal background check policies.' },
  { name: 'Nike', industry: 'Apparel', state: 'OR', description: 'HRC CEI 100/100. Colin Kaepernick campaign. Gender discrimination lawsuits from female employees.' },
  { name: 'Starbucks', industry: 'Food & Beverage', state: 'WA', description: 'HRC CEI 100/100. Racial bias training after Philadelphia incident. LGBTQ benefits leader.' },
  { name: 'Goldman Sachs', industry: 'Investment Banking', state: 'NY', description: 'HRC CEI 100/100. Gender discrimination class action ($215M settlement). Diversity commitments.' },
  { name: 'Microsoft', industry: 'Technology', state: 'WA', description: 'HRC CEI 100/100. Published human rights policy. Accessibility advocate. Racial equity initiative.' },
  { name: 'Chick-fil-A', industry: 'Food & Beverage', state: 'GA', description: 'Controversial donations to organizations opposing LGBTQ rights. Changed foundation policy in 2019.' },
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

    for (const company of CIVIL_RIGHTS_COMPANIES) {
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
            creation_source: 'seed-civil-rights',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          console.warn(`[seed-civil-rights] Failed to insert ${company.name}:`, insertErr);
          results.push({ company: company.name, status: 'insert_failed' });
          continue;
        }
        companyId = inserted.id;
      }

      try {
        const { error: syncErr } = await supabase.functions.invoke('sync-civil-rights-signals', {
          body: { companyId, companyName: company.name },
        });

        if (syncErr) {
          console.warn(`[seed-civil-rights] Sync failed for ${company.name}:`, syncErr);
          results.push({ company: company.name, status: 'sync_failed' });
        } else {
          results.push({ company: company.name, status: 'synced' });
        }
      } catch (e) {
        console.warn(`[seed-civil-rights] Sync error for ${company.name}:`, e);
        results.push({ company: company.name, status: 'sync_error' });
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[seed-civil-rights] Done. ${results.filter(r => r.status === 'synced').length}/${results.length} succeeded.`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[seed-civil-rights] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
