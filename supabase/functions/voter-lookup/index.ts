/**
 * voter-lookup — Resolve address → representatives using Census Geocoder + legislators JSON
 * No web search needed. Real data from official sources.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LEGISLATORS_URLS = [
  'https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.json',
  'https://theunitedstates.io/congress-legislators/legislators-current.json',
];
const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';
const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const FEC_API_BASE = 'https://api.open.fec.gov/v1';

// In-memory cache for legislators
let legislatorsCache: any[] | null = null;
let legislatorsCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
}

async function getLegislators(): Promise<any[]> {
  if (legislatorsCache && Date.now() - legislatorsCacheTime < CACHE_TTL_MS) {
    return legislatorsCache;
  }
  for (const url of LEGISLATORS_URLS) {
    try {
      console.log(`[voter-lookup] Trying legislators from: ${url}`);
      const resp = await fetchWithTimeout(url, 8000);
      if (!resp.ok) { console.warn(`[voter-lookup] ${url} returned ${resp.status}`); continue; }
      legislatorsCache = await resp.json();
      legislatorsCacheTime = Date.now();
      console.log(`[voter-lookup] Loaded ${legislatorsCache!.length} legislators from ${url}`);
      return legislatorsCache!;
    } catch (err: any) {
      console.warn(`[voter-lookup] Failed ${url}: ${err.message}`);
    }
  }
  throw new Error('All legislator data sources failed. Please try again.');
}

/**
 * Use Census Bureau Geocoder to resolve an address to state + congressional district.
 * This is a free API, no key needed.
 */
async function geocodeAddress(address: string): Promise<{ state: string; district: string; matchedAddress: string } | null> {
  try {
    const params = new URLSearchParams({
      address,
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current',
      layers: '54', // 119th Congressional Districts (2025)
      format: 'json',
    });

    const url = `${CENSUS_GEOCODER_URL}?${params}`;
    console.log(`[voter-lookup] Census geocoder: ${url}`);

    const resp = await fetch(url, { headers: { 'User-Agent': 'WDIWF/1.0' } });
    if (!resp.ok) {
      console.error(`[voter-lookup] Census geocoder failed: ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) {
      console.log('[voter-lookup] No address matches from Census geocoder');
      return null;
    }

    const match = matches[0];
    const matchedAddress = match.matchedAddress || address;
    const stateCode = match.addressComponents?.state;

    // Get congressional district from geographies
    const geos = match.geographies || {};
    // Try multiple geography layer names
    const cdLayer = geos['119th Congressional Districts'] ||
                    geos['118th Congressional Districts'] ||
                    geos['Congressional Districts'] ||
                    geos['Congressional Districts - 119th'] ||
                    Object.values(geos).find((v: any) => Array.isArray(v) && v[0]?.BASENAME);

    let district = '';
    if (Array.isArray(cdLayer) && cdLayer.length > 0) {
      const cd = cdLayer[0];
      district = cd.BASENAME || cd.CD119FP || cd.CD118FP || cd.CDSESSN || '';
      // Remove leading zeros
      district = district.replace(/^0+/, '') || '0';
    }

    console.log(`[voter-lookup] Geocoded: state=${stateCode}, district=${district}, addr=${matchedAddress}`);
    return { state: stateCode, district, matchedAddress };
  } catch (err: any) {
    console.error(`[voter-lookup] Geocoder error:`, err.message);
    return null;
  }
}

/**
 * Find representatives for a state/district from legislators JSON.
 */
function findReps(legislators: any[], state: string, district: string): any[] {
  const stateUpper = state.toUpperCase();
  const reps: any[] = [];

  for (const leg of legislators) {
    const currentTerm = leg.terms[leg.terms.length - 1];
    if (currentTerm.state !== stateUpper) continue;

    const isSenator = currentTerm.type === 'sen';
    const isHouse = currentTerm.type === 'rep';

    // Senators represent the whole state
    if (isSenator) {
      reps.push({
        name: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
        bioguideId: leg.id.bioguide,
        party: currentTerm.party === 'Democrat' ? 'D' : currentTerm.party === 'Republican' ? 'R' : 'I',
        title: 'U.S. Senator',
        level: 'federal',
        state: stateUpper,
        chamber: 'Senate',
        url: currentTerm.url || null,
      });
    }

    // House reps match by district
    if (isHouse && String(currentTerm.district) === String(district)) {
      reps.push({
        name: leg.name.official_full || `${leg.name.first} ${leg.name.last}`,
        bioguideId: leg.id.bioguide,
        party: currentTerm.party === 'Democrat' ? 'D' : currentTerm.party === 'Republican' ? 'R' : 'I',
        title: 'U.S. Representative',
        level: 'federal',
        state: stateUpper,
        district: String(currentTerm.district),
        chamber: 'House',
        url: currentTerm.url || null,
      });
    }
  }

  return reps;
}

/**
 * Fetch Congress.gov member details (committees, photo, etc.)
 */
async function fetchCongressMember(bioguideId: string, apiKey: string) {
  try {
    const resp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${apiKey}&format=json`,
      { headers: { 'User-Agent': 'WDIWF/1.0' } }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const m = data?.member;
    if (!m) return null;

    const currentTerm = m.terms?.[m.terms.length - 1];
    return {
      committees: (currentTerm?.committees || []).map((c: any) => c.name),
      termsServed: m.terms?.length || 0,
      photoUrl: m.depiction?.imageUrl || null,
      officialName: m.directOrderName || m.invertedOrderName,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch top FEC donors for a candidate
 */
async function fetchFECDonors(candidateName: string, state: string, fecApiKey: string): Promise<any[]> {
  try {
    const nameParts = candidateName.trim().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];

    const searchUrl = `${FEC_API_BASE}/candidates/search/?api_key=${fecApiKey}&name=${encodeURIComponent(candidateName)}&state=${state}&sort=-first_file_date&per_page=5&is_active_candidate=true`;
    console.log(`[voter-lookup] FEC search: ${candidateName} in ${state}`);
    const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': 'WDIWF/1.0' } });
    if (!searchResp.ok) return [];

    const searchData = await searchResp.json();
    const candidates = searchData.results || [];
    if (candidates.length === 0) return [];

    const candidate = candidates.find((c: any) => {
      const cName = (c.name || '').toUpperCase();
      return cName.includes(lastName.toUpperCase()) && cName.includes(firstName.toUpperCase().slice(0, 3));
    }) || candidates[0];

    const candidateId = candidate.candidate_id;
    const donors: any[] = [];

    // Get principal campaign committee
    const committeeResp = await fetch(
      `${FEC_API_BASE}/candidate/${candidateId}/committees/?api_key=${fecApiKey}&designation=P&per_page=3`,
      { headers: { 'User-Agent': 'WDIWF/1.0' } }
    );
    let committeeId = '';
    if (committeeResp.ok) {
      const cd = await committeeResp.json();
      if (cd.results?.length > 0) committeeId = cd.results[0].committee_id;
    }

    // PAC contributions
    if (committeeId) {
      const pacResp = await fetch(
        `${FEC_API_BASE}/schedules/schedule_a/?api_key=${fecApiKey}&committee_id=${committeeId}&contributor_type=C&sort=-contribution_receipt_amount&per_page=20&two_year_transaction_period=2024`,
        { headers: { 'User-Agent': 'WDIWF/1.0' } }
      );
      if (pacResp.ok) {
        const pacData = await pacResp.json();
        const agg: Record<string, { name: string; total: number; type: string }> = {};
        for (const r of (pacData.results || [])) {
          const name = (r.contributor_name || 'Unknown').replace(/\s+(PAC|POLITICAL ACTION COMMITTEE|COMMITTEE|FOR CONGRESS|FOR SENATE)\s*$/i, '').trim();
          if (!agg[name]) agg[name] = { name, total: 0, type: 'pac' };
          agg[name].total += r.contribution_receipt_amount || 0;
        }
        donors.push(...Object.values(agg));
      }
    }

    // Employee donor aggregates
    if (candidateId) {
      const totalsResp = await fetch(
        `${FEC_API_BASE}/schedules/schedule_a/by_employer/?api_key=${fecApiKey}&candidate_id=${candidateId}&sort=-total&per_page=15&cycle=2024`,
        { headers: { 'User-Agent': 'WDIWF/1.0' } }
      );
      if (totalsResp.ok) {
        const totalsData = await totalsResp.json();
        for (const r of (totalsData.results || [])) {
          const employer = r.employer || '';
          if (!employer || ['NONE', 'SELF-EMPLOYED', 'RETIRED', 'NOT EMPLOYED', 'N/A'].includes(employer) || employer.length < 3) continue;
          if (!donors.some(d => d.name.toUpperCase() === employer.toUpperCase())) {
            donors.push({ name: employer.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()), total: r.total || 0, type: 'employee-donors' });
          }
        }
      }
    }

    donors.sort((a, b) => b.total - a.total);
    return donors.slice(0, 10);
  } catch (err: any) {
    console.error(`[voter-lookup] FEC error:`, err.message);
    return [];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address, state: inputState, district: inputDistrict } = await req.json();

    if (!address && !inputState) {
      return new Response(
        JSON.stringify({ success: false, error: 'Address or state is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fecApiKey = Deno.env.get('OPENFEC_API_KEY') || 'DEMO_KEY';
    const congressApiKey = Deno.env.get('CONGRESS_GOV_API_KEY');

    // Step 1: Load legislators
    const legislators = await getLegislators();

    // Step 2: Resolve address → state + district
    let resolvedState = inputState?.toUpperCase() || '';
    let resolvedDistrict = inputDistrict || '';
    let matchedAddress = address || '';

    if (address) {
      const geo = await geocodeAddress(address);
      if (geo) {
        resolvedState = geo.state;
        resolvedDistrict = geo.district;
        matchedAddress = geo.matchedAddress;
      } else {
        // Try to extract state from address as fallback
        const stateMatch = address.match(/\b([A-Z]{2})\b/);
        if (stateMatch) resolvedState = stateMatch[1];
      }
    }

    if (!resolvedState) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not determine your state from the address. Try adding city and state (e.g., "5000 Lake Highlands Dr, Dallas, TX 75214").'
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Find representatives from legislators JSON
    const reps = findReps(legislators, resolvedState, resolvedDistrict);
    console.log(`[voter-lookup] Found ${reps.length} reps for ${resolvedState}-${resolvedDistrict}`);

    // Step 4: Enrich each rep with Congress.gov + FEC data in parallel
    const enrichedReps = await Promise.all(reps.map(async (rep) => {
      const dataSources: string[] = ['congress-legislators'];

      // Congress.gov enrichment
      let congressData: any = null;
      if (congressApiKey && rep.bioguideId) {
        congressData = await fetchCongressMember(rep.bioguideId, congressApiKey);
        if (congressData) dataSources.push('congress.gov');
      }

      // FEC enrichment
      const fecDonors = await fetchFECDonors(rep.name, rep.state, fecApiKey);
      if (fecDonors.length > 0) dataSources.push('fec');

      return {
        name: congressData?.officialName || rep.name,
        bioguideId: rep.bioguideId,
        party: rep.party,
        title: rep.title,
        level: rep.level,
        state: rep.state,
        district: rep.district || null,
        chamber: rep.chamber,
        url: rep.url,
        photoUrl: congressData?.photoUrl || null,
        committees: congressData?.committees || [],
        termsServed: congressData?.termsServed || null,
        corporateFunders: fecDonors.map(d => ({
          companyName: d.name,
          amount: d.total,
          donationType: d.type,
        })),
        totalCorporateFunding: fecDonors.reduce((s: number, d: any) => s + (d.total || 0), 0),
        dataSources,
        confidence: dataSources.length >= 3 ? 'high' : dataSources.length >= 2 ? 'medium' : 'low',
        lastUpdated: new Date().toISOString(),
      };
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        state: resolvedState,
        district: resolvedDistrict,
        representatives: enrichedReps,
        stateLevel: [],
        searchedAddress: matchedAddress,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('[voter-lookup] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
