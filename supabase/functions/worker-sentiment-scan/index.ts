const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';

const CACHE_TTL_DAYS = 7;

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ─── Cache check: return existing data if fresh ───
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('company_worker_sentiment')
      .select('*')
      .eq('company_id', companyId)
      .gte('created_at', cacheThreshold)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log(`[worker-sentiment] Cache hit for ${companyName} (${cached.created_at})`);
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        signalsFound: 1,
        sourcesScanned: (cached.sources || []).length,
        data: {
          overallRating: cached.overall_rating,
          ceoApproval: cached.ceo_approval,
          recommendToFriend: cached.recommend_to_friend,
          workLifeBalance: cached.work_life_balance,
          compensationRating: cached.compensation_rating,
          cultureRating: cached.culture_rating,
          careerOpportunities: cached.career_opportunities,
          topComplaints: cached.top_complaints || [],
          topPraises: cached.top_praises || [],
          layoffRumors: cached.layoff_rumors || [],
          hypocrisyFlags: cached.hypocrisy_flags || [],
          summary: cached.ai_summary,
          sentiment: cached.sentiment,
          sources: cached.sources || [],
          resultCount: (cached.sources || []).length,
          cachedAt: cached.created_at,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consolidated search queries
    const searchQueries = [
      `${companyName} Glassdoor reviews employee ratings work-life balance`,
      `${companyName} Indeed employee reviews salary culture`,
      `"${companyName}" EEOC NLRB discrimination lawsuit labor`,
      `"${companyName}" mass layoffs restructuring workforce cuts`,
      `"${companyName}" toxic culture whistleblower worker safety`,
    ];

    // Use resilient search: Firecrawl → Gemini fallback (free)
    const { results: allResults, source: searchSource } = await resilientSearch(
      searchQueries, firecrawlKey, lovableKey, { batchSize: 3 }
    );

    console.log(`[worker-sentiment] ${allResults.length} results via ${searchSource}`);

    if (allResults.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No search results found. The web search returned no data for this company.'
      }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get company stances for hypocrisy comparison
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
    const contentForAI = allResults.slice(0, 12).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 600) || ''}`
    ).join('\n\n---\n\n');

    const sourceNote = searchSource === 'gemini_fallback'
      ? '\nNote: This research data comes from AI knowledge rather than live web scraping. Focus on well-known facts and be conservative with ratings.'
      : '';

    const aiPrompt = `You are a corporate labor intelligence analyst for CivicLens. Analyze the following research about "${companyName}" employee satisfaction and worker conditions.
${sourceNote}

Research Data:
${contentForAI}

${laborStancesContext ? `\nCompany's Public Labor Stances:\n${laborStancesContext}` : ''}
${antiLaborFlags ? `\nAnti-Labor Ideology Flags:\n${antiLaborFlags}` : ''}

Extract worker sentiment data and identify hypocrisy between what the company says about workers vs how workers actually feel. Return JSON:
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
    {"rumor": "description", "source": "source", "recency": "recent|months_ago|older", "credibility": "high|medium|low"}
  ],
  "hypocrisyFlags": [
    {"topic": "string", "companyClaimsSummary": "what the company says", "workerReality": "what workers report", "severity": "high|medium|low", "evidence": "specific data point"}
  ],
  "summary": "2-3 paragraph analysis of worker sentiment, key themes, and any say-do gaps",
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
    }

    // Store in database
    const { error: insertError } = await supabase.from('company_worker_sentiment').insert({
      company_id: companyId,
      scan_type: searchSource === 'gemini_fallback' ? 'gemini_research' : 'firecrawl_ai',
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
      sources: allResults.slice(0, 12).map((r: any) => ({ title: r.title, url: r.url })),
      raw_results: allResults.slice(0, 12),
    });

    if (insertError) {
      console.error('Failed to store scan:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      signalsFound: 1,
      sourcesScanned: allResults.length,
      searchSource,
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
        sources: allResults.slice(0, 12).map((r: any) => ({ title: r.title, url: r.url })),
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