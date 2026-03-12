const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CACHE_TTL_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, executiveNames } = await req.json();

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
      .from('social_media_scans')
      .select('*')
      .eq('company_id', companyId)
      .gte('created_at', cacheThreshold)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      console.log(`[social-scan] Cache hit for ${companyName} (${cached.created_at})`);
      const contradictionCount = (cached.contradictions || []).length + (cached.stance_shifts || []).length;
      return new Response(JSON.stringify({
        success: true,
        cached: true,
        signalsFound: contradictionCount || (cached.ai_summary ? 1 : 0),
        sourcesScanned: (cached.sources || []).length,
        data: {
          summary: cached.ai_summary,
          sentiment: cached.sentiment,
          contradictions: cached.contradictions || [],
          personnelChanges: cached.personnel_changes || [],
          stanceShifts: cached.stance_shifts || [],
          keyMessages: [],
          sources: cached.sources || [],
          resultCount: (cached.sources || []).length,
          cachedAt: cached.created_at,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

    // Consolidated queries — reduced from 6+ to 4 targeted ones with lang filter
    const searchQueries = [
      `${companyName} political stance controversy boycott scandal 2024 2025 2026`,
      `${companyName} CEO executive public statement policy controversy`,
      `"${companyName}" discrimination lawsuit EEOC DOGE federal workers`,
      `"${companyName}" employee fired laid off mass layoffs workforce cuts`,
    ];

    // Add 1 exec-specific query (reduced from 3)
    const execNames: string[] = executiveNames || [];
    if (execNames.length > 0) {
      searchQueries.push(`"${execNames[0]}" ${companyName} statement policy opinion`);
    }

    // Run Firecrawl searches with English filter
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
            lang: 'en',
            country: 'us',
            scrapeOptions: { formats: ['markdown'] },
          }),
        });

        if (searchResp.status === 402) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Firecrawl credits exhausted. Please upgrade your Firecrawl plan to continue scanning.'
          }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

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

    // 2. AI Analysis
    const contentForAI = allResults.slice(0, 10).map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.description}\n${r.markdown?.slice(0, 500) || ''}`
    ).join('\n\n---\n\n');

    const aiPrompt = `You are a corporate political intelligence analyst for CivicLens. Analyze the following search results about "${companyName}" and its executives (${execNames.join(', ')}).

Search Results:
${contentForAI}

Provide a JSON response with this exact structure:
{
  "summary": "2-3 paragraph summary of key social media and public messaging themes",
  "sentiment": "positive|negative|neutral|mixed",
  "contradictions": [
    {"topic": "string", "publicStatement": "what they said publicly", "reality": "what data shows", "severity": "high|medium|low"}
  ],
  "personnelChanges": [
    {"person": "name", "change": "description of change", "significance": "high|medium|low"}
  ],
  "stanceShifts": [
    {"topic": "string", "previousStance": "what they used to say", "currentStance": "what they say now", "timeframe": "when the shift occurred"}
  ],
  "keyMessages": [
    {"message": "key theme or talking point", "frequency": "how often mentioned", "source": "where it appeared"}
  ]
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
          { role: 'system', content: 'You are a political intelligence analyst. Return only valid JSON.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    let aiAnalysis: any = {
      summary: 'Unable to generate analysis.',
      sentiment: 'unknown',
      contradictions: [],
      personnelChanges: [],
      stanceShifts: [],
      keyMessages: [],
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

    // 3. Store in database
    const { error: insertError } = await supabase.from('social_media_scans').insert({
      company_id: companyId,
      scan_type: 'firecrawl_ai',
      query_used: searchQueries.join(' | '),
      results: allResults.slice(0, 12),
      ai_summary: aiAnalysis.summary,
      sentiment: aiAnalysis.sentiment,
      contradictions: aiAnalysis.contradictions || [],
      personnel_changes: aiAnalysis.personnelChanges || [],
      stance_shifts: aiAnalysis.stanceShifts || [],
      sources: allResults.slice(0, 12).map((r: any) => ({ title: r.title, url: r.url })),
    });

    if (insertError) {
      console.error('Failed to store scan:', insertError);
    }

    const contradictionCount = (aiAnalysis.contradictions || []).length + (aiAnalysis.stanceShifts || []).length;
    return new Response(JSON.stringify({
      success: true,
      signalsFound: contradictionCount || (aiAnalysis.summary ? 1 : 0),
      sourcesScanned: allResults.length,
      data: {
        summary: aiAnalysis.summary,
        sentiment: aiAnalysis.sentiment,
        contradictions: aiAnalysis.contradictions || [],
        personnelChanges: aiAnalysis.personnelChanges || [],
        stanceShifts: aiAnalysis.stanceShifts || [],
        keyMessages: aiAnalysis.keyMessages || [],
        sources: allResults.slice(0, 12).map((r: any) => ({ title: r.title, url: r.url })),
        resultCount: allResults.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Social scan error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
