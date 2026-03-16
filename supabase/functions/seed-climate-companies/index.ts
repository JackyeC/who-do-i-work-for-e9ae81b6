/**
 * Seed Climate Companies
 * 
 * Seeds ~12 companies with known climate-related activity,
 * then triggers sync-climate-signals for each.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CLIMATE_COMPANIES = [
  { name: 'ExxonMobil', industry: 'Oil & Gas', state: 'TX', slug: 'exxonmobil', description: 'One of the largest fossil fuel companies. Top EPA GHGRP reporter with extensive lobbying on climate and energy regulation.' },
  { name: 'Chevron', industry: 'Oil & Gas', state: 'CA', slug: 'chevron', description: 'Major integrated energy company. Significant EPA-reported emissions and target of multiple climate lawsuits.' },
  { name: 'Shell USA', industry: 'Oil & Gas', state: 'TX', slug: 'shell-usa', description: 'US operations of Shell plc. Net-zero pledge alongside continued fossil fuel expansion.' },
  { name: 'Duke Energy', industry: 'Utilities', state: 'NC', slug: 'duke-energy', description: 'Largest electric utility in the US by total generation. Major EPA GHGRP reporter transitioning from coal.' },
  { name: 'NextEra Energy', industry: 'Utilities', state: 'FL', slug: 'nextera-energy', description: 'Largest generator of wind and solar energy in the world. Leading utility in renewable energy transition.' },
  { name: 'Tesla', industry: 'Automotive', state: 'TX', slug: 'tesla', description: 'Electric vehicle manufacturer. Zero direct tailpipe emissions, sold regulatory credits to other automakers.' },
  { name: 'Microsoft', industry: 'Technology', state: 'WA', slug: 'microsoft', description: 'Pledged carbon negative by 2030. Largest corporate renewable energy buyer. Data center emissions growing.' },
  { name: 'Amazon', industry: 'Technology', state: 'WA', slug: 'amazon', description: 'Co-founded The Climate Pledge (net-zero by 2040). Significant logistics and data center emissions reported to EPA.' },
  { name: 'BP America', industry: 'Oil & Gas', state: 'TX', slug: 'bp-america', description: 'US operations of BP plc. Net-zero target by 2050, subject of greenwashing litigation.' },
  { name: 'Marathon Petroleum', industry: 'Oil & Gas', state: 'OH', slug: 'marathon-petroleum', description: 'Largest petroleum refiner in the US. Major EPA GHGRP reporter. Lobbied against clean fuel standards.' },
  { name: 'Patagonia', industry: 'Retail', state: 'CA', slug: 'patagonia', description: '1% for the Planet member. B Corp certified. Donated company ownership to climate trust.' },
  { name: 'Dow', industry: 'Chemicals', state: 'MI', slug: 'dow', description: 'Major industrial chemical manufacturer. Significant EPA-reported emissions from manufacturing operations.' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: { company: string; status: string; signals?: number; error?: string }[] = [];

  for (const company of CLIMATE_COMPANIES) {
    try {
      // Check if company already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id, name')
        .ilike('name', `%${company.name}%`)
        .limit(1)
        .maybeSingle();

      let companyId: string;

      if (existing) {
        companyId = existing.id;
        console.log(`[seed-climate] Found existing: ${existing.name} (${companyId})`);
      } else {
        const { data: created, error: createErr } = await supabase
          .from('companies')
          .insert({
            name: company.name,
            industry: company.industry,
            state: company.state,
            slug: company.slug,
            description: company.description,
            creation_source: 'seed-climate-companies',
            confidence_rating: 'high',
            record_status: 'active',
          })
          .select('id')
          .single();

        if (createErr || !created) {
          console.error(`[seed-climate] Failed to create ${company.name}:`, createErr);
          results.push({ company: company.name, status: 'failed', error: createErr?.message });
          continue;
        }
        companyId = created.id;
        console.log(`[seed-climate] Created: ${company.name} (${companyId})`);
      }

      // Trigger sync-climate-signals
      const { error: syncErr } = await supabase.functions.invoke('sync-climate-signals', {
        body: { companyId, companyName: company.name },
      });

      if (syncErr) {
        console.warn(`[seed-climate] Sync failed for ${company.name}:`, syncErr.message);
        results.push({ company: company.name, status: 'sync_failed', error: syncErr.message });
      } else {
        results.push({ company: company.name, status: 'success' });
      }

      // Throttle
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.error(`[seed-climate] Error for ${company.name}:`, e);
      results.push({ company: company.name, status: 'error', error: e instanceof Error ? e.message : 'Unknown' });
    }
  }

  const succeeded = results.filter(r => r.status === 'success').length;
  console.log(`[seed-climate] Done. ${succeeded}/${CLIMATE_COMPANIES.length} succeeded.`);

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
