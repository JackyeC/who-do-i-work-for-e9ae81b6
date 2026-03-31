const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FeedJob {
  title: string;
  company: string;
  location: string;
  url: string;
  publishedAt: string;
  source: string;
  category?: string;
}

const FEEDS = [
  { url: 'https://weworkremotely.com/remote-jobs.rss', source: 'We Work Remotely' },
  { url: 'https://remotive.com/remote-jobs/feed', source: 'Remotive' },
  { url: 'https://himalayas.app/jobs/rss', source: 'Himalayas' },
];

function extractText(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function parseRSSItems(xml: string, source: string): FeedJob[] {
  const items: FeedJob[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractText(itemXml, 'title');
    const link = extractText(itemXml, 'link') || extractAttr(itemXml, 'link', 'href');
    const pubDate = extractText(itemXml, 'pubDate');
    const category = extractText(itemXml, 'category');

    // Try to extract company from title (common format: "Title at Company")
    let jobTitle = title;
    let company = source;
    const atMatch = title.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) {
      jobTitle = atMatch[1].trim();
      company = atMatch[2].trim();
    }

    if (jobTitle && link) {
      items.push({
        title: jobTitle,
        company,
        location: 'Remote',
        url: link,
        publishedAt: pubDate || new Date().toISOString(),
        source,
        category: category || undefined,
      });
    }
  }

  return items;
}

async function fetchTheirStackJobs(limit: number): Promise<{ jobs: FeedJob[]; error?: string }> {
  const apiKey = Deno.env.get('THEIRSTACK_API_KEY');
  if (!apiKey) return { jobs: [], error: 'TheirStack API key not configured' };

  try {
    const res = await fetch('https://api.theirstack.com/v1/jobs/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        posted_at_max_age_days: 7,
        job_title_or: [
          'talent acquisition', 'recruiter', 'recruiting',
          'human resources', 'hr manager', 'hr director', 'hr business partner',
          'people operations', 'people partner', 'people team',
          'dei', 'diversity equity inclusion', 'deib',
          'compensation', 'total rewards', 'benefits',
          'employer brand', 'employee experience',
          'learning and development', 'organizational development',
          'chief people officer', 'head of people', 'vp people',
        ],
        job_country_code_or: ['US', 'CA', 'GB'],
        limit: Math.min(limit, 25),
        order_by: [{ desc: true, field: 'date_posted' }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`TheirStack API [${res.status}]: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const jobs: FeedJob[] = (data.data || []).map((j: any) => ({
      title: j.job_title || j.title || 'Untitled',
      company: j.company_name || j.company?.name || 'Unknown',
      location: j.job_location || j.location || (j.remote ? 'Remote' : 'Not specified'),
      url: j.url || j.job_url || '#',
      publishedAt: j.date_posted || j.discovered_at || new Date().toISOString(),
      source: 'TheirStack',
      category: j.job_seniority || undefined,
    }));

    return { jobs };
  } catch (err: any) {
    console.error('TheirStack fetch error:', err);
    return { jobs: [], error: `TheirStack: ${err.message}` };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 30, sources } = await req.json().catch(() => ({}));

    const feedsToFetch = sources?.length
      ? FEEDS.filter((f) => sources.includes(f.source))
      : FEEDS;

    const includeTheirStack = !sources?.length || sources.includes('TheirStack');

    // Fetch RSS feeds and TheirStack in parallel
    const [rssResults, theirStackResult] = await Promise.all([
      Promise.allSettled(
        feedsToFetch.map(async (feed) => {
          const res = await fetch(feed.url, {
            headers: { 'User-Agent': 'WhoDoIWorkFor-JobAggregator/1.0' },
          });
          if (!res.ok) throw new Error(`${feed.source}: ${res.status}`);
          const xml = await res.text();
          return parseRSSItems(xml, feed.source);
        })
      ),
      includeTheirStack ? fetchTheirStackJobs(limit) : Promise.resolve({ jobs: [] as FeedJob[] }),
    ]);

    const allJobs: FeedJob[] = [];
    const errors: string[] = [];

    rssResults.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        allJobs.push(...r.value);
      } else {
        errors.push(`${feedsToFetch[i].source}: ${r.reason?.message || 'Failed'}`);
        console.error(`Feed error: ${feedsToFetch[i].source}`, r.reason);
      }
    });

    // Add TheirStack results
    allJobs.push(...theirStackResult.jobs);
    if (theirStackResult.error) errors.push(theirStackResult.error);

    // Sort by date descending, then limit
    allJobs.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const limited = allJobs.slice(0, limit);

    return new Response(
      JSON.stringify({ success: true, jobs: limited, totalFound: allJobs.length, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching feeds:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
