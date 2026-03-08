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

    // Step 1: Map the careers site to find individual job listing pages
    let allMarkdown = '';

    // First try to map the site for job-specific URLs
    const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: careersUrl,
        search: 'jobs careers positions openings apply',
        limit: 30,
      }),
    });

    let jobPageUrls: string[] = [];
    if (mapResp.ok) {
      const mapData = await mapResp.json();
      const allLinks = mapData.links || [];
      // Filter for links that look like individual job listings
      jobPageUrls = allLinks.filter((url: string) => {
        const lower = url.toLowerCase();
        return (
          lower.includes('/job') ||
          lower.includes('/position') ||
          lower.includes('/career') ||
          lower.includes('/opening') ||
          lower.includes('/apply') ||
          lower.includes('/role') ||
          lower.includes('/opportunity') ||
          lower.includes('lever.co') ||
          lower.includes('greenhouse.io') ||
          lower.includes('workday.com') ||
          lower.includes('ashbyhq.com') ||
          lower.includes('boards.') ||
          lower.includes('jobs.')
        );
      }).slice(0, 10);
      console.log(`Map found ${allLinks.length} total links, ${jobPageUrls.length} look like job pages`);
    }

    // Step 2: Scrape the main careers page + up to 3 job sub-pages
    const urlsToScrape = [careersUrl, ...jobPageUrls.slice(0, 3)];
    
    for (const url of urlsToScrape) {
      try {
        const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 5000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const md = scrapeData.data?.markdown || scrapeData.markdown || '';
          if (md.length > 50) {
            allMarkdown += `\n\n--- PAGE: ${url} ---\n${md}`;
          }
        }
      } catch (e) {
        console.warn(`Failed to scrape ${url}:`, e);
      }
    }

    if (!allMarkdown || allMarkdown.length < 100) {
      console.log('No meaningful content scraped from any pages');
      return new Response(JSON.stringify({
        success: true,
        message: 'No content found on career pages',
        jobsAdded: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: Use AI to extract structured job data
    const truncatedContent = allMarkdown.slice(0, 20000);

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
            content: `You extract REAL job listings from career page content. Return only valid JSON.

CRITICAL RULES:
- Only extract ACTUAL job openings with specific titles (e.g. "Senior Software Engineer", "Marketing Manager")
- DO NOT include generic page elements like "Join our mission", "See open roles", "Apply now", "Learn more"
- DO NOT include department headers or team names as job titles
- Each job must have a specific, real job title that someone would apply for
- If no real job listings are found, return an empty array []`
          },
          {
            role: 'user',
            content: `Extract REAL job listings from these career pages for "${companyName || 'this company'}". 

Return a JSON array:
[
  {
    "title": "Specific Job Title",
    "department": "Engineering",
    "location": "City, State or Remote",
    "employment_type": "full-time|part-time|contract|internship",
    "description": "Brief 1-2 sentence description of the role",
    "url": "Direct URL to the job posting if available, or null",
    "salary_range": "$X - $Y if mentioned, or null"
  }
]

Remember: Only REAL job titles. No generic text. Up to 50 jobs max. Empty array [] if none found.

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

    // Filter out obvious non-jobs
    const genericPhrases = [
      'join our', 'see open', 'apply now', 'learn more', 'view all',
      'our mission', 'our team', 'our culture', 'why work', 'benefits',
      'about us', 'get started', 'sign up', 'contact us',
    ];
    jobs = jobs.filter((j: any) => {
      if (!j.title || j.title.length < 4 || j.title.length > 120) return false;
      const lower = j.title.toLowerCase();
      return !genericPhrases.some(phrase => lower.includes(phrase));
    });

    console.log(`Extracted ${jobs.length} real jobs for ${companyName}`);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No real job listings found on the careers page',
        jobsAdded: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 4: Clear old jobs and insert new ones
    await supabase.from('company_jobs').delete().eq('company_id', companyId);

    const { error: insertErr } = await supabase.from('company_jobs').insert(
      jobs.slice(0, 50).map((j: any) => ({
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
