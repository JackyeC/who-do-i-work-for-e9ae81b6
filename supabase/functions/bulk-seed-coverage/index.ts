const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { syncCompanyNews } from '../_shared/company-news-sync.ts';

const TOP_COMPANIES = [
  { id: 'd4e5f6a7-b8c9-0123-defa-234567890123', name: 'Amazon' },
  { id: 'f6a7b8c9-d0e1-2345-fabc-456789012345', name: 'Apple Inc.' },
  { id: '99009449-0ef6-4563-bd80-c53efd1c8441', name: 'Google' },
  { id: 'c9d0e1f2-a3b4-5678-cdef-789012345678', name: 'JPMorgan Chase' },
  { id: 'e5f6a7b8-c9d0-1234-efab-345678901234', name: 'Meta Platforms' },
  { id: 'e3f4a5b6-c7d8-9012-efab-bcdef0123456', name: 'Microsoft' },
  { id: 'd6e7f8a9-b0c1-2678-defa-890123456789', name: 'Nike' },
  { id: 'd0e1f2a3-b4c5-6012-defa-234567890123', name: 'Tesla' },
  { id: 'c7d8e9f0-a1b2-3456-cdef-f01234567890', name: 'The Walt Disney Company' },
  { id: 'a7b8c9d0-e1f2-3456-abcd-567890123456', name: 'Walmart' },
];

const SYNC_FUNCTIONS = [
  { name: 'sync-sec-edgar', paramStyle: 'camel' },
  { name: 'sync-openfec', paramStyle: 'camel' },
  { name: 'warn-scan', paramStyle: 'snake' },
] as const;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const results: Record<string, any> = {};

  // Parse optional params
  let body: any = {};
  try { body = await req.json(); } catch {}
  const sources = body.sources || ['news', 'sec', 'fec', 'warn'];
  const companyFilter = body.companies; // optional array of company names

  const companies = companyFilter
    ? TOP_COMPANIES.filter(c => companyFilter.includes(c.name) || companyFilter.includes(c.id))
    : TOP_COMPANIES;

  for (const company of companies) {
    const companyResults: Record<string, any> = {};

    // News (direct, no edge function call needed)
    if (sources.includes('news')) {
      try {
        const newsResult = await syncCompanyNews(supabase, company.id, company.name);
        companyResults.news = newsResult;
        console.log(`[bulk-seed] News for ${company.name}: ${newsResult.count} articles`);
      } catch (e: any) {
        companyResults.news = { error: e.message };
        console.error(`[bulk-seed] News error for ${company.name}:`, e.message);
      }
      await sleep(1000);
    }

    // SEC
    if (sources.includes('sec')) {
      try {
        const { data, error } = await supabase.functions.invoke('sync-sec-edgar', {
          body: { companyId: company.id, companyName: company.name },
        });
        companyResults.sec = error ? { error: error.message } : data;
        console.log(`[bulk-seed] SEC for ${company.name}: ${data?.stats?.signalsCreated || 0} signals`);
      } catch (e: any) {
        companyResults.sec = { error: e.message };
      }
      await sleep(2000);
    }

    // FEC
    if (sources.includes('fec')) {
      try {
        const { data, error } = await supabase.functions.invoke('sync-openfec', {
          body: { companyId: company.id, companyName: company.name },
        });
        companyResults.fec = error ? { error: error.message } : data;
        console.log(`[bulk-seed] FEC for ${company.name}: done`);
      } catch (e: any) {
        companyResults.fec = { error: e.message };
      }
      await sleep(3000);
    }

    // WARN
    if (sources.includes('warn')) {
      try {
        const { data, error } = await supabase.functions.invoke('warn-scan', {
          body: { company_id: company.id, company_name: company.name },
        });
        companyResults.warn = error ? { error: error.message } : data;
        console.log(`[bulk-seed] WARN for ${company.name}: done`);
      } catch (e: any) {
        companyResults.warn = { error: e.message };
      }
      await sleep(2000);
    }

    results[company.name] = companyResults;
  }

  console.log(`[bulk-seed] ✅ Complete. Processed ${companies.length} companies.`);

  return new Response(JSON.stringify({
    success: true,
    companiesProcessed: companies.length,
    results,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
