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

    // 1. Search for Glassdoor reviews and worker sentiment data
    const searchQueries = [
      `site:glassdoor.com "${companyName}" reviews employee ratings`,
      `site:glassdoor.com "${companyName}" salary compensation benefits`,
      `site:indeed.com "${companyName}" employee reviews work-life balance`,
      `site:indeed.com "${companyName}" company reviews pros cons`,
      `site:linkedin.com "${companyName}" employee reviews culture`,
      `${companyName} Glassdoor rating CEO approval 2024 2025`,
      `${companyName} Indeed employee complaints workplace issues`,
      `${companyName} worker conditions labor practices wages union`,
    ];

    const allResults: any[] = [];
    for (const query of searchQueries) {
      try {
        const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 5,
            scrapeOptions: { formats: ['markdown'] },
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.data) {
            allResults.push(...searchData.data.map((r: any) => ({
              title: r.title || '',
              url: r.url || '',
              description: r.description || '',
              markdown: (r.markdown || '').slice(0, 2000),
              query,
            })));
          }
        }
      } catch (e) {
        console.error(`Search failed for: ${query}`, e);
      }
    }

    // 2. Get company's public labor stances from DB for hypocrisy comparison
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: stances } = await supabase
      .from('company_public_stances')
      .select('topic, public_position, spending_reality, gap')
      .eq('company_id', companyId);

    const { data: ideologyFlags } = await supabase
      .from('company_ideology_flags')
      .select('org_name, category, relationship_type, severity')
      .eq('company_id', companyId);

    const laborStancesContext = (stances || [])
      .filter((s: any) => /labor|worker|wage|union|employ/i.test(s.topic + s.public_position))
      .map((s: any) => `Topic: ${s.topic} | Public Position: ${s.public_position} | Reality: ${s.spending_reality} | Gap: ${s.gap}`)
      .join('\n');

    const antiLaborFlags = (ideologyFlags || [])
      .filter((f: any) => /anti-labor|union.bust/i.test(f.category))
      .map((f: any) => `${f.org_name} (${f.category}, ${f.relationship_type}, severity: ${f.severity})`)
      .join('\n');

    // 3. AI Analysis
    const contentForAI = allResults.slice(0, 12).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 600) || ''}`
    ).join('\n\n---\n\n');

    const aiPrompt = `You are a corporate labor intelligence analyst for CivicLens. Analyze the following search results about "${companyName}" employee satisfaction and worker conditions.

Search Results:
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
  "hypocrisyFlags": [
    {"topic": "string", "companyClaimsSummary": "what the company says about workers/labor", "workerReality": "what workers actually report", "severity": "high|medium|low", "evidence": "specific data point or quote"}
  ],
  "summary": "2-3 paragraph analysis of worker sentiment, key themes, and any say-do gaps between company messaging and employee experience",
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

    // 4. Store in database
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
