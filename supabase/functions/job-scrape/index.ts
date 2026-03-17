const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';
// ─── ATS API endpoints (public, no auth needed) ───
const ATS_CONFIGS: Record<string, { detect: (url: string) => boolean; fetchJobs: (url: string) => Promise<any[]>; platform: string }> = {
  greenhouse: {
    platform: 'greenhouse',
    detect: (url) => /greenhouse\.io|boards\.greenhouse/i.test(url),
    fetchJobs: async (url) => {
      // Extract board token: boards.greenhouse.io/COMPANY or boards-api.greenhouse.io/v1/boards/COMPANY/jobs
      const match = url.match(/greenhouse\.io\/(?:boards\/)?([^/?#]+)/i) || url.match(/\/([^/?#]+)\/?$/);
      const token = match?.[1];
      if (!token) return [];
      const resp = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.jobs || []).map((j: any) => ({
        title: j.title,
        department: j.departments?.[0]?.name || null,
        location: j.location?.name || null,
        employment_type: 'full-time',
        description: (j.content || '').replace(/<[^>]*>/g, ' ').slice(0, 2000),
        url: j.absolute_url || `https://boards.greenhouse.io/${token}/jobs/${j.id}`,
        salary_range: null,
        work_mode: detectWorkMode(j.location?.name || '', j.content || ''),
      }));
    },
  },
  lever: {
    platform: 'lever',
    detect: (url) => /lever\.co|jobs\.lever/i.test(url),
    fetchJobs: async (url) => {
      const match = url.match(/lever\.co\/([^/?#]+)/i);
      const company = match?.[1];
      if (!company) return [];
      const resp = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data || []).map((j: any) => ({
        title: j.text,
        department: j.categories?.team || j.categories?.department || null,
        location: j.categories?.location || null,
        employment_type: j.categories?.commitment?.toLowerCase() || 'full-time',
        description: (j.descriptionPlain || '').slice(0, 2000),
        url: j.hostedUrl || j.applyUrl,
        salary_range: j.salaryRange?.min && j.salaryRange?.max ? `$${j.salaryRange.min.toLocaleString()} - $${j.salaryRange.max.toLocaleString()}` : null,
        work_mode: detectWorkMode(j.categories?.location || '', j.descriptionPlain || ''),
      }));
    },
  },
  ashby: {
    platform: 'ashby',
    detect: (url) => /ashbyhq\.com|jobs\.ashby/i.test(url),
    fetchJobs: async (url) => {
      const match = url.match(/ashbyhq\.com\/([^/?#]+)/i) || url.match(/jobs\.ashby\.io\/([^/?#]+)/i);
      const company = match?.[1];
      if (!company) return [];
      const resp = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.jobs || []).map((j: any) => ({
        title: j.title,
        department: j.departmentName || null,
        location: j.locationName || null,
        employment_type: j.employmentType?.toLowerCase() || 'full-time',
        description: (j.descriptionPlain || j.descriptionHtml?.replace(/<[^>]*>/g, ' ') || '').slice(0, 2000),
        url: j.jobUrl || `https://jobs.ashbyhq.com/${company}/${j.id}`,
        salary_range: j.compensationTierSummary || null,
        work_mode: detectWorkMode(j.locationName || '', j.descriptionPlain || ''),
      }));
    },
  },
  smartrecruiters: {
    platform: 'smartrecruiters',
    detect: (url) => /smartrecruiters\.com|jobs\.smartrecruiters/i.test(url),
    fetchJobs: async (url) => {
      const match = url.match(/smartrecruiters\.com\/([^/?#]+)/i);
      const company = match?.[1];
      if (!company) return [];
      const resp = await fetch(`https://api.smartrecruiters.com/v1/companies/${company}/postings`);
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.content || []).map((j: any) => ({
        title: j.name,
        department: j.department?.label || null,
        location: j.location?.city ? `${j.location.city}, ${j.location.region || ''}`.trim() : null,
        employment_type: j.typeOfEmployment?.label?.toLowerCase() || 'full-time',
        description: '',
        url: j.ref || `https://jobs.smartrecruiters.com/${company}/${j.id}`,
        salary_range: null,
        work_mode: j.location?.remote ? 'remote' : 'on-site',
      }));
    },
  },
  workable: {
    platform: 'workable',
    detect: (url) => /workable\.com|apply\.workable/i.test(url),
    fetchJobs: async (url) => {
      const match = url.match(/workable\.com\/(?:j\/)?([^/?#]+)/i) || url.match(/apply\.workable\.com\/([^/?#]+)/i);
      const company = match?.[1];
      if (!company) return [];
      const resp = await fetch(`https://apply.workable.com/api/v1/widget/accounts/${company}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '', location: [], department: [], worktype: [] }),
      });
      if (!resp.ok) return [];
      const data = await resp.json();
      return (data.results || []).map((j: any) => ({
        title: j.title,
        department: j.department || null,
        location: j.location?.city ? `${j.location.city}, ${j.location.region || ''}`.trim() : null,
        employment_type: j.type?.toLowerCase() || 'full-time',
        description: '',
        url: `https://apply.workable.com/${company}/j/${j.shortcode}/`,
        salary_range: null,
        work_mode: j.workplace?.toLowerCase() || null,
      }));
    },
  },
};

function detectWorkMode(location: string, description: string): string | null {
  const text = `${location} ${description}`.toLowerCase();
  if (/\bremote\b/.test(text)) return 'remote';
  if (/\bhybrid\b/.test(text)) return 'hybrid';
  if (/\bon[\s-]?site\b|\bin[\s-]?office\b/.test(text)) return 'on-site';
  return null;
}

function detectATS(url: string): { platform: string; fetcher: (url: string) => Promise<any[]> } | null {
  for (const [, config] of Object.entries(ATS_CONFIGS)) {
    if (config.detect(url)) return { platform: config.platform, fetcher: config.fetchJobs };
  }
  return null;
}

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

    console.log(`Scraping jobs from: ${careersUrl} for company ${companyName || companyId}`);

    let jobs: any[] = [];
    let sourceType = 'careers_page';
    let sourcePlatform = 'custom';

    // ─── Layer 1: Try ATS API first ───
    const ats = detectATS(careersUrl);
    if (ats) {
      console.log(`ATS detected: ${ats.platform}`);
      try {
        jobs = await ats.fetcher(careersUrl);
        if (jobs.length > 0) {
          sourceType = 'ats';
          sourcePlatform = ats.platform;
          console.log(`ATS API returned ${jobs.length} jobs from ${ats.platform}`);
        }
      } catch (e) {
        console.warn(`ATS API failed for ${ats.platform}, falling back to scraping:`, e);
      }
    }

    // ─── Layer 2: Firecrawl fallback for non-ATS or failed ATS ───
    if (jobs.length === 0 && firecrawlKey && lovableKey) {
      console.log('Falling back to Firecrawl scraping...');
      sourceType = 'careers_page';
      sourcePlatform = 'custom';

      let allMarkdown = '';

      // Map the careers site
      const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: careersUrl, search: 'jobs careers positions openings apply', limit: 30 }),
      });

      let jobPageUrls: string[] = [];
      if (mapResp.ok) {
        const mapData = await mapResp.json();
        const allLinks = mapData.links || [];
        jobPageUrls = allLinks.filter((url: string) => {
          const lower = url.toLowerCase();
          return lower.includes('/job') || lower.includes('/position') || lower.includes('/career') ||
            lower.includes('/opening') || lower.includes('/apply') || lower.includes('/role') ||
            lower.includes('lever.co') || lower.includes('greenhouse.io') || lower.includes('ashbyhq.com');
        }).slice(0, 10);

        // Check if any discovered URL is actually an ATS
        for (const pageUrl of jobPageUrls) {
          const discoveredAts = detectATS(pageUrl);
          if (discoveredAts) {
            console.log(`Discovered ATS URL in sitemap: ${discoveredAts.platform} → ${pageUrl}`);
            try {
              const atsJobs = await discoveredAts.fetcher(pageUrl);
              if (atsJobs.length > 0) {
                jobs = atsJobs;
                sourceType = 'ats';
                sourcePlatform = discoveredAts.platform;
                break;
              }
            } catch { /* continue with scraping */ }
          }
        }
      }

      // If ATS discovery didn't work, scrape with AI
      if (jobs.length === 0) {
        const urlsToScrape = [careersUrl, ...jobPageUrls.slice(0, 3)];
        for (const url of urlsToScrape) {
          try {
            const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 5000 }),
            });
            if (scrapeResp.ok) {
              const scrapeData = await scrapeResp.json();
              const md = scrapeData.data?.markdown || scrapeData.markdown || '';
              if (md.length > 50) allMarkdown += `\n\n--- PAGE: ${url} ---\n${md}`;
            }
          } catch (e) { console.warn(`Failed to scrape ${url}:`, e); }
        }

        // Search fallback
        if (allMarkdown.length < 100 && lovableKey) {
          // Use resilient search fallback
          const { results: fallbackResults } = await resilientSearch(
            [`${companyName} careers jobs openings hiring 2026`],
            firecrawlKey, lovableKey
          );
          for (const result of fallbackResults) {
            const md = result.markdown || '';
            if (md.length > 50) allMarkdown += `\n\n--- SEARCH: ${result.url} ---\n${md}`;
          }
        }

        // AI extraction
        if (allMarkdown.length >= 100) {
          const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `You extract REAL job listings from career page content. Return only valid JSON array.
CRITICAL: Only extract ACTUAL job openings with specific titles. DO NOT include generic text like "Join our mission".
Each job must have a real, specific title that someone would apply for. Return [] if none found.`
                },
                {
                  role: 'user',
                  content: `Extract job listings for "${companyName || 'this company'}". JSON array:
[{"title":"..","department":"..","location":"..","employment_type":"full-time","description":"..","url":"..","salary_range":null,"work_mode":"remote|hybrid|on-site|null"}]
Up to 50 jobs. Content:\n${allMarkdown.slice(0, 20000)}`
                }
              ],
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const content = aiData.choices?.[0]?.message?.content || '[]';
            try {
              const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
              let parsed = JSON.parse(jsonMatch[1].trim());
              if (!Array.isArray(parsed)) parsed = [];
              const genericPhrases = ['join our', 'see open', 'apply now', 'learn more', 'view all', 'our mission', 'about us'];
              jobs = parsed.filter((j: any) => {
                if (!j.title || j.title.length < 4 || j.title.length > 120) return false;
                return !genericPhrases.some(p => j.title.toLowerCase().includes(p));
              });
            } catch { jobs = []; }
          }
        }
      }
    }

    console.log(`Final: ${jobs.length} jobs for ${companyName} (source: ${sourceType}/${sourcePlatform})`);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: 'No job listings found', jobsAdded: 0, sourceType, sourcePlatform,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Upsert: delete old + insert new
    await supabase.from('company_jobs').delete().eq('company_id', companyId);

    const jobRecords = jobs.slice(0, 50).map((j: any) => ({
      company_id: companyId,
      title: j.title,
      department: j.department || null,
      location: j.location || null,
      employment_type: j.employment_type || 'full-time',
      description: (j.description || '').slice(0, 5000),
      url: j.url || careersUrl,
      salary_range: j.salary_range || null,
      scraped_at: new Date().toISOString(),
      source_type: sourceType,
      source_platform: sourcePlatform,
      work_mode: j.work_mode || null,
      source_url: careersUrl,
      last_verified_at: new Date().toISOString(),
      admin_approved: true,
    }));

    const { error: insertErr } = await supabase.from('company_jobs').insert(jobRecords);

    if (insertErr) {
      console.error('Insert failed:', insertErr);
      return new Response(JSON.stringify({ success: false, error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Also cache in company_report_sections for cache-first loading
    await supabase.from('company_report_sections').upsert({
      company_id: companyId,
      section_type: 'careers',
      content: { jobs: jobRecords, sourceType, sourcePlatform, totalJobs: jobs.length },
      summary: `${jobs.length} open positions found via ${sourcePlatform}`,
      source_urls: [careersUrl],
      provider_used: sourcePlatform === 'custom' ? 'firecrawl' : 'ats_api',
      last_successful_update: new Date().toISOString(),
      last_attempted_update: new Date().toISOString(),
      last_error: null,
      freshness_ttl_hours: 48,
      confidence_score: sourceType === 'ats' ? 0.95 : 0.75,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,section_type' });

    return new Response(JSON.stringify({
      success: true, jobsAdded: jobs.length, companyId, sourceType, sourcePlatform,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Job scrape error:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
