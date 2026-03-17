const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { resilientSearch } from '../_shared/resilient-search.ts';
const FEC_API_BASE = 'https://api.open.fec.gov/v1';
const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const LEGISLATORS_URL = 'https://theunitedstates.io/congress-legislators/legislators-current.json';

// Resolve bioguide ID from name
async function resolveBioguideId(name: string, state?: string): Promise<{ bioguideId: string; legislator: any } | null> {
  try {
    const resp = await fetch(LEGISLATORS_URL, { headers: { 'User-Agent': 'CivicLens/1.0' } });
    if (!resp.ok) return null;
    const legislators = await resp.json();
    const normalized = name.toUpperCase().replace(/[^A-Z\s]/g, '').trim();

    for (const leg of legislators) {
      const fullName = (leg.name.official_full || `${leg.name.first} ${leg.name.last}`).toUpperCase();
      const lastName = leg.name.last.toUpperCase();
      const firstName = leg.name.first.toUpperCase();

      if (fullName.includes(normalized) || normalized.includes(fullName) ||
          (normalized.includes(lastName) && normalized.includes(firstName.slice(0, 3)))) {
        if (state) {
          const currentTerm = leg.terms[leg.terms.length - 1];
          if (currentTerm.state !== state.toUpperCase()) continue;
        }
        return { bioguideId: leg.id.bioguide, legislator: leg };
      }
    }
    return null;
  } catch { return null; }
}

// Fetch Congress.gov member details
async function fetchCongressMember(bioguideId: string, apiKey: string) {
  try {
    const resp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${apiKey}&format=json`,
      { headers: { 'User-Agent': 'CivicLens/1.0' } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const m = data?.member;
    if (!m) return null;

    const currentTerm = m.terms?.[m.terms.length - 1];
    return {
      party: m.partyName,
      chamber: currentTerm?.chamber || null,
      committees: (currentTerm?.committees || []).map((c: any) => c.name),
      termsServed: m.terms?.length || 0,
      photoUrl: m.depiction?.imageUrl || null,
      leadership: m.leadership || [],
      officialName: m.directOrderName || m.invertedOrderName,
    };
  } catch (e: any) {
    console.warn(`Congress.gov fetch error for ${bioguideId}:`, e.message);
    return null;
  }
}

// Search FEC for a candidate and get their top PAC/organization donors
async function fetchFECDonors(candidateName: string, state: string, fecApiKey: string): Promise<any[]> {
  try {
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

    const candidate = candidates.find((c: any) => {
      const cName = (c.name || '').toUpperCase();
      return cName.includes(lastName.toUpperCase()) && cName.includes(firstName.toUpperCase().slice(0, 3));
    }) || candidates[0];

    const candidateId = candidate.candidate_id;
    console.log(`FEC match: ${candidate.name} (${candidateId})`);

    const committeeUrl = `${FEC_API_BASE}/candidate/${candidateId}/committees/?api_key=${fecApiKey}&designation=P&per_page=3`;
    const committeeResp = await fetch(committeeUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
    let committeeId = '';
    if (committeeResp.ok) {
      const committeeData = await committeeResp.json();
      const committees = committeeData.results || [];
      if (committees.length > 0) committeeId = committees[0].committee_id;
    }

    const donors: any[] = [];

    if (committeeId) {
      const pacUrl = `${FEC_API_BASE}/schedules/schedule_a/?api_key=${fecApiKey}&committee_id=${committeeId}&contributor_type=C&sort=-contribution_receipt_amount&per_page=20&two_year_transaction_period=2024`;
      const pacResp = await fetch(pacUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
      if (pacResp.ok) {
        const pacData = await pacResp.json();
        const results = pacData.results || [];
        const aggregated: Record<string, { name: string; total: number; type: string }> = {};
        for (const r of results) {
          const name = r.contributor_name || r.committee?.name || 'Unknown';
          const cleanName = name.replace(/\s+(PAC|POLITICAL ACTION COMMITTEE|COMMITTEE|FOR CONGRESS|FOR SENATE|FOR AMERICA)\s*$/i, '').trim();
          if (!aggregated[cleanName]) aggregated[cleanName] = { name: cleanName, total: 0, type: 'pac' };
          aggregated[cleanName].total += r.contribution_receipt_amount || 0;
        }
        donors.push(...Object.values(aggregated));
      }
    }

    if (candidateId) {
      const totalsUrl = `${FEC_API_BASE}/schedules/schedule_a/by_employer/?api_key=${fecApiKey}&candidate_id=${candidateId}&sort=-total&per_page=15&cycle=2024`;
      const totalsResp = await fetch(totalsUrl, { headers: { 'User-Agent': 'CivicLens/1.0' } });
      if (totalsResp.ok) {
        const totalsData = await totalsResp.json();
        const results = totalsData.results || [];
        for (const r of results) {
          const employer = r.employer || '';
          if (!employer || employer === 'NONE' || employer === 'SELF-EMPLOYED' || employer === 'RETIRED' || employer === 'NOT EMPLOYED' || employer === 'N/A' || employer.length < 3) continue;
          const exists = donors.some(d => d.name.toUpperCase() === employer.toUpperCase());
          if (!exists) donors.push({ name: employer, total: r.total || 0, type: 'employee-donors' });
        }
      }
    }

    donors.sort((a, b) => b.total - a.total);
    return donors.slice(0, 15);
  } catch (err: any) {
    console.error(`FEC lookup error for ${candidateName}:`, err.message);
    return [];
  }
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w+/g, (word) => {
    if (['LLC', 'PAC', 'USA', 'US', 'LLP', 'INC', 'LP', 'NA'].includes(word.toUpperCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

// Compute confidence level based on data sources available
function computeConfidence(sources: string[]): { level: string; score: number } {
  const score = sources.length;
  if (score >= 3) return { level: 'high', score: 1.0 };
  if (score >= 2) return { level: 'medium', score: 0.7 };
  return { level: 'low', score: 0.4 };
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
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // FIX: Use correct secret name
    const fecApiKey = Deno.env.get('OPENFEC_API_KEY') || 'DEMO_KEY';
    const congressApiKey = Deno.env.get('CONGRESS_GOV_API_KEY');

    console.log(`[voter-lookup] FEC key present: ${fecApiKey !== 'DEMO_KEY'}, Congress key present: ${!!congressApiKey}`);

    // 1. Search for representatives
    const searchQuery = address
      ? `who are the elected representatives for "${address}" US Congress senator representative 2025`
      : `${state} ${district || ''} elected representatives US Congress senator 2025`;

    const { results: searchResults } = await resilientSearch([searchQuery], firecrawlKey, lovableKey);
    const formattedResults = searchResults.map(r => ({
      title: r.title || '',
      url: r.url || '',
      markdown: (r.markdown || '').slice(0, 1500),
    }));

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

    const companyNameToSlug: Record<string, { slug: string; score: number; industry: string }> = {};
    (companies || []).forEach((c: any) => {
      companyNameToSlug[c.name.toUpperCase()] = { slug: c.slug, score: c.civic_footprint_score, industry: c.industry };
    });

    // 3. AI to identify representatives
    const contentForAI = formattedResults.map((r: any, i: number) =>
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
      "level": "federal",
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
      "level": "state",
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

    // 4. Enrich each rep with DB data, FEC data, AND Congress.gov data
    const enrichedReps = await Promise.all((reps.representatives || []).map(async (rep: any) => {
      const key = rep.name.toLowerCase();
      const dbFunders = candidateCompanyMap[key] || [];
      const dataSources: string[] = ['ai'];

      // Congress.gov enrichment
      let congressData: any = null;
      if (congressApiKey) {
        const resolved = await resolveBioguideId(rep.name, rep.state || reps.state);
        if (resolved) {
          congressData = await fetchCongressMember(resolved.bioguideId, congressApiKey);
          if (congressData) dataSources.push('congress.gov');
        }
      }

      // Live FEC data
      const fecDonors = await fetchFECDonors(rep.name, rep.state || reps.state, fecApiKey);
      if (fecDonors.length > 0) dataSources.push('fec');
      if (dbFunders.length > 0 && !dataSources.includes('database')) dataSources.push('database');

      // Merge funders
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
      const confidence = computeConfidence(dataSources);

      return {
        ...rep,
        level: rep.level || 'federal',
        corporateFunders: allFunders,
        totalCorporateFunding: allFunders.reduce((s: number, f: any) => s + (f.amount || 0), 0),
        flaggedDonations: allFunders.filter((f: any) => f.flagged),
        fecDataFound: fecDonors.length > 0,
        // Congress.gov enrichment
        photoUrl: congressData?.photoUrl || null,
        chamber: congressData?.chamber || null,
        committees: congressData?.committees || [],
        termsServed: congressData?.termsServed || null,
        officialParty: congressData?.party || null,
        // Confidence & metadata
        dataSources,
        confidence: confidence.level,
        confidenceScore: confidence.score,
        lastUpdated: new Date().toISOString(),
      };
    }));

    // Add level to state-level reps
    const stateLevel = (reps.stateLevel || []).map((rep: any) => ({
      ...rep,
      level: 'state',
      dataSources: ['ai'],
      confidence: 'low',
      lastUpdated: new Date().toISOString(),
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        state: reps.state,
        district: reps.district,
        representatives: enrichedReps,
        stateLevel,
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
