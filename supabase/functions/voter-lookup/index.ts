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
    const { address, state, district } = await req.json();

    if (!address && !state) {
      return new Response(
        JSON.stringify({ success: false, error: 'Address or state is required' }),
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

    // 1. Search for representatives
    const searchQuery = address
      ? `who are the elected representatives for "${address}" US Congress senator representative 2025`
      : `${state} ${district || ''} elected representatives US Congress senator 2025`;

    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 8,
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    let searchResults: any[] = [];
    if (searchResp.ok) {
      const searchData = await searchResp.json();
      searchResults = (searchData.data || []).map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        markdown: (r.markdown || '').slice(0, 1500),
      }));
    }

    // 2. Get all candidates from our DB to cross-reference
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allCandidates } = await supabase
      .from('company_candidates')
      .select('name, party, state, district, amount, donation_type, flagged, flag_reason, company_id');

    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, slug, civic_footprint_score, industry');

    const companyMap: Record<string, any> = {};
    (companies || []).forEach((c: any) => { companyMap[c.id] = c; });

    // Build candidate-to-companies mapping
    const candidateCompanyMap: Record<string, any[]> = {};
    (allCandidates || []).forEach((c: any) => {
      const key = c.name.toLowerCase();
      if (!candidateCompanyMap[key]) candidateCompanyMap[key] = [];
      const company = companyMap[c.company_id];
      if (company) {
        candidateCompanyMap[key].push({
          companyName: company.name,
          companySlug: company.slug,
          companyScore: company.civic_footprint_score,
          industry: company.industry,
          amount: c.amount,
          donationType: c.donation_type,
          flagged: c.flagged,
          flagReason: c.flag_reason,
        });
      }
    });

    // 3. AI to identify representatives from search results
    const contentForAI = searchResults.map((r, i) =>
      `[${i + 1}] "${r.title}" (${r.url})\n${r.markdown?.slice(0, 800) || ''}`
    ).join('\n\n---\n\n');

    const knownPoliticians = [...new Set((allCandidates || []).map((c: any) => c.name))].join(', ');

    const aiPrompt = `You are a US civic data analyst. Based on the following search results, identify the elected representatives for the location: "${address || state + ' ' + (district || '')}".

Search Results:
${contentForAI}

Known politicians in our database: ${knownPoliticians}

Return JSON:
{
  "state": "two-letter state code",
  "district": "congressional district number if applicable",
  "representatives": [
    {
      "name": "Full Name",
      "title": "U.S. Senator | U.S. Representative | Governor",
      "party": "D|R|I",
      "state": "XX",
      "district": "district if applicable",
      "inOurDatabase": true/false,
      "notableInfo": "brief note about them"
    }
  ],
  "stateLevel": [
    {
      "name": "Full Name",
      "title": "State Senator | State Representative | etc",
      "party": "D|R|I",
      "district": "district if applicable"
    }
  ]
}

Focus on federal-level reps (Senators + House). Include state-level if found. Return valid JSON only.`;

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a civic data analyst. Return only valid JSON.' },
          { role: 'user', content: aiPrompt },
        ],
      }),
    });

    let reps: any = { state: '', district: '', representatives: [], stateLevel: [] };

    if (aiResp.ok) {
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        reps = JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    } else {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limited. Please try again.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 4. Enrich reps with corporate funding data from our DB
    const enrichedReps = (reps.representatives || []).map((rep: any) => {
      const key = rep.name.toLowerCase();
      const corporateFunders = candidateCompanyMap[key] || [];
      return {
        ...rep,
        corporateFunders,
        totalCorporateFunding: corporateFunders.reduce((s: number, f: any) => s + (f.amount || 0), 0),
        flaggedDonations: corporateFunders.filter((f: any) => f.flagged),
      };
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        state: reps.state,
        district: reps.district,
        representatives: enrichedReps,
        stateLevel: reps.stateLevel || [],
        searchedAddress: address || `${state} ${district || ''}`,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Voter lookup error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
