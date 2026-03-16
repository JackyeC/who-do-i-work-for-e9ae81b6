/**
 * Seed Gun Policy Companies
 * 
 * Seeds ~12 companies with documented gun policy activity,
 * then triggers sync-gun-policy-signals for each.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GUN_POLICY_COMPANIES = [
  { name: 'Smith & Wesson Brands', industry: 'Firearms Manufacturing', state: 'TN', description: 'Major US firearms manufacturer. Produces handguns, rifles, and accessories. Lobbies through NSSF trade association.' },
  { name: 'Sturm Ruger & Co', industry: 'Firearms Manufacturing', state: 'CT', description: 'One of the largest US firearms manufacturers by revenue. Publicly traded (RGR).' },
  { name: 'Walmart', industry: 'Retail', state: 'AR', description: 'Largest US retailer. Sold firearms until restricting handgun ammo sales and raising purchase age to 21 in 2019.' },
  { name: "Dick's Sporting Goods", industry: 'Retail', state: 'PA', description: 'Major sporting goods retailer. Removed assault-style rifles from all stores after Parkland shooting. CEO became gun safety advocate.' },
  { name: 'Kroger', industry: 'Retail', state: 'OH', description: 'Largest US supermarket chain. Requested customers not open-carry firearms in stores in 2019.' },
  { name: 'Vista Outdoor', industry: 'Ammunition Manufacturing', state: 'UT', description: 'Parent company of Federal and CCI ammunition brands. Major US ammunition manufacturer.' },
  { name: 'Sig Sauer', industry: 'Firearms Manufacturing', state: 'NH', description: 'Major firearms manufacturer. Supplier to US military (M17/M18 service pistol contract).' },
  { name: 'Bass Pro Shops', industry: 'Retail', state: 'MO', description: 'Major outdoor recreation retailer and firearms dealer. Parent of Cabela\'s.' },
  { name: 'Levi Strauss & Co', industry: 'Apparel', state: 'CA', description: 'Iconic American apparel company. CEO launched corporate gun safety advocacy group "Everytown Business Leaders."' },
  { name: 'Salesforce', industry: 'Technology', state: 'CA', description: 'Enterprise software company that restricted gun retailer clients from using its e-commerce platform for certain firearms sales.' },
  { name: 'Remington Arms', industry: 'Firearms Manufacturing', state: 'GA', description: 'Historic US firearms manufacturer. Settled Sandy Hook families lawsuit for $73M in 2022 — first gun manufacturer settlement of its kind.' },
  { name: 'Daniel Defense', industry: 'Firearms Manufacturing', state: 'GA', description: 'Firearms manufacturer whose products were used in high-profile mass shootings. Subject of congressional investigation on marketing practices.' },
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
    const results: { company: string; status: string; signals?: number }[] = [];

    for (const company of GUN_POLICY_COMPANIES) {
      const slug = slugify(company.name);

      // Upsert company
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
            creation_source: 'seed-gun-policy',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          console.warn(`[seed-gun-policy] Failed to insert ${company.name}:`, insertErr);
          results.push({ company: company.name, status: 'insert_failed' });
          continue;
        }
        companyId = inserted.id;
      }

      // Trigger sync
      try {
        const { error: syncErr } = await supabase.functions.invoke('sync-gun-policy-signals', {
          body: { companyId, companyName: company.name },
        });

        if (syncErr) {
          console.warn(`[seed-gun-policy] Sync failed for ${company.name}:`, syncErr);
          results.push({ company: company.name, status: 'sync_failed' });
        } else {
          results.push({ company: company.name, status: 'synced' });
        }
      } catch (e) {
        console.warn(`[seed-gun-policy] Sync error for ${company.name}:`, e);
        results.push({ company: company.name, status: 'sync_error' });
      }

      // Throttle
      await new Promise(r => setTimeout(r, 2000));
    }

    console.log(`[seed-gun-policy] Done. ${results.filter(r => r.status === 'synced').length}/${results.length} succeeded.`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[seed-gun-policy] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
