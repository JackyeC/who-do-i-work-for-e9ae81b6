const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CONGRESS_API_BASE = 'https://api.congress.gov/v3';
const LEGISLATORS_URL = 'https://theunitedstates.io/congress-legislators/legislators-current.json';

interface Legislator {
  id: { bioguide: string; fec?: string[]; govtrack: number };
  name: { first: string; last: string; official_full: string };
  terms: Array<{
    type: 'sen' | 'rep';
    start: string;
    end: string;
    state: string;
    district?: number;
    party: string;
  }>;
}

interface CandidateMatch {
  candidate_name: string;
  bioguide_id: string;
  party: string;
  state: string;
  chamber: string;
  current_term: boolean;
  fec_ids: string[];
}

function normalizeName(name: string): string {
  return name.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
}

function matchCandidateToLegislator(candidateName: string, legislators: Legislator[]): CandidateMatch | null {
  const normalized = normalizeName(candidateName);
  const parts = normalized.split(/,\s*/);
  const lastName = parts[0]?.trim();
  const firstName = parts[1]?.split(/\s+/)[0]?.trim();
  if (!lastName) return null;

  for (const leg of legislators) {
    const legLast = normalizeName(leg.name.last);
    const legFirst = normalizeName(leg.name.first);
    if (legLast === lastName && (
      legFirst === firstName ||
      legFirst.startsWith(firstName?.slice(0, 3) || '') ||
      firstName?.startsWith(legFirst.slice(0, 3))
    )) {
      const currentTerm = leg.terms[leg.terms.length - 1];
      return {
        candidate_name: leg.name.official_full,
        bioguide_id: leg.id.bioguide,
        party: currentTerm.party,
        state: currentTerm.state,
        chamber: currentTerm.type === 'sen' ? 'Senate' : 'House',
        current_term: new Date(currentTerm.end) > new Date(),
        fec_ids: leg.id.fec || [],
      };
    }
  }

  if (lastName.length > 5) {
    const matches = legislators.filter(l => normalizeName(l.name.last) === lastName);
    if (matches.length === 1) {
      const leg = matches[0];
      const currentTerm = leg.terms[leg.terms.length - 1];
      return {
        candidate_name: leg.name.official_full,
        bioguide_id: leg.id.bioguide,
        party: currentTerm.party,
        state: currentTerm.state,
        chamber: currentTerm.type === 'sen' ? 'Senate' : 'House',
        current_term: new Date(currentTerm.end) > new Date(),
        fec_ids: leg.id.fec || [],
      };
    }
  }
  return null;
}

// Fetch member details from Congress.gov API (committees, sponsored legislation)
async function fetchMemberDetails(bioguideId: string, apiKey: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // Fetch member profile
    const memberResp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${apiKey}&format=json`,
      { signal: controller.signal, headers: { 'User-Agent': 'CivicLens/1.0' } }
    );
    if (!memberResp.ok) {
      console.warn(`[sync-congress] Member ${bioguideId} fetch failed: ${memberResp.status}`);
      return null;
    }
    const memberData = await memberResp.json();
    const member = memberData.member;

    // Fetch sponsored legislation (most recent 20)
    const sponsoredResp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}/sponsored-legislation?limit=20&api_key=${apiKey}&format=json`,
      { signal: controller.signal, headers: { 'User-Agent': 'CivicLens/1.0' } }
    );
    let sponsoredBills: any[] = [];
    if (sponsoredResp.ok) {
      const sponsoredData = await sponsoredResp.json();
      sponsoredBills = sponsoredData.sponsoredLegislation || [];
    }

    // Fetch cosponsored legislation (most recent 20)
    const cosponsoredResp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}/cosponsored-legislation?limit=20&api_key=${apiKey}&format=json`,
      { signal: controller.signal, headers: { 'User-Agent': 'CivicLens/1.0' } }
    );
    let cosponsoredBills: any[] = [];
    if (cosponsoredResp.ok) {
      const cosponsoredData = await cosponsoredResp.json();
      cosponsoredBills = cosponsoredData.cosponsoredLegislation || [];
    }

    return {
      bioguide_id: bioguideId,
      official_name: member?.directOrderName || member?.invertedOrderName || null,
      party: member?.partyName || null,
      state: member?.state || null,
      district: member?.district || null,
      depiction: member?.depiction?.imageUrl || null,
      terms_served: member?.terms?.length || 0,
      current_chamber: member?.terms?.[member.terms.length - 1]?.chamber || null,
      leadership_roles: member?.leadership || [],
      committees: (member?.terms?.[member.terms.length - 1]?.committees || []).map((c: any) => ({
        name: c.name,
        chamber: c.chamber,
      })),
      sponsored_bills: sponsoredBills.slice(0, 10).map((b: any) => ({
        congress: b.congress,
        type: b.type,
        number: b.number,
        title: b.title,
        latest_action: b.latestAction?.text || null,
        latest_action_date: b.latestAction?.actionDate || null,
        policy_area: b.policyArea?.name || null,
        url: b.url,
      })),
      cosponsored_bills: cosponsoredBills.slice(0, 10).map((b: any) => ({
        congress: b.congress,
        type: b.type,
        number: b.number,
        title: b.title,
        policy_area: b.policyArea?.name || null,
      })),
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn(`[sync-congress] Timeout fetching member ${bioguideId}`);
    } else {
      console.warn(`[sync-congress] Error fetching member ${bioguideId}:`, err.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const congressApiKey = Deno.env.get('CONGRESS_GOV_API_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!congressApiKey) {
    return new Response(JSON.stringify({ success: false, error: 'CONGRESS_GOV_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-congress] Starting for ${companyName}...`);

    // Step 1: Get company PAC recipients
    const { data: candidates } = await supabase
      .from('company_candidates')
      .select('name, party, state, amount, donation_type')
      .eq('company_id', companyId)
      .order('amount', { ascending: false })
      .limit(50);

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({
        success: true, message: 'No PAC recipients to cross-reference',
        stats: { candidatesChecked: 0, legislatorsMatched: 0, signalsCreated: 0 },
        sourcesScanned: 0, signalsFound: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Fetch current legislators
    const legResp = await fetch(LEGISLATORS_URL, {
      headers: { 'User-Agent': 'CivicLens/1.0 (civic-transparency-platform)' },
    });
    if (!legResp.ok) throw new Error(`Failed to fetch legislators: ${legResp.status}`);
    const legislators: Legislator[] = await legResp.json();
    console.log(`[sync-congress] Loaded ${legislators.length} current legislators`);

    // Step 3: Match PAC recipients to legislators
    const matches: Array<CandidateMatch & { donation_amount: number; donation_type: string }> = [];
    for (const candidate of candidates) {
      const match = matchCandidateToLegislator(candidate.name, legislators);
      if (match) {
        matches.push({ ...match, donation_amount: candidate.amount, donation_type: candidate.donation_type });
      }
    }
    console.log(`[sync-congress] Matched ${matches.length}/${candidates.length} PAC recipients`);

    // Step 4: Enrich top 10 matches with Congress.gov API data
    const enriched: any[] = [];
    const topMatches = matches.slice(0, 10);

    // Fetch in batches of 3 to respect rate limits
    for (let i = 0; i < topMatches.length; i += 3) {
      const batch = topMatches.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map(m => fetchMemberDetails(m.bioguide_id, congressApiKey))
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled' && result.value) {
          enriched.push({
            ...batch[j],
            congress_data: result.value,
          });
        } else {
          enriched.push({ ...batch[j], congress_data: null });
        }
      }
      // Brief pause between batches
      if (i + 3 < topMatches.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    console.log(`[sync-congress] Enriched ${enriched.filter(e => e.congress_data).length}/${topMatches.length} via Congress.gov API`);

    // Step 5: Create entity linkages with enriched data
    const linkages: any[] = [];
    const signalRows: any[] = [];

    for (const match of matches) {
      const enrichedData = enriched.find(e => e.bioguide_id === match.bioguide_id);
      const congressData = enrichedData?.congress_data;

      const committees = congressData?.committees?.map((c: any) => c.name) || [];
      const description = [
        `${match.candidate_name} (${match.party}-${match.state}) serves in the ${match.chamber}.`,
        `Received $${match.donation_amount.toLocaleString()} from ${companyName} PAC.`,
        committees.length > 0 ? `Committees: ${committees.slice(0, 3).join(', ')}.` : '',
        congressData?.sponsored_bills?.length > 0
          ? `Recent bills: ${congressData.sponsored_bills.slice(0, 2).map((b: any) => b.title).join('; ')}.`
          : '',
      ].filter(Boolean).join(' ');

      linkages.push({
        company_id: companyId,
        source_entity_name: match.candidate_name,
        source_entity_type: 'politician',
        source_entity_id: match.bioguide_id,
        target_entity_name: `${match.chamber} - ${match.state}`,
        target_entity_type: 'legislative_body',
        link_type: 'member_on_committee',
        amount: match.donation_amount,
        confidence_score: 0.95,
        description,
        source_citation: JSON.stringify([
          { source: 'congress.gov', url: `https://api.congress.gov/v3/member/${match.bioguide_id}`, retrieved_at: new Date().toISOString() },
          { source: 'unitedstates.io', url: `https://bioguide.congress.gov/search/bio/${match.bioguide_id}`, retrieved_at: new Date().toISOString() },
        ]),
        metadata: JSON.stringify({
          bioguide_id: match.bioguide_id,
          party: match.party,
          state: match.state,
          chamber: match.chamber,
          current_term: match.current_term,
          fec_ids: match.fec_ids,
          committees,
          terms_served: congressData?.terms_served || null,
          depiction_url: congressData?.depiction || null,
          sponsored_bills_count: congressData?.sponsored_bills?.length || 0,
          policy_areas: [...new Set(
            (congressData?.sponsored_bills || [])
              .map((b: any) => b.policy_area)
              .filter(Boolean)
          )],
        }),
      });
    }

    // Summary signals
    if (matches.length > 0) {
      const partyBreakdown: Record<string, { count: number; total: number }> = {};
      for (const m of matches) {
        const party = m.party || 'Unknown';
        if (!partyBreakdown[party]) partyBreakdown[party] = { count: 0, total: 0 };
        partyBreakdown[party].count++;
        partyBreakdown[party].total += m.donation_amount;
      }

      const chamberBreakdown: Record<string, number> = {};
      for (const m of matches) {
        chamberBreakdown[m.chamber] = (chamberBreakdown[m.chamber] || 0) + 1;
      }

      // Collect all policy areas from enriched members
      const allPolicyAreas: string[] = [];
      for (const e of enriched) {
        if (e.congress_data?.sponsored_bills) {
          for (const b of e.congress_data.sponsored_bills) {
            if (b.policy_area) allPolicyAreas.push(b.policy_area);
          }
        }
      }
      const policyAreaCounts: Record<string, number> = {};
      for (const area of allPolicyAreas) {
        policyAreaCounts[area] = (policyAreaCounts[area] || 0) + 1;
      }

      signalRows.push({
        company_id: companyId,
        signal_category: 'congress_cross_reference',
        signal_type: 'pac_recipients_in_congress',
        signal_value: `${matches.length} current members of Congress received ${companyName} PAC funds`,
        confidence_level: 'direct',
        source_url: `https://api.congress.gov/v3/member`,
        raw_excerpt: JSON.stringify({
          total_matched: matches.length,
          party_breakdown: partyBreakdown,
          chamber_breakdown: chamberBreakdown,
          policy_area_focus: Object.entries(policyAreaCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([area, count]) => ({ area, count })),
          top_recipients: matches.slice(0, 10).map(m => {
            const eData = enriched.find(e => e.bioguide_id === m.bioguide_id)?.congress_data;
            return {
              name: m.candidate_name,
              party: m.party,
              state: m.state,
              chamber: m.chamber,
              amount: m.donation_amount,
              committees: eData?.committees?.map((c: any) => c.name) || [],
              recent_bill: eData?.sponsored_bills?.[0]?.title || null,
            };
          }),
          data_sources: ['congress.gov API', 'unitedstates.io'],
        }),
      });

      // Partisan lean signal
      const repTotal = partyBreakdown['Republican']?.total || 0;
      const demTotal = partyBreakdown['Democratic']?.total || partyBreakdown['Democrat']?.total || 0;
      const totalDonated = repTotal + demTotal;

      if (totalDonated > 0) {
        const repPct = Math.round((repTotal / totalDonated) * 100);
        const demPct = Math.round((demTotal / totalDonated) * 100);

        if (repPct > 75 || demPct > 75) {
          const leanParty = repPct > demPct ? 'Republican' : 'Democratic';
          const leanPct = Math.max(repPct, demPct);

          signalRows.push({
            company_id: companyId,
            signal_category: 'congress_cross_reference',
            signal_type: 'partisan_donation_lean',
            signal_value: `${leanPct}% of PAC money to current ${leanParty} legislators`,
            confidence_level: 'direct',
            source_url: `https://api.congress.gov/v3/member`,
            raw_excerpt: JSON.stringify({ republican_pct: repPct, democratic_pct: demPct, total: totalDonated }),
          });
        }
      }

      // Worker-relevant legislation signal
      const workerPolicyAreas = ['Labor and Employment', 'Taxation', 'Health', 'Education', 'Civil Rights and Liberties, Minority Issues'];
      const workerRelevantBills: any[] = [];
      for (const e of enriched) {
        if (e.congress_data?.sponsored_bills) {
          for (const b of e.congress_data.sponsored_bills) {
            if (b.policy_area && workerPolicyAreas.includes(b.policy_area)) {
              workerRelevantBills.push({
                sponsor: e.candidate_name,
                party: e.party,
                bill_title: b.title,
                policy_area: b.policy_area,
                latest_action: b.latest_action,
              });
            }
          }
        }
      }

      if (workerRelevantBills.length > 0) {
        signalRows.push({
          company_id: companyId,
          signal_category: 'congress_cross_reference',
          signal_type: 'worker_relevant_legislation',
          signal_value: `${workerRelevantBills.length} worker-relevant bills sponsored by ${companyName} PAC recipients`,
          confidence_level: 'direct',
          source_url: `https://api.congress.gov/v3/bill`,
          raw_excerpt: JSON.stringify({
            bills: workerRelevantBills.slice(0, 15),
            policy_areas_covered: [...new Set(workerRelevantBills.map(b => b.policy_area))],
          }),
        });
      }
    }

    // Step 6: Store results
    if (linkages.length > 0) {
      await supabase
        .from('entity_linkages')
        .delete()
        .eq('company_id', companyId)
        .eq('target_entity_type', 'legislative_body');

      for (let i = 0; i < linkages.length; i += 50) {
        const batch = linkages.slice(i, i + 50);
        const { error: linkErr } = await supabase.from('entity_linkages').insert(batch);
        if (linkErr) console.error(`[sync-congress] Linkage insert error (batch ${i}):`, linkErr);
      }
    }

    if (signalRows.length > 0) {
      await supabase
        .from('company_signal_scans')
        .delete()
        .eq('company_id', companyId)
        .eq('signal_category', 'congress_cross_reference');

      const { error: sigErr } = await supabase.from('company_signal_scans').insert(signalRows);
      if (sigErr) console.error('[sync-congress] Signal insert error:', sigErr);
    }

    const stats = {
      candidatesChecked: candidates.length,
      legislatorsMatched: matches.length,
      enrichedViaCongressApi: enriched.filter(e => e.congress_data).length,
      linkagesCreated: linkages.length,
      signalsCreated: signalRows.length,
    };

    console.log(`[sync-congress] Done for ${companyName}: ${JSON.stringify(stats)}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Congress cross-reference complete for ${companyName}`,
      stats,
      sourcesScanned: 2,
      signalsFound: signalRows.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[sync-congress] Error:', error);
    return new Response(JSON.stringify({
      success: false, error: error.message || 'Unknown error', errorType: 'server_error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
