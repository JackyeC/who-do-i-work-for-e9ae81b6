/**
 * voter-lookup — Resolve address → representatives using Census Geocoder + Congress.gov API
 * No external JSON files needed. Real data from official APIs.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CENSUS_GEOCODER_URL = 'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress';
const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const FEC_API_BASE = 'https://api.open.fec.gov/v1';

// State abbreviation to full name mapping
const STATE_NAMES: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
  DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',
  MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',
  WI:'Wisconsin',WY:'Wyoming',DC:'District of Columbia',AS:'American Samoa',GU:'Guam',
  MP:'Northern Mariana Islands',PR:'Puerto Rico',VI:'Virgin Islands',
};

/**
 * Use Census Bureau Geocoder to resolve an address to state + congressional district.
 */
async function geocodeAddress(address: string): Promise<{ state: string; district: string; matchedAddress: string } | null> {
  try {
    const params = new URLSearchParams({
      address,
      benchmark: 'Public_AR_Current',
      vintage: 'Current_Current',
      layers: '54',
      format: 'json',
    });

    const url = `${CENSUS_GEOCODER_URL}?${params}`;
    console.log(`[voter-lookup] Census geocoder: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: controller.signal });
    clearTimeout(timeout);

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

    const geos = match.geographies || {};
    const cdLayer = geos['119th Congressional Districts'] ||
                    geos['118th Congressional Districts'] ||
                    geos['Congressional Districts'] ||
                    Object.values(geos).find((v: any) => Array.isArray(v) && v[0]?.BASENAME);

    let district = '';
    if (Array.isArray(cdLayer) && cdLayer.length > 0) {
      const cd = cdLayer[0];
      district = cd.BASENAME || cd.CD119FP || cd.CD118FP || cd.CDSESSN || '';
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
 * Fetch current members for a state from Congress.gov API directly.
 */
async function fetchMembersForState(stateCode: string, congressApiKey: string): Promise<any[]> {
  const stateName = STATE_NAMES[stateCode.toUpperCase()];
  if (!stateName) {
    console.error(`[voter-lookup] Unknown state code: ${stateCode}`);
    return [];
  }

  try {
    // Fetch current members for this state
    const url = `${CONGRESS_API_BASE}/member?api_key=${congressApiKey}&format=json&currentMember=true&limit=60`;
    console.log(`[voter-lookup] Fetching Congress members, filtering for state: ${stateCode}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(url, { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.error(`[voter-lookup] Congress.gov API failed: ${resp.status}`);
      return [];
    }

    const data = await resp.json();
    const allMembers = data?.members || [];

    // Filter for this state
    const stateMembers = allMembers.filter((m: any) =>
      m.state === stateName || m.state === stateCode.toUpperCase()
    );

    console.log(`[voter-lookup] Got ${allMembers.length} total members, ${stateMembers.length} for ${stateCode}`);
    return stateMembers;
  } catch (err: any) {
    console.error(`[voter-lookup] Congress.gov error:`, err.message);
    return [];
  }
}

/**
 * Fetch members by state using the state-specific endpoint
 */
async function fetchMembersByState(stateCode: string, congressApiKey: string): Promise<any[]> {
  const reps: any[] = [];

  try {
    // Use the state-specific endpoint
    const url = `${CONGRESS_API_BASE}/member/${stateCode.toUpperCase()}?api_key=${congressApiKey}&format=json&currentMember=true`;
    console.log(`[voter-lookup] Congress.gov state endpoint: ${url.replace(congressApiKey, 'KEY')}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const resp = await fetch(url, { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: controller.signal });
    clearTimeout(timeout);

    if (!resp.ok) {
      console.warn(`[voter-lookup] State endpoint failed (${resp.status}), trying general endpoint`);
      return fetchMembersForState(stateCode, congressApiKey);
    }

    const data = await resp.json();
    const members = data?.members || [];
    console.log(`[voter-lookup] Got ${members.length} members for ${stateCode}`);

    for (const m of members) {
      const latestTerm = m.terms?.item?.[m.terms.item.length - 1] || m.terms?.item?.[0];
      const chamber = latestTerm?.chamber || (m.chamber || '');
      const isSenator = chamber === 'Senate';

      reps.push({
        name: m.name || m.directOrderName || 'Unknown',
        bioguideId: m.bioguideId || '',
        party: (m.partyName || '').startsWith('Democrat') ? 'D' : (m.partyName || '').startsWith('Republican') ? 'R' : 'I',
        title: isSenator ? 'U.S. Senator' : 'U.S. Representative',
        level: 'federal',
        state: stateCode.toUpperCase(),
        district: m.district?.toString() || latestTerm?.district?.toString() || null,
        chamber: isSenator ? 'Senate' : 'House',
        url: m.officialWebsiteUrl || m.url || null,
        photoUrl: m.depiction?.imageUrl || null,
        termsServed: m.terms?.item?.length || null,
      });
    }

    return reps;
  } catch (err: any) {
    console.error(`[voter-lookup] fetchMembersByState error:`, err.message);
    return [];
  }
}

/**
 * Fetch top FEC donors for a candidate
 */
async function fetchFECDonors(candidateName: string, state: string, fecApiKey: string): Promise<any[]> {
  try {
    const nameParts = candidateName.trim().split(/\s+/);
    // Handle "Last, First" format from Congress.gov
    let lastName = nameParts[nameParts.length - 1];
    let firstName = nameParts[0];
    if (candidateName.includes(',')) {
      const parts = candidateName.split(',').map(s => s.trim());
      lastName = parts[0];
      firstName = (parts[1] || '').split(/\s+/)[0];
    }

    const searchUrl = `${FEC_API_BASE}/candidates/search/?api_key=${fecApiKey}&name=${encodeURIComponent(candidateName)}&state=${state}&sort=-first_file_date&per_page=5&is_active_candidate=true`;
    console.log(`[voter-lookup] FEC search: ${candidateName} in ${state}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const searchResp = await fetch(searchUrl, { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: controller.signal });
    clearTimeout(timeout);
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
    const cCtrl = new AbortController();
    const cTimeout = setTimeout(() => cCtrl.abort(), 6000);
    const committeeResp = await fetch(
      `${FEC_API_BASE}/candidate/${candidateId}/committees/?api_key=${fecApiKey}&designation=P&per_page=3`,
      { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: cCtrl.signal }
    );
    clearTimeout(cTimeout);
    let committeeId = '';
    if (committeeResp.ok) {
      const cd = await committeeResp.json();
      if (cd.results?.length > 0) committeeId = cd.results[0].committee_id;
    }

    // PAC contributions
    if (committeeId) {
      try {
        const pCtrl = new AbortController();
        const pTimeout = setTimeout(() => pCtrl.abort(), 6000);
        const pacResp = await fetch(
          `${FEC_API_BASE}/schedules/schedule_a/?api_key=${fecApiKey}&committee_id=${committeeId}&contributor_type=C&sort=-contribution_receipt_amount&per_page=20&two_year_transaction_period=2024`,
          { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: pCtrl.signal }
        );
        clearTimeout(pTimeout);
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
      } catch { /* timeout ok */ }
    }

    // Employee donor aggregates
    if (candidateId) {
      try {
        const eCtrl = new AbortController();
        const eTimeout = setTimeout(() => eCtrl.abort(), 6000);
        const totalsResp = await fetch(
          `${FEC_API_BASE}/schedules/schedule_a/by_employer/?api_key=${fecApiKey}&candidate_id=${candidateId}&sort=-total&per_page=15&cycle=2024`,
          { headers: { 'User-Agent': 'WDIWF/1.0' }, signal: eCtrl.signal }
        );
        clearTimeout(eTimeout);
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
      } catch { /* timeout ok */ }
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
    const congressApiKey = Deno.env.get('CONGRESS_GOV_API_KEY') || 'DEMO_KEY';

    // Step 1: Resolve address → state + district
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

    // Step 2: Fetch representatives from Congress.gov API
    const allReps = await fetchMembersByState(resolvedState, congressApiKey);
    console.log(`[voter-lookup] Found ${allReps.length} reps for ${resolvedState}`);

    // Step 3: Filter house reps by district if we have one
    const reps = allReps.filter(rep => {
      if (rep.chamber === 'Senate') return true;
      if (!resolvedDistrict) return true; // show all if no district
      return String(rep.district) === String(resolvedDistrict);
    });

    console.log(`[voter-lookup] Filtered to ${reps.length} reps for district ${resolvedDistrict || 'all'}`);

    // Step 4: Enrich with FEC data in parallel
    const enrichedReps = await Promise.all(reps.map(async (rep) => {
      const dataSources: string[] = ['congress.gov'];

      const fecDonors = await fetchFECDonors(rep.name, rep.state, fecApiKey);
      if (fecDonors.length > 0) dataSources.push('fec');

      return {
        ...rep,
        committees: rep.committees || [],
        corporateFunders: fecDonors.map(d => ({
          companyName: d.name,
          amount: d.total,
          donationType: d.type,
        })),
        totalCorporateFunding: fecDonors.reduce((s: number, d: any) => s + (d.total || 0), 0),
        dataSources,
        confidence: dataSources.length >= 2 ? 'high' : 'medium',
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
