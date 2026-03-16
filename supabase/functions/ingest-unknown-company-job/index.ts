const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Ingests a job from a company not yet in the database
// Creates a placeholder company flagged as "Needs Insider Audit"
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { companyName, careersUrl, websiteUrl, industry, state } = await req.json();

    if (!companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if company already exists
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Company already exists',
        companyId: existing.id,
        isNew: false,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create placeholder company flagged for audit
    const { data: newCompany, error: insertErr } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        slug,
        industry: industry || 'Unknown',
        state: state || 'Unknown',
        careers_url: careersUrl || null,
        website_url: websiteUrl || null,
        record_status: 'pending',
        vetted_status: 'needs_audit',
        confidence_rating: 'low',
        creation_source: 'job_ingestion',
        verification_notes: 'Auto-created via job ingestion — Needs Insider Audit',
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    // If we have a careers URL, trigger job scraping
    if (careersUrl && newCompany) {
      await fetch(`${supabaseUrl}/functions/v1/job-scrape`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: newCompany.id,
          careersUrl,
          companyName,
        }),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      companyId: newCompany?.id,
      isNew: true,
      message: `Company "${companyName}" created and flagged for Insider Audit`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Ingest unknown company error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
