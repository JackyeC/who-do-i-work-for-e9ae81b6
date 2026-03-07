const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FEC_BASE = 'https://api.open.fec.gov/v1';

interface FECCommittee {
  committee_id: string;
  name: string;
  committee_type: string;
  committee_type_full: string;
  designation: string;
  designation_full: string;
  party: string;
  party_full: string;
  state: string;
  treasurer_name: string;
  cycles: number[];
}

interface FECDisbursement {
  committee_id: string;
  committee: { name: string; party: string; committee_type: string };
  recipient_name: string;
  recipient_state: string;
  disbursement_amount: number;
  disbursement_date: string;
  disbursement_description: string;
  candidate_id: string;
  candidate_name: string;
  candidate_office: string;
  line_number_label: string;
}

interface FECReceipt {
  committee_id: string;
  committee: { name: string };
  contributor_name: string;
  contributor_employer: string;
  contributor_occupation: string;
  contributor_state: string;
  contribution_receipt_amount: number;
  contribution_receipt_date: string;
  recipient_committee_type: string;
}

async function fecFetch(endpoint: string, params: Record<string, string>, apiKey: string): Promise<any> {
  const url = new URL(`${FEC_BASE}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('per_page', '100');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`FEC API ${resp.status}: ${errText.substring(0, 200)}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENFEC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'OPENFEC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { companyId, companyName, pacName, cycle } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const electionCycle = cycle || '2024';
    const searchName = pacName || companyName;

    console.log(`OpenFEC ingestion for "${searchName}" (cycle ${electionCycle})...`);

    // ─── Step 1: Find PAC committees matching this company ───
    const committeeData = await fecFetch('/committees/', {
      q: searchName,
      committee_type: 'Q,N,O,U,V,W', // PACs, Super PACs, etc.
      cycle: electionCycle,
      sort: '-receipts',
    }, apiKey);

    const committees: FECCommittee[] = committeeData.results || [];
    console.log(`Found ${committees.length} committees matching "${searchName}"`);

    if (committees.length === 0) {
      // Also try searching for individual contributions by employer
      console.log('No PAC found. Searching individual contributions by employer name...');
    }

    const stats = {
      committeesFound: committees.length,
      candidatesFunded: 0,
      executiveDonors: 0,
      totalPacSpending: 0,
      totalIndividualGiving: 0,
      linkagesCreated: 0,
    };

    // ─── Step 2: For each PAC, get disbursements to candidates ───
    const allCandidates: Array<{
      name: string; party: string; state: string;
      amount: number; type: string; district?: string;
    }> = [];
    const linkages: any[] = [];

    for (const committee of committees.slice(0, 3)) { // Top 3 PACs
      console.log(`Fetching disbursements for ${committee.name} (${committee.committee_id})...`);

      try {
        // Get disbursements to candidates
        const disbData = await fecFetch(`/schedules/schedule_b/`, {
          committee_id: committee.committee_id,
          two_year_transaction_period: electionCycle,
          sort: '-disbursement_amount',
          disbursement_purpose_category: 'CONTRIBUTIONS',
        }, apiKey);

        const disbursements: FECDisbursement[] = disbData.results || [];
        console.log(`  ${committee.name}: ${disbursements.length} disbursements`);

        for (const d of disbursements) {
          if (d.disbursement_amount <= 0) continue;

          stats.totalPacSpending += d.disbursement_amount;

          if (d.candidate_name) {
            allCandidates.push({
              name: d.candidate_name,
              party: d.committee?.party || 'Unknown',
              state: d.recipient_state || 'Unknown',
              amount: d.disbursement_amount,
              type: 'corporate-pac',
              district: d.candidate_office === 'H' ? d.recipient_state : undefined,
            });

            // Create entity linkage: PAC → Candidate
            linkages.push({
              company_id: companyId,
              source_entity_name: committee.name,
              source_entity_type: 'pac',
              source_entity_id: committee.committee_id,
              target_entity_name: d.candidate_name,
              target_entity_type: 'politician',
              target_entity_id: d.candidate_id || null,
              link_type: 'donation_to_member',
              amount: Math.round(d.disbursement_amount),
              confidence_score: 0.95,
              description: `PAC contribution: ${committee.name} → ${d.candidate_name} ($${d.disbursement_amount.toLocaleString()}, ${d.disbursement_date || electionCycle})`,
              source_citation: JSON.stringify([{
                source: 'OpenFEC',
                url: `https://www.fec.gov/data/disbursements/?committee_id=${committee.committee_id}&recipient_name=${encodeURIComponent(d.candidate_name || '')}`,
                committee_id: committee.committee_id,
                cycle: electionCycle,
                retrieved_at: new Date().toISOString(),
              }]),
              metadata: JSON.stringify({
                committee_type: committee.committee_type_full,
                disbursement_date: d.disbursement_date,
                disbursement_description: d.disbursement_description,
                candidate_office: d.candidate_office,
              }),
            });
          }
        }

        // Rate limit pause
        await new Promise(r => setTimeout(r, 500));
      } catch (e) {
        console.error(`  Error fetching disbursements for ${committee.committee_id}:`, e);
      }
    }

    // ─── Step 3: Individual contributions by employer ───
    try {
      console.log(`Fetching individual contributions where employer = "${companyName}"...`);
      const receiptData = await fecFetch('/schedules/schedule_a/', {
        contributor_employer: companyName,
        two_year_transaction_period: electionCycle,
        sort: '-contribution_receipt_amount',
        is_individual: 'true',
      }, apiKey);

      const receipts: FECReceipt[] = receiptData.results || [];
      console.log(`Found ${receipts.length} individual contributions from ${companyName} employees`);

      // Aggregate by contributor
      const executiveMap = new Map<string, { name: string; total: number; occupation: string; recipients: any[] }>();

      for (const r of receipts) {
        if (r.contribution_receipt_amount <= 0) continue;

        const key = r.contributor_name?.toUpperCase() || 'UNKNOWN';
        const existing = executiveMap.get(key) || {
          name: r.contributor_name,
          total: 0,
          occupation: r.contributor_occupation || 'Unknown',
          recipients: [],
        };
        existing.total += r.contribution_receipt_amount;
        existing.recipients.push({
          committee: r.committee?.name,
          amount: r.contribution_receipt_amount,
          date: r.contribution_receipt_date,
        });
        executiveMap.set(key, existing);

        stats.totalIndividualGiving += r.contribution_receipt_amount;
      }

      // Top executives by giving
      const topExecs = [...executiveMap.values()]
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);

      stats.executiveDonors = topExecs.length;

      // Upsert executives
      if (topExecs.length > 0) {
        const execRows = topExecs.map(e => ({
          company_id: companyId,
          name: e.name,
          title: e.occupation,
          total_donations: Math.round(e.total),
        }));

        // Clear old OpenFEC-sourced executives
        await supabase.from('company_executives').delete().eq('company_id', companyId);
        const { error: execErr } = await supabase.from('company_executives').insert(execRows);
        if (execErr) console.error('Executive insert error:', execErr);
      }
    } catch (e) {
      console.error('Error fetching individual contributions:', e);
    }

    // ─── Step 4: Aggregate & deduplicate candidates ───
    const candidateMap = new Map<string, typeof allCandidates[0]>();
    for (const c of allCandidates) {
      const key = c.name.toUpperCase();
      const existing = candidateMap.get(key);
      if (existing) {
        existing.amount += c.amount;
      } else {
        candidateMap.set(key, { ...c });
      }
    }

    const deduped = [...candidateMap.values()].sort((a, b) => b.amount - a.amount);
    stats.candidatesFunded = deduped.length;

    // Upsert candidates
    if (deduped.length > 0) {
      const candidateRows = deduped.map(c => ({
        company_id: companyId,
        name: c.name,
        party: c.party,
        state: c.state,
        amount: Math.round(c.amount),
        donation_type: c.type,
        district: c.district || null,
        flagged: false,
      }));

      await supabase.from('company_candidates').delete().eq('company_id', companyId);
      const { error: candErr } = await supabase.from('company_candidates').insert(candidateRows);
      if (candErr) console.error('Candidate insert error:', candErr);
    }

    // ─── Step 5: Party breakdown aggregation ───
    const partyTotals = new Map<string, number>();
    for (const c of deduped) {
      const party = c.party.includes('REP') ? 'Republican' :
                     c.party.includes('DEM') ? 'Democrat' : 'Other';
      partyTotals.set(party, (partyTotals.get(party) || 0) + c.amount);
    }

    if (partyTotals.size > 0) {
      const partyColors: Record<string, string> = {
        'Republican': 'hsl(0, 75%, 55%)',
        'Democrat': 'hsl(215, 75%, 55%)',
        'Other': 'hsl(215, 15%, 47%)',
      };

      const partyRows = [...partyTotals.entries()].map(([party, amount]) => ({
        company_id: companyId,
        party,
        amount: Math.round(amount),
        color: partyColors[party] || partyColors['Other'],
      }));

      await supabase.from('company_party_breakdown').delete().eq('company_id', companyId);
      const { error: partyErr } = await supabase.from('company_party_breakdown').insert(partyRows);
      if (partyErr) console.error('Party breakdown insert error:', partyErr);
    }

    // ─── Step 6: Insert entity linkages ───
    if (linkages.length > 0) {
      // Clear old OpenFEC linkages
      await supabase
        .from('entity_linkages')
        .delete()
        .eq('company_id', companyId)
        .eq('link_type', 'donation_to_member')
        .like('description', 'PAC contribution:%');

      for (let i = 0; i < linkages.length; i += 50) {
        const batch = linkages.slice(i, i + 50);
        const { error: linkErr } = await supabase.from('entity_linkages').insert(batch);
        if (linkErr) console.error(`Linkage insert error (batch ${i}):`, linkErr);
        else stats.linkagesCreated += batch.length;
      }
    }

    // ─── Step 7: Update company record with totals & timestamp ───
    const updateFields: Record<string, any> = {
      last_reviewed: new Date().toISOString().split('T')[0],
    };
    if (stats.totalPacSpending > 0) {
      updateFields.total_pac_spending = Math.round(stats.totalPacSpending);
      updateFields.corporate_pac_exists = true;
    }

    await supabase.from('companies').update(updateFields).eq('id', companyId);

    console.log(`✅ OpenFEC sync complete for ${companyName}: ${stats.candidatesFunded} candidates, ${stats.executiveDonors} exec donors, $${stats.totalPacSpending.toLocaleString()} PAC spending`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${stats.candidatesFunded} candidates + ${stats.executiveDonors} executive donors for ${companyName}`,
        stats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('sync-openfec error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
