const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Run searches in parallel batches to speed up scanning
async function batchSearch(queries: string[], firecrawlKey: string, batchSize = 4): Promise<{ results: any[]; creditExhausted: boolean }> {
  const allResults: any[] = [];
  let creditExhausted = false;

  for (let i = 0; i < queries.length; i += batchSize) {
    if (creditExhausted) break;
    const batch = queries.slice(i, i + batchSize);
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: searching ${batch.length} queries in parallel`);

    const batchResults = await Promise.allSettled(
      batch.map(async (query) => {
        const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, limit: 5 }),
        });

        if (searchResp.status === 402) {
          throw new Error('CREDIT_EXHAUSTED');
        }

        const searchData = await searchResp.json();
        if (searchResp.ok && searchData.success && searchData.data) {
          return searchData.data.map((r: any) => ({
            title: r.title || '',
            url: r.url || '',
            description: r.description || '',
            markdown: (r.markdown || '').slice(0, 2000),
            query,
          }));
        }
        return [];
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        allResults.push(...r.value);
      } else if (r.reason?.message === 'CREDIT_EXHAUSTED') {
        creditExhausted = true;
        break;
      }
    }
  }

  return { results: allResults, creditExhausted };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const layoffSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Consolidated search queries (reduced from 12+ to 8 targeted ones)
    const searchQueries = [
      `${companyName} Glassdoor reviews employee ratings CEO approval`,
      `${companyName} Indeed employee reviews work-life balance salary`,
      `${companyName} employee complaints worker conditions labor practices`,
      `site:thelayoff.com ${companyName} layoffs morale`,
      `"${companyName}" EEOC NLRB complaint discrimination lawsuit`,
      `"${companyName}" mass layoffs workforce reduction restructuring`,
      `"${companyName}" hostile workplace toxic culture whistleblower`,
      `"${companyName}" worker safety OSHA labor controversy DEI`,
    ];

    // Run all searches in parallel batches of 4
    const { results: allResults, creditExhausted } = await batchSearch(searchQueries, firecrawlKey, 4);

    // Direct scrape of TheLayoff.com in parallel with nothing blocking
    if (!creditExhausted) {
      try {
        const layoffPageUrl = `https://www.thelayoff.com/${layoffSlug}`;
        console.log(`Scraping TheLayoff.com: ${layoffPageUrl}`);
        const scrapeResp = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: layoffPageUrl, formats: ['markdown'], onlyMainContent: true }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
          if (markdown.length > 50) {
            allResults.push({
              title: `TheLayoff.com - ${companyName} Employee Discussion`,
              url: layoffPageUrl,
              description: 'Worker-sourced layoff rumors, morale reports, and insider sentiment',
              markdown: markdown.slice(0, 4000),
              query: 'thelayoff.com direct scrape',
            });
          }
        }
      } catch (e) {
        console.error('TheLayoff.com scrape failed:', e);
      }
    }

    console.log(`Total results collected: ${allResults.length}`);

    if (creditExhausted) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Firecrawl credits exhausted. Please upgrade your Firecrawl plan to continue scanning. Use coupon LOVABLE50 for 50% off your first 3 months at firecrawl.dev/pricing'
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (allResults.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No search results found. The web search returned no data for this company.'
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get company stances for hypocrisy comparison
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [{ data: stances }, { data: ideologyFlags }] = await Promise.all([
      supabase.from('company_public_stances').select('topic, public_position, spending_reality, gap').eq('company_id', companyId),
      supabase.from('company_ideology_flags').select('org_name, category, relationship_type, severity').eq('company_id', companyId),
    ]);

    const laborStancesContext = (stances || [])
      .filter((s: any) => /labor|worker|wage|union|employ/i.test(s.topic + s.public_position))
      .map((s: any) => `Topic: ${s.topic} | Public Position: ${s.public_position} | Reality: ${s.spending_reality} | Gap: ${s.gap}`)
      .join('\n');

    const antiLaborFlags = (ideologyFlags || [])
      .filter((f: any) => /anti-labor|union.bust/i.test(f.category))
      .map((f: any) => `${f.org_name} (${f.category}, ${f.relationship_type}, severity: ${f.severity})`)
      .join('\n');

    // AI Analysis
    const contentForAI = allResults.slice(0, 15).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 800) || ''}`
    ).join('\n\n---\n\n');

    const aiPrompt = `You are a corporate labor intelligence analyst for CivicLens. Analyze the following search results about "${companyName}" employee satisfaction and worker conditions.

Search Results:
${contentForAI}

${laborStancesContext ? `\nCompany's Public Labor Stances:\n${laborStancesContext}` : ''}
${antiLaborFlags ? `\nAnti-Labor Ideology Flags:\n${antiLaborFlags}` : ''}

Extract worker sentiment data and identify hypocrisy between what the company says about workers vs how workers actually feel. Pay special attention to TheLayoff.com content which contains worker-sourced insider intelligence, layoff rumors, and morale reports. Return JSON:
{
  "overallRating": number or null (1-5 scale, Glassdoor-style),
  "ceoApproval": number or null (0-100 percentage),
  "recommendToFriend": number or null (0-100 percentage),
  "workLifeBalance": number or null (1-5),
  "compensationRating": number or null (1-5),
  "cultureRating": number or null (1-5),
  "careerOpportunities": number or null (1-5),
  "topComplaints": [
    {"theme": "string", "frequency": "common|frequent|occasional", "severity": "high|medium|low", "example": "representative quote or summary"}
  ],
  "topPraises": [
    {"theme": "string", "frequency": "common|frequent|occasional", "example": "representative quote or summary"}
  ],
  "layoffRumors": [
    {"rumor": "description of layoff rumor or restructuring signal", "source": "thelayoff.com or other", "recency": "recent|months_ago|older", "credibility": "high|medium|low"}
  ],
  "hypocrisyFlags": [
    {"topic": "string", "companyClaimsSummary": "what the company says about workers/labor", "workerReality": "what workers actually report", "severity": "high|medium|low", "evidence": "specific data point or quote"}
  ],
  "summary": "2-3 paragraph analysis of worker sentiment, key themes, layoff signals, and any say-do gaps between company messaging and employee experience",
  "sentiment": "positive|negative|neutral|mixed"
}

Only include items you find evidence for. Return valid JSON only.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a labor intelligence analyst. Return only valid JSON.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    let aiAnalysis: any = {
      summary: 'Unable to generate analysis.',
      sentiment: 'unknown',
      topComplaints: [],
      topPraises: [],
      hypocrisyFlags: [],
    };

    if (aiResp.ok) {
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        aiAnalysis = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        aiAnalysis.summary = content.slice(0, 1000);
      }
    } else {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limited. Please try again in a moment.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted. Please add funds.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Store in database
    const { error: insertError } = await supabase.from('company_worker_sentiment').insert({
      company_id: companyId,
      scan_type: 'firecrawl_ai',
      overall_rating: aiAnalysis.overallRating || null,
      ceo_approval: aiAnalysis.ceoApproval || null,
      recommend_to_friend: aiAnalysis.recommendToFriend || null,
      work_life_balance: aiAnalysis.workLifeBalance || null,
      compensation_rating: aiAnalysis.compensationRating || null,
      culture_rating: aiAnalysis.cultureRating || null,
      career_opportunities: aiAnalysis.careerOpportunities || null,
      top_complaints: aiAnalysis.topComplaints || [],
      top_praises: aiAnalysis.topPraises || [],
      hypocrisy_flags: aiAnalysis.hypocrisyFlags || [],
      ai_summary: aiAnalysis.summary,
      sentiment: aiAnalysis.sentiment,
      sources: allResults.slice(0, 15).map((r: any) => ({ title: r.title, url: r.url })),
      raw_results: allResults.slice(0, 15),
    });

    if (insertError) {
      console.error('Failed to store scan:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      signalsFound: 1,
      sourcesScanned: allResults.length,
      data: {
        overallRating: aiAnalysis.overallRating,
        ceoApproval: aiAnalysis.ceoApproval,
        recommendToFriend: aiAnalysis.recommendToFriend,
        workLifeBalance: aiAnalysis.workLifeBalance,
        compensationRating: aiAnalysis.compensationRating,
        cultureRating: aiAnalysis.cultureRating,
        careerOpportunities: aiAnalysis.careerOpportunities,
        topComplaints: aiAnalysis.topComplaints || [],
        topPraises: aiAnalysis.topPraises || [],
        layoffRumors: aiAnalysis.layoffRumors || [],
        hypocrisyFlags: aiAnalysis.hypocrisyFlags || [],
        summary: aiAnalysis.summary,
        sentiment: aiAnalysis.sentiment,
        sources: allResults.slice(0, 15).map((r: any) => ({ title: r.title, url: r.url })),
        resultCount: allResults.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Worker sentiment scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
