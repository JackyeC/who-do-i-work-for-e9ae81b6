const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FEC_API_BASE = 'https://api.open.fec.gov/v1';

// Search FEC for a candidate and get their top PAC/organization donors
async function fetchFECDonors(candidateName: string, state: string, fecApiKey: string): Promise<any[]> {
  try {
    // Step 1: Find the candidate in FEC
    const nameParts = candidateName.trim().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];

    const searchUrl = `${FEC_API_BASE}/candidates/search/?api_key=${fecApiKey}&name=${encodeURIComponent(candidateName)}&state=${state}&sort=-election_year&per_page=5&is_active_candidate=true`;
    const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
    if (!searchResp.ok) {
      console.log(`FEC candidate search failed: ${searchResp.status}`);
      return [];
    }
    const searchData = await searchResp.json();
    const candidates = searchData.results || [];
    
    if (candidates.length === 0) {
      console.log(`No FEC candidate found for "${candidateName}" in ${state}`);
      return [];
    }

    // Find best match
    const candidate = candidates.find((c: any) => {
      const cName = (c.name || '').toUpperCase();
      return cName.includes(lastName.toUpperCase()) && cName.includes(firstName.toUpperCase().slice(0, 3));
    }) || candidates[0];

    const candidateId = candidate.candidate_id;
    console.log(`FEC match: ${candidate.name} (${candidateId})`);

    // Step 2: Find their principal committee
    const committeeUrl = `${FEC_API_BASE}/candidate/${candidateId}/committees/?api_key=${fecApiKey}&designation=P&per_page=3`;
    const committeeResp = await fetch(committeeUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
    let committeeId = '';
    if (committeeResp.ok) {
      const committeeData = await committeeResp.json();
      const committees = committeeData.results || [];
      if (committees.length > 0) {
        committeeId = committees[0].committee_id;
      }
    }

    // Step 3: Get top PAC/organization contributors
    // Use schedules/schedule_a to get contributions by contributor type
    const donors: any[] = [];

    // Fetch PAC contributions to this candidate
    if (committeeId) {
      const pacUrl = `${FEC_API_BASE}/schedules/schedule_a/?api_key=${fecApiKey}&committee_id=${committeeId}&contributor_type=C&sort=-contribution_receipt_amount&per_page=20&two_year_transaction_period=2024`;
      const pacResp = await fetch(pacUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
      if (pacResp.ok) {
        const pacData = await pacResp.json();
        const results = pacData.results || [];
        
        // Aggregate by contributor name
        const aggregated: Record<string, { name: string; total: number; type: string }> = {};
        for (const r of results) {
          const name = r.contributor_name || r.committee?.name || 'Unknown';
          const cleanName = name.replace(/\s+(PAC|POLITICAL ACTION COMMITTEE|COMMITTEE|FOR CONGRESS|FOR SENATE|FOR AMERICA)\s*$/i, '').trim();
          if (!aggregated[cleanName]) {
            aggregated[cleanName] = { name: cleanName, total: 0, type: 'pac' };
          }
          aggregated[cleanName].total += r.contribution_receipt_amount || 0;
        }
        donors.push(...Object.values(aggregated));
      }
    }

    // Also try the /totals endpoint for overall top donors  
    if (candidateId) {
      const totalsUrl = `${FEC_API_BASE}/schedules/schedule_a/by_employer/?api_key=${fecApiKey}&candidate_id=${candidateId}&sort=-total&per_page=15&cycle=2024`;
      const totalsResp = await fetch(totalsUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
      if (totalsResp.ok) {
        const totalsData = await totalsResp.json();
        const results = totalsData.results || [];
        for (const r of results) {
          const employer = r.employer || '';
          if (!employer || employer === 'NONE' || employer === 'SELF-EMPLOYED' || employer === 'RETIRED' || employer === 'NOT EMPLOYED' || employer === 'N/A' || employer.length < 3) continue;
          // Avoid duplicates with PAC donors
          const exists = donors.some(d => d.name.toUpperCase() === employer.toUpperCase());
          if (!exists) {
            donors.push({ name: employer, total: r.total || 0, type: 'employee-donors' });
          }
        }
      }
    }

    // Sort by total descending and take top 15
    donors.sort((a, b) => b.total - a.total);
    return donors.slice(0, 15);
  } catch (err: any) {
    console.error(`FEC lookup error for ${candidateName}:`, err.message);
    return [];
  }
}

// Title case helper
function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, (word) => {
    if (['LLC', 'PAC', 'USA', 'US', 'LLP', 'INC', 'LP', 'NA'].includes(word.toUpperCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

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

    const fecApiKey = Deno.env.get('FEC_API_KEY') || 'DEMO_KEY';

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

    // Build company name → slug mapping for linking FEC results
    const companyNameToSlug: Record<string, { slug: string; score: number; industry: string }> = {};
    (companies || []).forEach((c: any) => {
      companyNameToSlug[c.name.toUpperCase()] = { slug: c.slug, score: c.civic_footprint_score, industry: c.industry };
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

    // 4. Enrich each rep with BOTH our DB data AND live FEC data
    const enrichedReps = await Promise.all((reps.representatives || []).map(async (rep: any) => {
      const key = rep.name.toLowerCase();
      // Our DB data
      const dbFunders = candidateCompanyMap[key] || [];

      // Live FEC data
      const fecDonors = await fetchFECDonors(rep.name, rep.state || reps.state, fecApiKey);

      // Merge: start with DB funders, then add FEC donors not already present
      const existingNames = new Set(dbFunders.map((f: any) => f.companyName.toUpperCase()));
      const fecFunders = fecDonors
        .filter(d => !existingNames.has(d.name.toUpperCase()))
        .map(d => {
          const match = companyNameToSlug[d.name.toUpperCase()];
          return {
            companyName: toTitleCase(d.name),
            companySlug: match?.slug || '',
            companyScore: match?.score || null,
            industry: match?.industry || '',
            amount: d.total,
            donationType: d.type,
            flagged: false,
            flagReason: null,
            source: 'fec',
          };
        });

      const allFunders = [...dbFunders, ...fecFunders].sort((a, b) => (b.amount || 0) - (a.amount || 0));

      return {
        ...rep,
        corporateFunders: allFunders,
        totalCorporateFunding: allFunders.reduce((s: number, f: any) => s + (f.amount || 0), 0),
        flaggedDonations: allFunders.filter((f: any) => f.flagged),
        fecDataFound: fecDonors.length > 0,
      };
    }));

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
