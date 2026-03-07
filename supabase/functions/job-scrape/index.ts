const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, careersUrl, companyName } = await req.json();

    if (!companyId || !careersUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and careersUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping jobs from: ${careersUrl} for company ${companyName || companyId}`);

    // Step 1: Use Firecrawl to scrape the careers page
    const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: careersUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!scrapeResp.ok) {
      const errData = await scrapeResp.json();
      console.error('Firecrawl error:', errData);
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl scrape failed: ${errData.error || scrapeResp.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResp.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

    if (!markdown || markdown.length < 50) {
      console.log('No meaningful content scraped, trying map + crawl approach');
      // Try mapping the careers URL to find job listing pages
      const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: careersUrl,
          search: 'jobs careers positions openings',
          limit: 20,
        }),
      });

      if (mapResp.ok) {
        const mapData = await mapResp.json();
        const jobUrls = (mapData.links || []).slice(0, 5);
        console.log(`Found ${jobUrls.length} potential job pages`);
      }
    }

    // Step 2: Use AI to extract structured job data from the scraped content
    const truncatedContent = markdown.slice(0, 15000);

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You extract structured job listings from career page content. Return only valid JSON.'
          },
          {
            role: 'user',
            content: `Extract job listings from this careers page content for "${companyName || 'this company'}". 

Return a JSON array of jobs with this structure:
[
  {
    "title": "Job Title",
    "department": "Engineering",
    "location": "City, State or Remote",
    "employment_type": "full-time|part-time|contract|internship",
    "description": "Brief 1-2 sentence description of the role",
    "url": "Direct URL to the job posting if available, or null",
    "salary_range": "$X - $Y if mentioned, or null"
  }
]

Extract up to 25 jobs. If no jobs are found, return an empty array [].

Content:
${truncatedContent}`
          }
        ],
      }),
    });

    if (!aiResp.ok) {
      console.error('AI extraction failed:', aiResp.status);
      return new Response(
        JSON.stringify({ success: false, error: 'AI job extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';

    let jobs: any[];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      jobs = JSON.parse(jsonMatch[1].trim());
      if (!Array.isArray(jobs)) jobs = [];
    } catch {
      console.error('Failed to parse job listings:', content.slice(0, 500));
      jobs = [];
    }

    console.log(`Extracted ${jobs.length} jobs for ${companyName}`);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No jobs found on the careers page',
        jobsAdded: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: Clear old jobs and insert new ones
    await supabase.from('company_jobs').delete().eq('company_id', companyId);

    const { error: insertErr } = await supabase.from('company_jobs').insert(
      jobs.slice(0, 25).map((j: any) => ({
        company_id: companyId,
        title: j.title,
        department: j.department || null,
        location: j.location || null,
        employment_type: j.employment_type || 'full-time',
        description: j.description || null,
        url: j.url || careersUrl,
        salary_range: j.salary_range || null,
        scraped_at: new Date().toISOString(),
      }))
    );

    if (insertErr) {
      console.error('Failed to insert jobs:', insertErr);
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to save jobs: ${insertErr.message}`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      jobsAdded: jobs.length,
      companyId,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Job scrape error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
