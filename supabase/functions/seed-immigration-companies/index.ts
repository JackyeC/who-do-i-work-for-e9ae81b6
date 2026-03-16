/**
 * Seed Immigration Companies
 * 
 * One-time seeder that ensures ~12 companies with known immigration-related
 * activity exist in the directory, then triggers sync-immigration-signals
 * for each one.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TARGET_COMPANIES = [
  { name: 'Google', slug: 'google', industry: 'Technology', state: 'CA', description: 'Top H-1B sponsor with 8,000+ LCAs annually. Active in immigration advocacy coalitions.' },
  { name: 'Amazon', slug: 'amazon', industry: 'Technology', state: 'WA', description: 'Major H-1B sponsor for tech roles and H-2B for warehouse/logistics.' },
  { name: 'Microsoft', slug: 'microsoft', industry: 'Technology', state: 'WA', description: 'Top H-1B sponsor. Public advocacy for high-skilled immigration reform.' },
  { name: 'Meta', slug: 'meta', industry: 'Technology', state: 'CA', description: 'Large H-1B program. Co-founded FWD.us immigration advocacy coalition.' },
  { name: 'Infosys', slug: 'infosys', industry: 'Technology', state: 'TX', description: 'Largest H-1B sponsor by volume. IT outsourcing firm with 30,000+ annual LCAs.' },
  { name: 'Tata Consultancy Services', slug: 'tata-consultancy', industry: 'Technology', state: 'NJ', description: 'Major H-1B outsourcing sponsor. Second largest by visa volume.' },
  { name: 'JPMorgan Chase', slug: 'jpmorgan-chase', industry: 'Financial Services', state: 'NY', description: 'Large H-1B program for finance and tech roles. Active immigration lobbying.' },
  { name: 'Tyson Foods', slug: 'tyson-foods', industry: 'Food / Agriculture', state: 'AR', description: 'H-2A/H-2B agricultural and processing visas. History of ICE enforcement actions.' },
  { name: 'Walmart', slug: 'walmart', industry: 'Retail', state: 'AR', description: 'H-1B sponsor for tech division. Immigration lobbying through trade associations.' },
  { name: 'Deloitte', slug: 'deloitte', industry: 'Professional Services', state: 'NY', description: 'Large H-1B consulting sponsor. Major visa-dependent professional services firm.' },
  { name: 'Apple', slug: 'apple', industry: 'Technology', state: 'CA', description: 'H-1B sponsor. Tim Cook publicly advocated for DACA and immigration reform.' },
  { name: 'Marriott International', slug: 'marriott', industry: 'Hospitality', state: 'MD', description: 'Major H-2B hospitality visa sponsor for seasonal hotel workers.' },
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

    for (const company of TARGET_COMPANIES) {
      // Check if company exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', `%${company.name}%`)
        .limit(1);

      let companyId: string;

      if (existing && existing.length > 0) {
        companyId = existing[0].id;
        console.log(`[seed-immigration] Found existing: ${existing[0].name} (${companyId})`);
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            slug: company.slug || slugify(company.name),
            industry: company.industry,
            state: company.state,
            description: company.description,
            creation_source: 'seed-immigration-companies',
            record_status: 'published',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          console.error(`[seed-immigration] Failed to insert ${company.name}:`, insertErr);
          results.push({ company: company.name, status: 'insert_failed' });
          continue;
        }
        companyId = inserted.id;
        console.log(`[seed-immigration] Created: ${company.name} (${companyId})`);
      }

      // Trigger sync-immigration-signals
      try {
        const { data, error } = await supabase.functions.invoke('sync-immigration-signals', {
          body: { companyId, companyName: company.name },
        });

        if (error) {
          console.warn(`[seed-immigration] Sync failed for ${company.name}:`, error.message);
          results.push({ company: company.name, status: 'sync_failed' });
        } else {
          results.push({ company: company.name, status: 'synced', signals: data?.totalSignals || 0 });
        }
      } catch (e) {
        console.warn(`[seed-immigration] Sync error for ${company.name}:`, e);
        results.push({ company: company.name, status: 'sync_error' });
      }

      // Throttle between companies
      await new Promise(r => setTimeout(r, 3000));
    }

    console.log(`[seed-immigration] Done. ${results.length} companies processed.`);

    return new Response(JSON.stringify({
      success: true,
      companiesProcessed: results.length,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[seed-immigration] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
