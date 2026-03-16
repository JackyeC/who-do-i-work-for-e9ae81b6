/**
 * Seed Consumer Protection Companies
 * Seeds ~12 companies with documented consumer protection activity,
 * then triggers sync-consumer-protection-signals for each.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CONSUMER_PROTECTION_COMPANIES = [
  { name: 'Wells Fargo', industry: 'Banking', state: 'CA', description: 'CFPB $3.7B penalty for fake accounts, wrongful foreclosures. Massive consumer complaint volume.' },
  { name: 'Equifax', industry: 'Credit Reporting', state: 'GA', description: 'FTC $700M settlement for 2017 breach exposing 147M consumers. Major privacy violation.' },
  { name: 'Meta Platforms', industry: 'Technology', state: 'CA', description: 'FTC $5B privacy settlement (Cambridge Analytica). 533M user records exposed.' },
  { name: 'Amazon', industry: 'Technology / E-Commerce', state: 'WA', description: 'FTC $25M Alexa/COPPA settlement, $5.8M Ring privacy settlement. CFPB complaints.' },
  { name: 'Google', industry: 'Technology', state: 'CA', description: 'FTC $170M YouTube COPPA settlement. Privacy enforcement actions.' },
  { name: 'T-Mobile', industry: 'Telecommunications', state: 'WA', description: 'FCC $31.5M data breach settlement. 76.6M customer records exposed in 2021.' },
  { name: 'Capital One', industry: 'Banking', state: 'VA', description: '106M credit applicant records exposed in 2019 breach. CFPB enforcement.' },
  { name: 'JPMorgan Chase', industry: 'Banking', state: 'NY', description: 'High volume CFPB complaints. Consumer banking enforcement actions.' },
  { name: 'Epic Games', industry: 'Gaming', state: 'NC', description: 'FTC $520M for COPPA violations and dark patterns in Fortnite.' },
  { name: 'Walmart', industry: 'Retail', state: 'AR', description: 'FTC deceptive pricing investigation. CPSC product recalls. High CFPB complaint volume.' },
  { name: 'Johnson & Johnson', industry: 'Pharmaceuticals', state: 'NJ', description: 'Multiple FDA recalls. Talc product litigation. Consumer safety enforcement.' },
  { name: 'Marriott International', industry: 'Hospitality', state: 'MD', description: 'Starwood data breach: 500M guest records exposed. FTC privacy enforcement.' },
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

    for (const company of CONSUMER_PROTECTION_COMPANIES) {
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
            creation_source: 'seed-consumer-protection',
          })
          .select('id')
          .single();

        if (insertErr || !inserted) {
          console.warn(`[seed-consumer-protection] Failed to insert ${company.name}:`, insertErr);
          results.push({ company: company.name, status: 'insert_failed' });
          continue;
        }
        companyId = inserted.id;
      }

      try {
        const { error: syncErr } = await supabase.functions.invoke('sync-consumer-protection-signals', {
          body: { companyId, companyName: company.name },
        });
        results.push({ company: company.name, status: syncErr ? 'sync_failed' : 'synced' });
      } catch (e) {
        results.push({ company: company.name, status: 'sync_error' });
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
