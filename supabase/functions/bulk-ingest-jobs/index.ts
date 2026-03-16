const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const targetSlugs: string[] | undefined = body.companySlugs;

    // Fetch companies with career URLs
    let query = supabase
      .from('companies')
      .select('id, name, slug, careers_url, website_url')
      .not('careers_url', 'is', null)
      .eq('record_status', 'active')
      .order('name');

    if (targetSlugs && targetSlugs.length > 0) {
      query = query.in('slug', targetSlugs);
    }

    const { data: companies, error: fetchErr } = await query.limit(100);
    if (fetchErr) throw fetchErr;

    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No companies with career URLs found', results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Bulk ingesting jobs for ${companies.length} companies...`);

    const results: { company: string; status: string; jobsAdded?: number; error?: string }[] = [];

    for (const company of companies) {
      try {
        // Call the existing job-scrape function
        const resp = await fetch(`${supabaseUrl}/functions/v1/job-scrape`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyId: company.id,
            careersUrl: company.careers_url,
            companyName: company.name,
          }),
        });

        const data = await resp.json();
        results.push({
          company: company.name,
          status: data.success ? 'ok' : 'error',
          jobsAdded: data.jobsAdded || 0,
          error: data.error,
        });

        console.log(`${company.name}: ${data.jobsAdded || 0} jobs ingested`);

        // Rate-limit: wait 2s between companies
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        results.push({
          company: company.name,
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    const totalJobs = results.reduce((sum, r) => sum + (r.jobsAdded || 0), 0);
    const successCount = results.filter(r => r.status === 'ok').length;

    return new Response(JSON.stringify({
      success: true,
      totalCompanies: companies.length,
      successCount,
      totalJobsIngested: totalJobs,
      results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Bulk ingest error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
