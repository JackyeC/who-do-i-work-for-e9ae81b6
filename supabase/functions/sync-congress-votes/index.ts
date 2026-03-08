const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Uses free congress.gov data via unitedstates project (no API key needed)
// and bioguide data for legislator lookup
const LEGISLATORS_URL = 'https://theunitedstates.io/congress-legislators/legislators-current.json';
const CONGRESS_GOV_BASE = 'https://api.congress.gov/v3';

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

// Normalize names for matching (FEC uses "LASTNAME, FIRSTNAME" format)
function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCandidateToLegislator(
  candidateName: string,
  legislators: Legislator[]
): CandidateMatch | null {
  const normalized = normalizeName(candidateName);
  
  // FEC format: "LASTNAME, FIRSTNAME MIDDLENAME"
  const parts = normalized.split(/,\s*/);
  const lastName = parts[0]?.trim();
  const firstName = parts[1]?.split(/\s+/)[0]?.trim();

  if (!lastName) return null;

  for (const leg of legislators) {
    const legLast = normalizeName(leg.name.last);
    const legFirst = normalizeName(leg.name.first);
    
    // Match by last name + first name initial or full match
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

  // Broader match: just last name (for uncommon last names)
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-congress] Starting for ${companyName}...`);

    // Step 1: Get company's PAC recipients from our DB
    const { data: candidates } = await supabase
      .from('company_candidates')
      .select('name, party, state, amount, donation_type')
      .eq('company_id', companyId)
      .order('amount', { ascending: false })
      .limit(50);

    if (!candidates || candidates.length === 0) {
      console.log(`[sync-congress] No PAC recipients found for ${companyName}`);
      return new Response(JSON.stringify({
        success: true,
        message: 'No PAC recipients to cross-reference',
        stats: { candidatesChecked: 0, legislatorsMatched: 0, signalsCreated: 0 },
        sourcesScanned: 0,
        signalsFound: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Fetch current legislators list (cached by CDN, very fast)
    console.log(`[sync-congress] Fetching legislators database...`);
    const legResp = await fetch(LEGISLATORS_URL, {
      headers: { 'User-Agent': 'CivicLens/1.0 (civic-transparency-platform)' },
    });

    if (!legResp.ok) {
      throw new Error(`Failed to fetch legislators: ${legResp.status}`);
    }

    const legislators: Legislator[] = await legResp.json();
    console.log(`[sync-congress] Loaded ${legislators.length} current legislators`);

    // Step 3: Match PAC recipients to legislators
    const matches: Array<CandidateMatch & { donation_amount: number; donation_type: string }> = [];

    for (const candidate of candidates) {
      const match = matchCandidateToLegislator(candidate.name, legislators);
      if (match) {
        matches.push({
          ...match,
          donation_amount: candidate.amount,
          donation_type: candidate.donation_type,
        });
      }
    }

    console.log(`[sync-congress] Matched ${matches.length}/${candidates.length} PAC recipients to current legislators`);

    // Step 4: Create entity linkages for matched legislators
    const linkages: any[] = [];
    const signalRows: any[] = [];

    for (const match of matches) {
      // Create linkage: candidate → legislator with committee info
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
        description: `${match.candidate_name} (${match.party}-${match.state}) serves in the ${match.chamber}. Received $${match.donation_amount.toLocaleString()} from ${companyName} PAC.`,
        source_citation: JSON.stringify([{
          source: 'unitedstates.io',
          url: `https://bioguide.congress.gov/search/bio/${match.bioguide_id}`,
          retrieved_at: new Date().toISOString(),
        }]),
        metadata: JSON.stringify({
          bioguide_id: match.bioguide_id,
          party: match.party,
          state: match.state,
          chamber: match.chamber,
          current_term: match.current_term,
          fec_ids: match.fec_ids,
        }),
      });
    }

    // Create summary signal
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

      signalRows.push({
        company_id: companyId,
        signal_category: 'congress_cross_reference',
        signal_type: 'pac_recipients_in_congress',
        signal_value: `${matches.length} current members of Congress received ${companyName} PAC funds`,
        confidence_level: 'direct',
        source_url: `https://www.opensecrets.org/orgs/summary?id=${encodeURIComponent(companyName)}`,
        raw_excerpt: JSON.stringify({
          total_matched: matches.length,
          party_breakdown: partyBreakdown,
          chamber_breakdown: chamberBreakdown,
          top_recipients: matches.slice(0, 10).map(m => ({
            name: m.candidate_name,
            party: m.party,
            state: m.state,
            chamber: m.chamber,
            amount: m.donation_amount,
          })),
        }),
      });

      // Flag if donations are heavily one-sided
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
            source_url: `https://www.opensecrets.org/orgs/summary?id=${encodeURIComponent(companyName)}`,
            raw_excerpt: JSON.stringify({ republican_pct: repPct, democratic_pct: demPct, total: totalDonated }),
          });
        }
      }
    }

    // Step 5: Store results
    if (linkages.length > 0) {
      // Clear old congress linkages
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
      linkagesCreated: linkages.length,
      signalsCreated: signalRows.length,
    };

    console.log(`[sync-congress] ✅ Complete for ${companyName}: ${matches.length} legislators matched, ${signalRows.length} signals`);

    return new Response(JSON.stringify({
      success: true,
      message: `Congress cross-reference complete for ${companyName}`,
      stats,
      sourcesScanned: matches.length > 0 ? 1 : 0,
      signalsFound: signalRows.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('[sync-congress] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error',
      errorType: 'server_error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
