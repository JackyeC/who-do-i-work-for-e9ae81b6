/**
 * scrape-careers-page — Scrapes a company's careers page using Firecrawl
 * and extracts hiring signals: job count, benefits language, DEI signals,
 * remote policy, and perks-vs-substance ratio.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  const lovableKey = Deno.env.get('LOVABLE_API_KEY');

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { company_id, company_name, careers_url } = await req.json();

    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine URL to scrape
    let url = careers_url;
    if (!url) {
      // Try to find from company record
      const { data: company } = await supabase
        .from('companies')
        .select('careers_url, website_url, name')
        .eq('id', company_id)
        .single();

      url = company?.careers_url || (company?.website_url ? `${company.website_url}/careers` : null);
    }

    if (!url) {
      console.log(`[scrape-careers] No careers URL for ${company_name || company_id}`);
      return new Response(JSON.stringify({ success: false, error: 'No careers URL available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    console.log(`[scrape-careers] Scraping: ${url} for ${company_name || company_id}`);

    // Scrape using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error(`[scrape-careers] Firecrawl error:`, scrapeData);
      return new Response(JSON.stringify({ success: false, error: 'Scrape failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const textLower = markdown.toLowerCase();

    // Extract signals from scraped content
    const signals = analyzeCareerPage(textLower, markdown);

    // Store in database
    const { error: insertErr } = await supabase
      .from('company_careers_signals')
      .insert({
        company_id,
        active_job_count: signals.jobCount,
        benefits_mentioned: signals.benefits,
        dei_language_score: signals.deiScore,
        remote_policy: signals.remotePolicy,
        perks_vs_substance: signals.perksVsSubstance,
        raw_text_snippet: markdown.slice(0, 2000),
      });

    if (insertErr) {
      console.error(`[scrape-careers] Insert error:`, insertErr);
    }

    console.log(`[scrape-careers] Done for ${company_name}: ${signals.jobCount} jobs, DEI: ${signals.deiScore}`);

    return new Response(JSON.stringify({
      success: true,
      signals,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[scrape-careers] Error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface CareerSignals {
  jobCount: number;
  benefits: string[];
  deiScore: number;
  remotePolicy: string;
  perksVsSubstance: number;
}

function analyzeCareerPage(textLower: string, raw: string): CareerSignals {
  // 1. Estimate job count from patterns
  const jobPatterns = [
    /(\d+)\s*(?:open\s+)?(?:positions?|roles?|jobs?|openings?)/gi,
    /(?:we(?:'re| are)\s+hiring|join\s+(?:our|the)\s+team)/gi,
  ];
  let jobCount = 0;
  for (const p of jobPatterns) {
    const matches = raw.matchAll(p);
    for (const m of matches) {
      if (m[1]) jobCount = Math.max(jobCount, parseInt(m[1], 10));
    }
  }
  // Count job-like headings as fallback
  if (jobCount === 0) {
    const headingMatches = raw.match(/^#{1,3}\s+.+(?:engineer|manager|director|analyst|designer|specialist|coordinator|lead)/gim);
    if (headingMatches) jobCount = headingMatches.length;
  }

  // 2. Benefits detection
  const benefitKeywords = [
    '401k', '401(k)', 'health insurance', 'dental', 'vision', 'pto',
    'paid time off', 'parental leave', 'maternity', 'paternity',
    'stock options', 'equity', 'rsu', 'espp', 'tuition', 'education',
    'wellness', 'mental health', 'life insurance', 'disability',
    'retirement', 'pension', 'flexible spending', 'hsa', 'fsa',
    'childcare', 'fertility', 'adoption', 'sabbatical',
  ];
  const benefits = benefitKeywords.filter(k => textLower.includes(k));

  // 3. DEI language score (0-10)
  const deiKeywords = [
    'diversity', 'equity', 'inclusion', 'belonging', 'equal opportunity',
    'affirmative action', 'ergs', 'employee resource group', 'accessible',
    'neurodiversity', 'disability', 'veteran', 'lgbtq', 'bipoc',
    'underrepresented', 'pay equity', 'pay transparency', 'salary range',
  ];
  const deiMatches = deiKeywords.filter(k => textLower.includes(k));
  const deiScore = Math.min(deiMatches.length, 10);

  // 4. Remote policy detection
  let remotePolicy = 'unknown';
  if (textLower.includes('fully remote') || textLower.includes('100% remote')) {
    remotePolicy = 'fully_remote';
  } else if (textLower.includes('hybrid') || textLower.includes('flexible')) {
    remotePolicy = 'hybrid';
  } else if (textLower.includes('on-site') || textLower.includes('in-office') || textLower.includes('onsite')) {
    remotePolicy = 'onsite';
  } else if (textLower.includes('remote')) {
    remotePolicy = 'remote_friendly';
  }

  // 5. Perks vs substance ratio (0-10, higher = more substance)
  const perkWords = [
    'snacks', 'free food', 'ping pong', 'foosball', 'game room',
    'happy hour', 'beer', 'kombucha', 'casual dress', 'dog friendly',
    'nap pod', 'laundry', 'dry cleaning', 'massage',
  ];
  const substanceWords = [
    '401k', 'health', 'parental leave', 'equity', 'salary',
    'compensation', 'pay transparency', 'growth', 'promotion',
    'learning', 'development', 'mentorship', 'career path',
    'work-life balance', 'pto', 'sabbatical',
  ];
  const perkCount = perkWords.filter(w => textLower.includes(w)).length;
  const substanceCount = substanceWords.filter(w => textLower.includes(w)).length;
  const total = perkCount + substanceCount;
  const perksVsSubstance = total > 0
    ? Math.round((substanceCount / total) * 10)
    : 5; // neutral if no signals

  return {
    jobCount,
    benefits,
    deiScore,
    remotePolicy,
    perksVsSubstance,
  };
}
