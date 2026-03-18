const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';

// ─── Page classification types ───
type PageClassification =
  | 'informational_landing'
  | 'evergreen_recruiting'
  | 'live_jobs_page'
  | 'ats_redirect'
  | 'dynamic_jobs_feed'
  | 'department_landing'
  | 'no_active_jobs'
  | 'limited_active_jobs'
  | 'careers_site_detected'
  | 'ats_detected_jobs_found';

interface ScanContext {
  classification: PageClassification;
  explanation: string;
  sourceChecked: string;
  confidence: 'low' | 'medium' | 'high';
  atsDetected: string | null;
  departmentBreakdown: Record<string, number> | null;
  deeperUrlFound: string | null;
  layersChecked: string[];
}

// ─── Expanded ATS detection (detect + public API fetch) ───
const ATS_CONFIGS: Record<string, { detect: (url: string) => boolean; fetchJobs: (url: string) => Promise<any[]>; platform: string }> = {
  greenhouse: {
    platform: 'greenhouse',
    detect: (url) => /greenhouse\.io|boards\.greenhouse/i.test(url),
    fetchJobs: async (url) => {
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
  // ─── NEW: Additional ATS platforms ───
  workday: {
    platform: 'workday',
    detect: (url) => /myworkdayjobs\.com|wd\d+\.myworkdaysite\.com|workday\.com.*careers/i.test(url),
    fetchJobs: async (_url) => {
      // Workday doesn't have a public API — we flag it for AI scraping
      return [];
    },
  },
  icims: {
    platform: 'icims',
    detect: (url) => /icims\.com|careers-.*\.icims/i.test(url),
    fetchJobs: async (_url) => [],
  },
  taleo: {
    platform: 'taleo',
    detect: (url) => /taleo\.net|taleo\.com|oracle.*cloud.*jobs/i.test(url),
    fetchJobs: async (_url) => [],
  },
  successfactors: {
    platform: 'successfactors',
    detect: (url) => /successfactors\.com|successfactors\.eu/i.test(url),
    fetchJobs: async (_url) => [],
  },
  phenom: {
    platform: 'phenom',
    detect: (url) => /phenom\.com|jobs\..*\.com.*phenom/i.test(url),
    fetchJobs: async (_url) => [],
  },
  jobvite: {
    platform: 'jobvite',
    detect: (url) => /jobvite\.com|jobs\.jobvite/i.test(url),
    fetchJobs: async (_url) => [],
  },
  bamboohr: {
    platform: 'bamboohr',
    detect: (url) => /bamboohr\.com/i.test(url),
    fetchJobs: async (_url) => [],
  },
  rippling: {
    platform: 'rippling',
    detect: (url) => /rippling\.com.*careers|rippling-ats/i.test(url),
    fetchJobs: async (_url) => [],
  },
  breezy: {
    platform: 'breezy',
    detect: (url) => /breezy\.hr/i.test(url),
    fetchJobs: async (_url) => [],
  },
  teamtailor: {
    platform: 'teamtailor',
    detect: (url) => /teamtailor\.com/i.test(url),
    fetchJobs: async (_url) => [],
  },
  recruitee: {
    platform: 'recruitee',
    detect: (url) => /recruitee\.com/i.test(url),
    fetchJobs: async (_url) => [],
  },
  zohorecruit: {
    platform: 'zohorecruit',
    detect: (url) => /zoho\.com.*recruit|zohorecruit/i.test(url),
    fetchJobs: async (_url) => [],
  },
  pinpoint: {
    platform: 'pinpoint',
    detect: (url) => /pinpointhq\.com/i.test(url),
    fetchJobs: async (url) => {
      // Pinpoint doesn't have a public API, but job boards render HTML lists
      // Try to scrape the job board page
      const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (!firecrawlKey) return [];
      try {
        const resp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true, waitFor: 8000 }),
        });
        if (!resp.ok) return [];
        const data = await resp.json();
        const md = data.data?.markdown || data.markdown || '';
        if (md.length < 50) return [];
        // Use AI to extract jobs from the scraped Pinpoint page
        const lovableKey = Deno.env.get('LOVABLE_API_KEY');
        if (!lovableKey) return [];
        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Extract REAL job listings from this Pinpoint HQ job board page. Return only valid JSON array. Only include actual job postings with specific titles. Return [] if none found.' },
              { role: 'user', content: `Extract jobs. Return JSON: [{"title":"..","department":"..","location":"..","employment_type":"full-time","description":"..","url":"..","salary_range":null,"work_mode":null}]\n\nContent:\n${md.slice(0, 15000)}` },
            ],
          }),
        });
        if (!aiResp.ok) return [];
        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content || '[]';
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        const parsed = JSON.parse(jsonMatch[1].trim());
        return Array.isArray(parsed) ? parsed.filter((j: any) => j.title && j.title.length >= 4 && j.title.length <= 120) : [];
      } catch (e) {
        console.warn('[job-scrape] Pinpoint scrape failed:', e);
        return [];
      }
    },
  },
  manatal: {
    platform: 'manatal',
    detect: (url) => /manatal\.com/i.test(url),
    fetchJobs: async (_url) => [],
  },
  gem: {
    platform: 'gem',
    detect: (url) => /gem\.com.*jobs/i.test(url),
    fetchJobs: async (_url) => [],
  },
};

// ─── ATS patterns to find in page content (for pages that link to ATS) ───
const ATS_LINK_PATTERNS: { platform: string; pattern: RegExp; extractUrl?: (match: RegExpMatchArray, baseUrl: string) => string | null }[] = [
  { platform: 'greenhouse', pattern: /(?:href=["']|)(https?:\/\/boards\.greenhouse\.io\/[a-z0-9_-]+)/gi },
  { platform: 'lever', pattern: /(?:href=["']|)(https?:\/\/jobs\.lever\.co\/[a-z0-9_-]+)/gi },
  { platform: 'ashby', pattern: /(?:href=["']|)(https?:\/\/jobs\.ashbyhq\.com\/[a-z0-9_-]+)/gi },
  { platform: 'workday', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.myworkdayjobs\.com[^\s"']*)/gi },
  { platform: 'icims', pattern: /(?:href=["']|)(https?:\/\/careers[a-z0-9_-]*\.icims\.com[^\s"']*)/gi },
  { platform: 'smartrecruiters', pattern: /(?:href=["']|)(https?:\/\/jobs\.smartrecruiters\.com\/[a-z0-9_-]+)/gi },
  { platform: 'workable', pattern: /(?:href=["']|)(https?:\/\/apply\.workable\.com\/[a-z0-9_-]+)/gi },
  { platform: 'taleo', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.taleo\.net[^\s"']*)/gi },
  { platform: 'jobvite', pattern: /(?:href=["']|)(https?:\/\/jobs\.jobvite\.com\/[a-z0-9_-]+)/gi },
  { platform: 'phenom', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.phenom\.com[^\s"']*)/gi },
  { platform: 'bamboohr', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.bamboohr\.com[^\s"']*)/gi },
  { platform: 'rippling', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.rippling\.com[^\s"']*)/gi },
  { platform: 'breezy', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.breezy\.hr[^\s"']*)/gi },
  { platform: 'teamtailor', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.teamtailor\.com[^\s"']*)/gi },
  { platform: 'recruitee', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.recruitee\.com[^\s"']*)/gi },
  { platform: 'zohorecruit', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.zohorecruit\.com[^\s"']*)/gi },
  { platform: 'pinpoint', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.pinpointhq\.com[^\s"']*)/gi },
  { platform: 'manatal', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.manatal\.com[^\s"']*)/gi },
  { platform: 'gem', pattern: /(?:href=["']|)(https?:\/\/[a-z0-9_-]+\.gem\.com[^\s"']*\/jobs[^\s"']*)/gi },
];

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

// ─── Page classification from content ───
function classifyPageContent(markdown: string, url: string): { classification: PageClassification; explanation: string } {
  const lower = markdown.toLowerCase();
  const wordCount = markdown.split(/\s+/).length;

  // Check for ATS redirect indicators in content
  for (const pattern of ATS_LINK_PATTERNS) {
    if (pattern.pattern.test(markdown)) {
      pattern.pattern.lastIndex = 0; // Reset regex
      return {
        classification: 'ats_redirect',
        explanation: `This career page links to an external ${pattern.platform} ATS where live job listings are hosted.`,
      };
    }
  }

  // Check for dynamic loading indicators
  const dynamicIndicators = [
    /loading\s*jobs/i, /fetching\s*results/i, /search\s*results\s*will/i,
    /javascript\s*required/i, /enable\s*javascript/i, /react-root|__next|gatsby/i,
  ];
  if (dynamicIndicators.some(r => r.test(markdown)) && wordCount < 300) {
    return {
      classification: 'dynamic_jobs_feed',
      explanation: 'This page appears to load job listings dynamically via JavaScript. The rendered HTML alone may not contain all listings.',
    };
  }

  // Count job-like patterns
  const jobTitlePatterns = /(?:^|\n)\s*(?:#{1,4}\s*)?(?:senior|junior|lead|staff|principal|manager|director|vp|head\s+of|associate|analyst|engineer|designer|coordinator|specialist|consultant)/gim;
  const jobMatches = (markdown.match(jobTitlePatterns) || []).length;

  const applyPatterns = /\b(?:apply\s*now|apply\s*today|submit\s*application|view\s*(?:job|role|position)|see\s*open\s*(?:roles|positions))\b/gi;
  const applyCount = (markdown.match(applyPatterns) || []).length;

  // Department/category page detection
  const deptPatterns = /\b(?:engineering|product|design|marketing|sales|operations|finance|legal|hr|human\s*resources|data|research|customer\s*(?:success|support)|corporate|retail|warehouse|store)\s*(?:team|department|group|division|careers?|roles?|jobs?)?\b/gi;
  const deptMatches = (markdown.match(deptPatterns) || []).length;

  // Evergreen indicators
  const evergreenPhrases = [
    'join our team', 'we\'re always looking', 'talent community', 'future opportunities',
    'sign up for job alerts', 'submit your resume', 'general application',
    'we\'re hiring', 'come work with us', 'build your career', 'grow with us',
  ];
  const evergreenHits = evergreenPhrases.filter(p => lower.includes(p)).length;

  // Informational indicators
  const infoPhrases = [
    'our culture', 'our values', 'life at', 'benefits', 'perks', 'our story',
    'what we offer', 'why work here', 'employee spotlight', 'day in the life',
  ];
  const infoHits = infoPhrases.filter(p => lower.includes(p)).length;

  // Decision logic
  if (jobMatches >= 5 && applyCount >= 3) {
    return {
      classification: 'live_jobs_page',
      explanation: `Found ${jobMatches} job-title patterns and ${applyCount} apply actions, indicating an active job listings page.`,
    };
  }

  if (deptMatches >= 4 && jobMatches < 3) {
    return {
      classification: 'department_landing',
      explanation: `This page highlights ${deptMatches} department/team areas but contains few specific job listings. Live roles may be deeper in the site or on a linked ATS.`,
    };
  }

  if (evergreenHits >= 2 && jobMatches < 2) {
    return {
      classification: 'evergreen_recruiting',
      explanation: 'This appears to be an evergreen recruiting page focused on employer branding rather than specific open positions.',
    };
  }

  if (infoHits >= 3 && jobMatches < 2) {
    return {
      classification: 'informational_landing',
      explanation: 'This is an informational career landing page focused on culture and benefits, not a live jobs feed.',
    };
  }

  if (jobMatches >= 2 || applyCount >= 1) {
    return {
      classification: 'live_jobs_page',
      explanation: `Found some job listings (${jobMatches} roles, ${applyCount} apply links).`,
    };
  }

  return {
    classification: 'informational_landing',
    explanation: 'Page content does not contain clear job listings or apply actions. This may be a branding page.',
  };
}

// ─── Extract embedded ATS URLs from page content ───
function extractATSUrls(content: string): { platform: string; url: string }[] {
  const found: { platform: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const pattern of ATS_LINK_PATTERNS) {
    pattern.pattern.lastIndex = 0;
    let match;
    while ((match = pattern.pattern.exec(content)) !== null) {
      const url = match[1];
      if (url && !seen.has(url)) {
        seen.add(url);
        found.push({ platform: pattern.platform, url });
      }
    }
  }
  return found;
}

// ─── Categorize jobs by department ───
function categorizeDepartments(jobs: any[]): Record<string, number> {
  const categories: Record<string, string[]> = {
    'tech_product': ['engineering', 'software', 'developer', 'product', 'data', 'devops', 'sre', 'platform', 'security', 'infrastructure', 'machine learning', 'ai', 'technical'],
    'corporate': ['finance', 'legal', 'hr', 'human resources', 'accounting', 'strategy', 'communications', 'compliance', 'admin'],
    'sales_marketing': ['sales', 'marketing', 'growth', 'brand', 'content', 'social media', 'partnerships', 'business development'],
    'operations': ['operations', 'supply chain', 'logistics', 'warehouse', 'fulfillment', 'distribution'],
    'retail_frontline': ['retail', 'store', 'cashier', 'associate', 'frontline', 'crew', 'barista', 'team member'],
    'customer_support': ['customer', 'support', 'success', 'service', 'help desk', 'cx'],
    'design': ['design', 'ux', 'ui', 'creative', 'graphic'],
  };

  const breakdown: Record<string, number> = {};
  for (const job of jobs) {
    const text = `${job.title || ''} ${job.department || ''}`.toLowerCase();
    let matched = false;
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(k => text.includes(k))) {
        breakdown[category] = (breakdown[category] || 0) + 1;
        matched = true;
        break;
      }
    }
    if (!matched) {
      breakdown['other'] = (breakdown['other'] || 0) + 1;
    }
  }
  return breakdown;
}

// ─── Generate hiring signals from scan results ───
function generateHiringSignals(
  jobs: any[],
  scanContext: ScanContext,
  deptBreakdown: Record<string, number>
): { signal_type: string; description: string; confidence: string }[] {
  const signals: { signal_type: string; description: string; confidence: string }[] = [];

  // Signal: Page is informational but no live jobs found
  if (scanContext.classification === 'informational_landing' && jobs.length === 0) {
    signals.push({
      signal_type: 'career_page_informational_only',
      description: 'Career page is informational/branding only. No live job listings were found on the page or via a linked ATS.',
      confidence: 'medium',
    });
  }

  // Signal: Department pages exist but few jobs in that category
  if (scanContext.classification === 'department_landing') {
    signals.push({
      signal_type: 'department_landing_limited_roles',
      description: 'Career department/category pages are prominent, but few or no specific active roles were found in this category.',
      confidence: 'medium',
    });
  }

  // Signal: ATS detected but returned zero jobs
  if (scanContext.atsDetected && jobs.length === 0) {
    signals.push({
      signal_type: 'ats_detected_no_active_jobs',
      description: `An ATS (${scanContext.atsDetected}) was detected but returned no active job listings. The company may have a hiring pause or the ATS board may not be publicly accessible.`,
      confidence: 'medium',
    });
  }

  // Signal: Dynamic/JS-loaded page that couldn't be fully scraped
  if (scanContext.classification === 'dynamic_jobs_feed' && jobs.length === 0) {
    signals.push({
      signal_type: 'dynamic_jobs_not_scraped',
      description: 'Job listings appear to load dynamically via JavaScript. Static scraping may not capture all postings.',
      confidence: 'low',
    });
  }

  // Signal: Hiring concentration
  const totalJobs = jobs.length;
  if (totalJobs > 5) {
    const sortedDepts = Object.entries(deptBreakdown).sort((a, b) => b[1] - a[1]);
    if (sortedDepts.length > 0) {
      const topDept = sortedDepts[0];
      const topPct = Math.round((topDept[1] / totalJobs) * 100);
      if (topPct >= 60) {
        const deptLabel = topDept[0].replace(/_/g, ' ');
        signals.push({
          signal_type: 'hiring_concentration',
          description: `${topPct}% of active roles are concentrated in ${deptLabel} (${topDept[1]} of ${totalJobs} roles).`,
          confidence: 'high',
        });
      }
    }
  }

  // Signal: Evergreen page with no real listings
  if (scanContext.classification === 'evergreen_recruiting' && jobs.length === 0) {
    signals.push({
      signal_type: 'evergreen_no_active_listings',
      description: 'Career page uses evergreen recruiting language (talent community, general application) but no specific active roles were found.',
      confidence: 'medium',
    });
  }

  return signals;
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

    console.log(`[job-scrape] Scanning: ${careersUrl} for ${companyName || companyId}`);

    let jobs: any[] = [];
    let sourceType = 'careers_page';
    let sourcePlatform = 'custom';
    let scanContext: ScanContext = {
      classification: 'informational_landing',
      explanation: 'Scan not yet performed.',
      sourceChecked: careersUrl,
      confidence: 'low',
      atsDetected: null,
      departmentBreakdown: null,
      deeperUrlFound: null,
      layersChecked: [],
    };

    // ═══════════════════════════════════════════════════
    // LAYER 1: Direct ATS detection on provided URL
    // ═══════════════════════════════════════════════════
    const ats = detectATS(careersUrl);
    if (ats) {
      console.log(`[job-scrape] ATS detected directly: ${ats.platform}`);
      scanContext.atsDetected = ats.platform;
      scanContext.layersChecked.push('direct_ats_detection');
      try {
        jobs = await ats.fetcher(careersUrl);
        if (jobs.length > 0) {
          sourceType = 'ats';
          sourcePlatform = ats.platform;
          scanContext.classification = 'ats_detected_jobs_found';
          scanContext.explanation = `Live job listings retrieved directly from ${ats.platform} ATS API.`;
          scanContext.confidence = 'high';
          console.log(`[job-scrape] ATS API returned ${jobs.length} jobs from ${ats.platform}`);
        } else {
          scanContext.classification = 'no_active_jobs';
          scanContext.explanation = `${ats.platform} ATS was detected and queried, but returned no active job listings.`;
          scanContext.confidence = 'high';
        }
      } catch (e) {
        console.warn(`[job-scrape] ATS API failed for ${ats.platform}:`, e);
        scanContext.explanation = `${ats.platform} ATS was detected but the API query failed. Falling back to page scraping.`;
      }
    }

    // ═══════════════════════════════════════════════════
    // LAYER 2: Scrape + classify the careers page
    // ═══════════════════════════════════════════════════
    if (jobs.length === 0 && (firecrawlKey || lovableKey)) {
      console.log('[job-scrape] Layer 2: Scraping and classifying career page...');
      scanContext.layersChecked.push('company_site');
      sourceType = 'careers_page';
      sourcePlatform = 'custom';

      let mainPageMarkdown = '';
      let allMarkdown = '';

      // 2a. Scrape the main careers page
      if (firecrawlKey) {
        try {
          const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: careersUrl, formats: ['markdown', 'html'], onlyMainContent: true, waitFor: 5000 }),
          });
          if (scrapeResp.ok) {
            const scrapeData = await scrapeResp.json();
            mainPageMarkdown = scrapeData.data?.markdown || scrapeData.markdown || '';
            const mainPageHtml = scrapeData.data?.html || scrapeData.html || '';
            allMarkdown = mainPageMarkdown;

            // Classify the main page
            const pageClass = classifyPageContent(mainPageMarkdown, careersUrl);
            scanContext.classification = pageClass.classification;
            scanContext.explanation = pageClass.explanation;
            scanContext.confidence = 'medium';

            // 2b. Check for embedded ATS links in page content
            const embeddedATS = extractATSUrls(mainPageMarkdown + ' ' + mainPageHtml);
            if (embeddedATS.length > 0) {
              const atsLink = embeddedATS[0];
              console.log(`[job-scrape] Found embedded ATS link: ${atsLink.platform} → ${atsLink.url}`);
              scanContext.atsDetected = atsLink.platform;
              scanContext.deeperUrlFound = atsLink.url;
              scanContext.classification = 'ats_redirect';
              scanContext.explanation = `Career page redirects to ${atsLink.platform} ATS for live job listings.`;

              // Try to fetch from detected ATS
              const embeddedAtsConfig = detectATS(atsLink.url);
              if (embeddedAtsConfig) {
                try {
                  const atsJobs = await embeddedAtsConfig.fetcher(atsLink.url);
                  if (atsJobs.length > 0) {
                    jobs = atsJobs;
                    sourceType = 'ats';
                    sourcePlatform = embeddedAtsConfig.platform;
                    scanContext.classification = 'live_jobs_page';
                    scanContext.explanation = `Live jobs retrieved from linked ${embeddedAtsConfig.platform} ATS (discovered via career page).`;
                    scanContext.confidence = 'high';
                  }
                } catch (e) {
                  console.warn(`[job-scrape] Embedded ATS fetch failed for ${atsLink.platform}:`, e);
                }
              }
            }
          }
        } catch (e) {
          console.warn(`[job-scrape] Failed to scrape main page:`, e);
        }
      }

      // 2c. If still no jobs, map the site and discover deeper job pages
      if (jobs.length === 0 && firecrawlKey) {
        console.log('[job-scrape] Layer 2c: Mapping site for deeper job pages...');
        scanContext.layersChecked.push('site_map');
        const mapResp = await fetch('https://api.firecrawl.dev/v1/map', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: careersUrl, search: 'jobs careers positions openings apply search vacancy', limit: 30 }),
        });

        let jobPageUrls: string[] = [];
        if (mapResp.ok) {
          const mapData = await mapResp.json();
          const allLinks = mapData.links || [];

          // Prioritize pages that look like job search/listing pages
          const priorityPatterns = [
            /\/search/i, /\/results/i, /\/all-jobs/i, /\/open-positions/i,
            /\/job-listings/i, /\/current-openings/i, /\?q=/i, /\/explore/i,
          ];
          const secondaryPatterns = [
            /\/job/i, /\/position/i, /\/career/i, /\/opening/i, /\/apply/i,
            /\/role/i, /lever\.co/i, /greenhouse\.io/i, /ashbyhq\.com/i,
            /myworkdayjobs\.com/i, /icims\.com/i, /smartrecruiters\.com/i,
            /pinpointhq\.com/i,
          ];

          const priorityUrls = allLinks.filter((u: string) => priorityPatterns.some(p => p.test(u)));
          const secondaryUrls = allLinks.filter((u: string) =>
            secondaryPatterns.some(p => p.test(u)) && !priorityUrls.includes(u)
          );

          jobPageUrls = [...priorityUrls.slice(0, 5), ...secondaryUrls.slice(0, 5)];

          // Check if any discovered URL is an ATS
          for (const pageUrl of jobPageUrls) {
            const discoveredAts = detectATS(pageUrl);
            if (discoveredAts) {
              console.log(`[job-scrape] Discovered ATS in sitemap: ${discoveredAts.platform} → ${pageUrl}`);
              scanContext.atsDetected = discoveredAts.platform;
              scanContext.deeperUrlFound = pageUrl;
              try {
                const atsJobs = await discoveredAts.fetcher(pageUrl);
                if (atsJobs.length > 0) {
                  jobs = atsJobs;
                  sourceType = 'ats';
                  sourcePlatform = discoveredAts.platform;
                  scanContext.classification = 'live_jobs_page';
                  scanContext.explanation = `Live jobs retrieved from ${discoveredAts.platform} ATS discovered in the site map.`;
                  scanContext.confidence = 'high';
                  break;
                }
              } catch { /* continue */ }
            }
          }
        }

        // 2d. Scrape deeper pages for AI extraction
        if (jobs.length === 0) {
          const urlsToScrape = jobPageUrls.slice(0, 3);
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
                if (md.length > 50) {
                  allMarkdown += `\n\n--- PAGE: ${url} ---\n${md}`;
                  // Check this deeper page for ATS links too
                  const deeperATS = extractATSUrls(md);
                  if (deeperATS.length > 0 && !scanContext.atsDetected) {
                    scanContext.atsDetected = deeperATS[0].platform;
                    scanContext.deeperUrlFound = deeperATS[0].url;
                    const deepAtsConfig = detectATS(deeperATS[0].url);
                    if (deepAtsConfig) {
                      try {
                        const atsJobs = await deepAtsConfig.fetcher(deeperATS[0].url);
                        if (atsJobs.length > 0) {
                          jobs = atsJobs;
                          sourceType = 'ats';
                          sourcePlatform = deepAtsConfig.platform;
                          scanContext.classification = 'live_jobs_page';
                          scanContext.explanation = `Live jobs found via ${deepAtsConfig.platform} ATS linked from a deeper career page.`;
                          scanContext.confidence = 'high';
                          break;
                        }
                      } catch { /* continue */ }
                    }
                  }
                }
              }
            } catch (e) { console.warn(`[job-scrape] Failed to scrape ${url}:`, e); }
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // LAYER 2.5: Careers Domain & Web Search Discovery
      // Fires when jobs === 0 regardless of markdown length
      // ═══════════════════════════════════════════════════
      if (jobs.length === 0 && (firecrawlKey || lovableKey)) {
        console.log('[job-scrape] Layer 2.5: Multi-surface careers domain discovery...');
        scanContext.layersChecked.push('careers_subdomain', 'indexed_pages');

        let companyDomain = '';
        try {
          const urlObj = new URL(careersUrl.startsWith('http') ? careersUrl : `https://${careersUrl}`);
          const parts = urlObj.hostname.split('.');
          companyDomain = parts.length >= 2 ? parts.slice(-2).join('.') : urlObj.hostname;
        } catch { /* ignore */ }

        const searchQueries = [
          `"${companyName}" careers site jobs apply`,
          `"${companyName}" open positions vacancy 2025 2026`,
        ];
        if (companyDomain) {
          searchQueries.push(`site:jobs.${companyDomain} OR site:careers.${companyDomain} jobs`);
        }
        searchQueries.push(`"${companyName}" pinpoint OR greenhouse OR lever OR workday OR ashby OR smartrecruiters jobs careers`);

        const { results: discoveryResults } = await resilientSearch(
          searchQueries, firecrawlKey, lovableKey!, { maxResultsPerQuery: 5 }
        );

        let discoveredCareersUrl: string | null = null;

        for (const result of discoveryResults) {
          if (!result.url) continue;
          const resultUrl = result.url.toLowerCase();

          // Detect careers subdomains
          if (companyDomain && (
            resultUrl.includes(`jobs.${companyDomain}`) ||
            resultUrl.includes(`careers.${companyDomain}`)
          )) {
            discoveredCareersUrl = result.url;
            console.log(`[job-scrape] Layer 2.5: Discovered careers subdomain: ${result.url}`);
          }

          // Check for ATS URLs in results
          const resultAts = detectATS(result.url);
          if (resultAts && !scanContext.atsDetected) {
            console.log(`[job-scrape] Layer 2.5: Discovered ATS via search: ${resultAts.platform} → ${result.url}`);
            scanContext.atsDetected = resultAts.platform;
            scanContext.deeperUrlFound = result.url;
            scanContext.layersChecked.push('ats_detection');
            try {
              const atsJobs = await resultAts.fetcher(result.url);
              if (atsJobs.length > 0) {
                jobs = atsJobs;
                sourceType = 'ats';
                sourcePlatform = resultAts.platform;
                scanContext.classification = 'ats_detected_jobs_found';
                scanContext.explanation = `Active jobs found via ${resultAts.platform} ATS discovered through web search.`;
                scanContext.confidence = 'medium';
                break;
              }
            } catch { /* continue */ }
          }

          // Check for ATS links in result content
          if (jobs.length === 0 && result.markdown) {
            const contentATS = extractATSUrls(result.markdown);
            for (const atsLink of contentATS) {
              if (scanContext.atsDetected) break;
              scanContext.atsDetected = atsLink.platform;
              scanContext.deeperUrlFound = atsLink.url;
              scanContext.layersChecked.push('ats_detection');
              const atsConfig = detectATS(atsLink.url);
              if (atsConfig) {
                try {
                  const atsJobs = await atsConfig.fetcher(atsLink.url);
                  if (atsJobs.length > 0) {
                    jobs = atsJobs;
                    sourceType = 'ats';
                    sourcePlatform = atsConfig.platform;
                    scanContext.classification = 'ats_detected_jobs_found';
                    scanContext.explanation = `Active jobs found via ${atsConfig.platform} ATS discovered in search results.`;
                    scanContext.confidence = 'medium';
                    break;
                  }
                } catch { /* continue */ }
              }
            }
          }

          // Accumulate indexed job page content
          if (jobs.length === 0 && /\/(jobs|vacancy|vacancies|positions|openings|careers)\//i.test(result.url)) {
            allMarkdown += `\n\n--- INDEXED: ${result.url} ---\n${result.markdown || result.description || ''}`;
          }
        }

        // If we found a careers subdomain, try scraping it
        if (jobs.length === 0 && discoveredCareersUrl && firecrawlKey) {
          console.log(`[job-scrape] Layer 2.5: Scraping discovered careers domain: ${discoveredCareersUrl}`);
          try {
            const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: discoveredCareersUrl, formats: ['markdown', 'html'], onlyMainContent: true, waitFor: 8000 }),
            });
            if (scrapeResp.ok) {
              const scrapeData = await scrapeResp.json();
              const md = scrapeData.data?.markdown || scrapeData.markdown || '';
              const html = scrapeData.data?.html || scrapeData.html || '';
              if (md.length > 50) {
                allMarkdown += `\n\n--- CAREERS_SUBDOMAIN: ${discoveredCareersUrl} ---\n${md}`;
                scanContext.deeperUrlFound = discoveredCareersUrl;
                scanContext.classification = 'careers_site_detected';
                scanContext.explanation = `Dedicated careers site found at ${discoveredCareersUrl}.`;

                const subdomainATS = extractATSUrls(md + ' ' + html);
                for (const atsLink of subdomainATS) {
                  const atsConfig = detectATS(atsLink.url);
                  if (atsConfig) {
                    scanContext.atsDetected = atsConfig.platform;
                    scanContext.deeperUrlFound = atsLink.url;
                    scanContext.layersChecked.push('ats_detection');
                    try {
                      const atsJobs = await atsConfig.fetcher(atsLink.url);
                      if (atsJobs.length > 0) {
                        jobs = atsJobs;
                        sourceType = 'ats';
                        sourcePlatform = atsConfig.platform;
                        scanContext.classification = 'ats_detected_jobs_found';
                        scanContext.explanation = `Active jobs found via ${atsConfig.platform} ATS on careers subdomain ${discoveredCareersUrl}.`;
                        scanContext.confidence = 'high';
                        break;
                      }
                    } catch { /* continue */ }
                  }
                }

                // Try direct ATS detection on the careers subdomain URL
                if (jobs.length === 0) {
                  const subdomainAts = detectATS(discoveredCareersUrl);
                  if (subdomainAts) {
                    scanContext.atsDetected = subdomainAts.platform;
                    scanContext.layersChecked.push('ats_detection');
                    try {
                      const atsJobs = await subdomainAts.fetcher(discoveredCareersUrl);
                      if (atsJobs.length > 0) {
                        jobs = atsJobs;
                        sourceType = 'ats';
                        sourcePlatform = subdomainAts.platform;
                        scanContext.classification = 'ats_detected_jobs_found';
                        scanContext.explanation = `Active jobs found via ${subdomainAts.platform} at ${discoveredCareersUrl}.`;
                        scanContext.confidence = 'high';
                      }
                    } catch { /* continue */ }
                  }
                }
              }
            }
          } catch (e) {
            console.warn(`[job-scrape] Failed to scrape careers subdomain:`, e);
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // LAYER 3: Search fallback (no markdown length gate)
      // ═══════════════════════════════════════════════════
      if (jobs.length === 0 && lovableKey) {
        console.log('[job-scrape] Layer 3: Search fallback...');
        if (!scanContext.layersChecked.includes('web_search')) {
          scanContext.layersChecked.push('web_search');
        }
        const { results: fallbackResults } = await resilientSearch(
          [
            `${companyName} careers jobs openings hiring 2025 2026`,
            `"${companyName}" apply now open positions`,
          ],
          firecrawlKey, lovableKey!
        );
        for (const result of fallbackResults) {
          const md = result.markdown || '';
          if (md.length > 50) allMarkdown += `\n\n--- SEARCH: ${result.url} ---\n${md}`;

          const searchATS = extractATSUrls(md);
          if (searchATS.length > 0 && !scanContext.atsDetected) {
            scanContext.atsDetected = searchATS[0].platform;
            scanContext.deeperUrlFound = searchATS[0].url;
            scanContext.layersChecked.push('ats_detection');
            const searchAtsConfig = detectATS(searchATS[0].url);
            if (searchAtsConfig) {
              try {
                const atsJobs = await searchAtsConfig.fetcher(searchATS[0].url);
                if (atsJobs.length > 0) {
                  jobs = atsJobs;
                  sourceType = 'ats';
                  sourcePlatform = searchAtsConfig.platform;
                  scanContext.classification = 'ats_detected_jobs_found';
                  scanContext.explanation = `Live jobs found via ${searchAtsConfig.platform} ATS discovered through web search.`;
                  scanContext.confidence = 'medium';
                  break;
                }
              } catch { /* continue */ }
            }
          }
        }
      }

      // ═══════════════════════════════════════════════════
      // LAYER 4: AI extraction from scraped content
      // ═══════════════════════════════════════════════════
      if (jobs.length === 0 && allMarkdown.length >= 100 && lovableKey) {
        console.log('[job-scrape] Layer 4: AI extraction...');
        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You extract REAL job listings from career page content. Return only valid JSON.
CRITICAL RULES:
1. Only extract ACTUAL job openings with specific titles someone would apply for.
2. DO NOT include generic text like "Join our mission", "See open roles", etc.
3. DO NOT invent jobs that aren't clearly listed on the page.
4. If the page is informational/branding only (no specific job titles), return [].
5. If the page lists departments/teams but no specific roles, return [].
6. Each job must have a real, specific title.
Return [] if no specific job listings are found.`
              },
              {
                role: 'user',
                content: `Extract specific job listings for "${companyName || 'this company'}". Return JSON array:
[{"title":"..","department":"..","location":"..","employment_type":"full-time","description":"..","url":"..","salary_range":null,"work_mode":"remote|hybrid|on-site|null"}]
Up to 50 jobs. Return [] if no specific jobs found.

Content:\n${allMarkdown.slice(0, 20000)}`
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

        if (jobs.length > 0) {
          scanContext.classification = 'live_jobs_page';
          scanContext.explanation = `${jobs.length} job listings extracted from career page content via AI analysis.`;
          scanContext.confidence = 'medium';
        }
      }
    }

    // ═══════════════════════════════════════════════════
    // FINALIZE: Department breakdown + signals
    // ═══════════════════════════════════════════════════
    const deptBreakdown = jobs.length > 0 ? categorizeDepartments(jobs) : {};
    scanContext.departmentBreakdown = Object.keys(deptBreakdown).length > 0 ? deptBreakdown : null;

    // Update classification for zero-job results with detailed layer info
    if (jobs.length === 0) {
      const uniqueLayers = [...new Set(scanContext.layersChecked)];
      const layerLabels: Record<string, string> = {
        direct_ats_detection: 'direct ATS detection',
        company_site: 'company careers page',
        site_map: 'site map discovery',
        careers_subdomain: 'careers subdomain search',
        ats_detection: 'ATS platform detection',
        web_search: 'web search',
        indexed_pages: 'indexed job page search',
      };
      const checkedDesc = uniqueLayers.map(l => layerLabels[l] || l).join(', ');
      
      if (scanContext.classification === 'informational_landing' || scanContext.classification === 'no_active_jobs') {
        scanContext.explanation = `Checked: ${checkedDesc}. ${scanContext.atsDetected ? `ATS detected: ${scanContext.atsDetected}, but returned no active listings.` : 'No linked ATS was found.'} ${scanContext.deeperUrlFound ? `Careers site detected at ${scanContext.deeperUrlFound}, but active jobs could not be confirmed.` : 'No dedicated careers domain was discovered.'}`;
      } else if (scanContext.classification === 'careers_site_detected') {
        scanContext.explanation = `Checked: ${checkedDesc}. Careers site detected at ${scanContext.deeperUrlFound || 'discovered URL'}, but active jobs could not be confirmed. ${scanContext.atsDetected ? `ATS detected: ${scanContext.atsDetected}.` : ''}`;
      }
      // Deduplicate layersChecked
      scanContext.layersChecked = uniqueLayers;
    }

    // Generate hiring signals
    const hiringSignals = generateHiringSignals(jobs, scanContext, deptBreakdown);

    console.log(`[job-scrape] Final: ${jobs.length} jobs | classification: ${scanContext.classification} | ATS: ${scanContext.atsDetected || 'none'} | signals: ${hiringSignals.length}`);

    if (jobs.length === 0) {
      // Store scan context even when no jobs found
      await supabase.from('company_report_sections').upsert({
        company_id: companyId,
        section_type: 'careers',
        content: {
          jobs: [],
          sourceType,
          sourcePlatform,
          totalJobs: 0,
          scanContext,
          hiringSignals,
        },
        summary: scanContext.explanation,
        source_urls: [careersUrl, scanContext.deeperUrlFound].filter(Boolean),
        provider_used: sourcePlatform === 'custom' ? 'firecrawl' : 'ats_api',
        last_successful_update: new Date().toISOString(),
        last_attempted_update: new Date().toISOString(),
        last_error: null,
        freshness_ttl_hours: 48,
        confidence_score: scanContext.confidence === 'high' ? 0.95 : scanContext.confidence === 'medium' ? 0.75 : 0.5,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'company_id,section_type' });

      return new Response(JSON.stringify({
        success: true,
        message: scanContext.explanation,
        jobsAdded: 0,
        sourceType,
        sourcePlatform,
        scanContext,
        hiringSignals,
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
      console.error('[job-scrape] Insert failed:', insertErr);
      return new Response(JSON.stringify({ success: false, error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Cache in company_report_sections
    await supabase.from('company_report_sections').upsert({
      company_id: companyId,
      section_type: 'careers',
      content: {
        jobs: jobRecords,
        sourceType,
        sourcePlatform,
        totalJobs: jobs.length,
        scanContext,
        hiringSignals,
        departmentBreakdown: deptBreakdown,
      },
      summary: `${jobs.length} open positions found via ${sourcePlatform}. ${scanContext.explanation}`,
      source_urls: [careersUrl, scanContext.deeperUrlFound].filter(Boolean),
      provider_used: sourcePlatform === 'custom' ? 'firecrawl' : 'ats_api',
      last_successful_update: new Date().toISOString(),
      last_attempted_update: new Date().toISOString(),
      last_error: null,
      freshness_ttl_hours: 48,
      confidence_score: scanContext.confidence === 'high' ? 0.95 : scanContext.confidence === 'medium' ? 0.75 : 0.5,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,section_type' });

    // Trigger signal engine asynchronously (fire-and-forget)
    supabase.functions.invoke('generate-company-signals', {
      body: { companyId },
    }).catch(err => console.warn('[job-scrape] Signal generation failed:', err));

    return new Response(JSON.stringify({
      success: true,
      jobsAdded: jobs.length,
      companyId,
      sourceType,
      sourcePlatform,
      scanContext,
      hiringSignals,
      departmentBreakdown: deptBreakdown,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[job-scrape] Error:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
