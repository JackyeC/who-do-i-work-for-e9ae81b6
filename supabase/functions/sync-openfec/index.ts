const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FEC_BASE = 'https://api.open.fec.gov/v1';

// Valid FEC committee_type codes
const VALID_COMMITTEE_TYPES = new Set([
  'C', 'D', 'E', 'H', 'I', 'N', 'O', 'P', 'Q', 'S', 'U', 'V', 'W', 'X', 'Y', 'Z'
]);

const COMMITTEE_TYPE_MAP: Record<string, string> = {
  'PAC': 'Q',
  'SUPER PAC': 'O',
  'INDEPENDENT_EXPENDITURE': 'O',
  'SEPARATE_SEGREGATED': 'Q',
  'NONCONNECTED': 'N',
  'PARTY': 'X',
  'PRESIDENTIAL': 'P',
  'HOUSE': 'H',
  'SENATE': 'S',
};

function normalizeCommitteeTypes(input: string | string[] | undefined | null): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : String(input).split(',');
  const normalized: string[] = [];
  for (const val of raw) {
    const trimmed = val.trim().toUpperCase();
    if (!trimmed) continue;
    if (VALID_COMMITTEE_TYPES.has(trimmed)) { normalized.push(trimmed); continue; }
    if (COMMITTEE_TYPE_MAP[trimmed]) { normalized.push(COMMITTEE_TYPE_MAP[trimmed]); continue; }
    console.warn(`[sync-openfec] Dropping invalid committee_type value: "${trimmed}"`);
  }
  return [...new Set(normalized)];
}

// Normalize FEC contributor names: strip honorifics, suffixes, extra whitespace
function normalizeName(name: string): string {
  if (!name) return 'UNKNOWN';
  return name
    .toUpperCase()
    .replace(/\b(MR|MRS|MS|DR|JR|SR|II|III|IV|ESQ|PHD|MD|HON|REV|PROF)\b\.?/g, '')
    .replace(/[.,]+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .replace(/^\s*,/, '')
    .trim();
}

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

async function fecFetch(endpoint: string, params: Record<string, string | string[]>, apiKey: string): Promise<any> {
  const url = new URL(`${FEC_BASE}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('per_page', '100');
  
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      for (const val of v) url.searchParams.append(k, val);
    } else {
      url.searchParams.set(k, v);
    }
  }

  console.log(`[sync-openfec] FEC request: ${endpoint} params=${JSON.stringify(params)}`);

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const errText = await resp.text();
    const errMsg = `FEC API ${resp.status}: ${errText.substring(0, 300)}`;
    console.error(`[sync-openfec] ${errMsg}`);
    const error = new Error(errMsg) as any;
    error.upstreamStatus = resp.status;
    error.upstreamBody = errText.substring(0, 500);
    throw error;
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

    const { companyId, companyName, pacName, cycle, searchNames, entityMap } = await req.json();

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

    // Use entity resolution: search PACs using all resolved names
    const namesToSearch = searchNames?.length
      ? searchNames.filter((n: string) => {
          const type = entityMap?.[n];
          return !type || type !== 'legal_variant'; // Skip pure legal variants for PAC search
        }).slice(0, 5)
      : [pacName || companyName];

    console.log(`[sync-openfec] OpenFEC ingestion for ${namesToSearch.length} name variants (cycle ${electionCycle})...`);

    // ─── Step 1: Find PAC committees matching company name variants ───
    const committeeTypes = normalizeCommitteeTypes('Q,N,O,U,V,W');
    const allCommittees: FECCommittee[] = [];
    const seenCommitteeIds = new Set<string>();

    for (const searchName of namesToSearch) {
      const committeeParams: Record<string, string | string[]> = {
        q: searchName,
        cycle: electionCycle,
        sort: '-receipts',
      };
      if (committeeTypes.length > 0) committeeParams.committee_type = committeeTypes;

      try {
        const committeeData = await fecFetch('/committees/', committeeParams, apiKey);
        const committees: FECCommittee[] = committeeData.results || [];
        for (const c of committees) {
          if (!seenCommitteeIds.has(c.committee_id)) {
            seenCommitteeIds.add(c.committee_id);
            allCommittees.push(c);
          }
        }
        console.log(`[sync-openfec] "${searchName}": ${committees.length} committees`);
        await new Promise(r => setTimeout(r, 300));
      } catch (e: any) {
        if (e.upstreamStatus === 422) {
          console.warn(`[sync-openfec] FEC validation error for "${searchName}": ${e.upstreamBody}`);
        } else {
          console.error(`[sync-openfec] Committee search error for "${searchName}":`, e);
        }
      }
    }

    console.log(`[sync-openfec] Total unique committees found: ${allCommittees.length}`);

    const stats = {
      committeesFound: allCommittees.length,
      candidatesFunded: 0,
      executiveDonors: 0,
      totalPacSpending: 0,
      totalIndividualGiving: 0,
      linkagesCreated: 0,
      searchNamesUsed: namesToSearch.length,
    };

    // ─── Step 2: For each PAC, get disbursements to candidates ───
    const allCandidates: Array<{
      name: string; party: string; state: string;
      amount: number; type: string; district?: string;
    }> = [];
    const linkages: any[] = [];

    for (const committee of allCommittees.slice(0, 5)) {
      console.log(`[sync-openfec] Fetching disbursements for ${committee.name} (${committee.committee_id})...`);

      try {
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
                source: 'FEC',
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
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) {
        if (e.upstreamStatus === 422) {
          console.error(`[sync-openfec] FEC validation error for ${committee.committee_id}: ${e.upstreamBody}`);
        } else {
          console.error(`[sync-openfec] Error fetching disbursements for ${committee.committee_id}:`, e);
        }
      }
    }

    // ─── Step 3: Individual contributions by employer (using all name variants) ───
    for (const employerName of namesToSearch.slice(0, 3)) {
      try {
        console.log(`[sync-openfec] Fetching individual contributions where employer = "${employerName}"...`);
        const receiptData = await fecFetch('/schedules/schedule_a/', {
          contributor_employer: employerName,
          two_year_transaction_period: electionCycle,
          sort: '-contribution_receipt_amount',
          is_individual: 'true',
        }, apiKey);

        const receipts: FECReceipt[] = receiptData.results || [];
        console.log(`[sync-openfec] Found ${receipts.length} individual contributions from "${employerName}" employees`);

        const executiveMap = new Map<string, { name: string; total: number; occupation: string; recipients: any[] }>();

        for (const r of receipts) {
          if (r.contribution_receipt_amount <= 0) continue;
          const key = normalizeName(r.contributor_name);
          const displayName = r.contributor_name?.replace(/\b(MR|MRS|MS|DR|JR|SR)\b\.?\s*/gi, '').replace(/\s{2,}/g, ' ').trim() || 'Unknown';
          const existing = executiveMap.get(key) || {
            name: displayName,
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

        // Filter to C-suite / senior leadership titles only
        const CSUITE_PATTERNS = /\b(CEO|CFO|COO|CTO|CIO|CISO|CMO|CPO|CLO|CDO|CSO|CHRO|CAO|CRO|CCO|CHAIRMAN|CHAIRWOMAN|CHAIR|PRESIDENT|VICE\s*PRESIDENT|VP|SVP|EVP|MANAGING\s*DIRECTOR|GENERAL\s*COUNSEL|PARTNER|FOUNDER|CO-?FOUNDER|OWNER|DIRECTOR|CHIEF|HEAD|EXECUTIVE|BOARD\s*MEMBER|TREASURER|SECRETARY|GENERAL\s*MANAGER|PRINCIPAL)\b/i;

        const csuiteExecs = [...executiveMap.values()]
          .filter(e => CSUITE_PATTERNS.test(e.occupation))
          .sort((a, b) => b.total - a.total)
          .slice(0, 20);

        // Fallback: if no C-suite found, take top 5 by donation amount
        const topExecs = csuiteExecs.length > 0 ? csuiteExecs : [...executiveMap.values()]
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        stats.executiveDonors += topExecs.length;

        if (topExecs.length > 0) {
          const execRows = topExecs.map(e => ({
            company_id: companyId,
            name: e.name,
            title: e.occupation,
            total_donations: Math.round(e.total),
          }));

          // Only clear on first employer variant
          if (employerName === namesToSearch[0]) {
            await supabase.from('company_executives').delete().eq('company_id', companyId);
          }
          const { data: insertedExecs, error: execErr } = await supabase
            .from('company_executives')
            .insert(execRows)
            .select('id, name');
          if (execErr) console.error('[sync-openfec] Executive insert error:', execErr);

          if (insertedExecs && insertedExecs.length > 0) {
            const execNameToId = new Map(insertedExecs.map(e => [e.name?.toUpperCase(), e.id]));
            const recipientRows: { executive_id: string; name: string; party: string; amount: number }[] = [];

            // Collect all unique committee names for batch party lookup
            const allCommitteeNames = new Set<string>();
            for (const exec of topExecs) {
              for (const r of exec.recipients) {
                if (r.committee) allCommitteeNames.add(r.committee);
              }
            }

            // Resolve party from committee name using heuristics + FEC lookup
            const committeePartyCache = new Map<string, string>();

            // Returns 'R', 'D', or 'I' to match DB constraint
            // Uses comprehensive heuristics to avoid slow FEC lookups
            function inferPartyFromName(name: string): string {
              const upper = name.toUpperCase();
              // Republican keywords & known committees
              if (/\b(REPUBLICAN|GOP|RNC|NRCC|NRSC|WINRED|SAVE AMERICA|MAGA)\b/.test(upper)) return 'R';
              // Known Republican candidates/committees
              if (/\b(TRUMP|DESANTIS|BURGUM|TED CRUZ|CORNYN|MCCONNELL|RUBIO|SCOTT|THUNE|TUBERVILLE|BO HINES|PAUL HUDSON|HUIZENGA|MOOLENAAR|ROGERS|MARK GREEN)\b/.test(upper)) return 'R';
              // Republican structural patterns
              if (/\b(VICTORY (COMMITTEE|FUND)|FREEDOM FUND|LEADERSHIP FUND)\b/.test(upper) && !/\bDEMOCRAT/.test(upper)) {
                // Check if it's paired with a known R candidate
                if (/\b(TRUMP|DESANTIS|BURGUM|NRSC|NRCC|REPUBLICAN)\b/.test(upper)) return 'R';
              }
              // Democrat keywords & known committees  
              if (/\b(DEMOCRAT(IC)?|DNC|DCCC|DSCC|ACTBLUE|EMILY'?S LIST|BLUE WAVE)\b/.test(upper)) return 'D';
              // Known Democrat candidates/committees
              if (/\b(BIDEN|HARRIS|KLOBUCHAR|BALDWIN|ALLRED|CASTEN|JACKSON|WARNOCK|OSSOFF|SCHUMER|PELOSI|STABENOW)\b/.test(upper)) return 'D';
              // Try matching against allCandidates from PAC data
              const matchedCandidate = allCandidates.find(c =>
                upper.includes(c.name.split(',')[0]?.toUpperCase() || '___')
              );
              if (matchedCandidate) {
                if (matchedCandidate.party?.includes('REP')) return 'R';
                if (matchedCandidate.party?.includes('DEM')) return 'D';
              }
              return 'I'; // Default to Independent for unknown — satisfies DB constraint
            }

            for (const exec of topExecs) {
              const execId = execNameToId.get(exec.name?.toUpperCase());
              if (!execId || !exec.recipients.length) continue;

              const recipMap = new Map<string, { name: string; amount: number }>();
              for (const r of exec.recipients) {
                const key = (r.committee || 'Unknown').toUpperCase();
                const existing = recipMap.get(key) || { name: r.committee || 'Unknown', amount: 0 };
                existing.amount += r.amount;
                recipMap.set(key, existing);
              }

              for (const recip of recipMap.values()) {
                // Try cache first, then heuristics
                const cachedParty = committeePartyCache.get(recip.name.toUpperCase());
                const party = cachedParty || inferPartyFromName(recip.name);
                recipientRows.push({
                  executive_id: execId,
                  name: recip.name,
                  party,
                  amount: Math.round(recip.amount),
                });
              }
            }

            if (recipientRows.length > 0) {
              const execIds = insertedExecs.map(e => e.id);
              await supabase.from('executive_recipients').delete().in('executive_id', execIds);
              const { error: recipErr } = await supabase.from('executive_recipients').insert(recipientRows);
              if (recipErr) console.error('[sync-openfec] Executive recipients insert error:', recipErr);
              else console.log(`[sync-openfec] Inserted ${recipientRows.length} executive recipient records`);
            } else {
              console.warn('[sync-openfec] No executive recipient rows to insert');
            }

            // ─── Executive influence detection: check if execs appear in lobbying/govt ───
            for (const exec of insertedExecs) {
              // Create entity linkage for executive → company political activity
              linkages.push({
                company_id: companyId,
                source_entity_name: exec.name,
                source_entity_type: 'executive',
                source_entity_id: exec.id,
                target_entity_name: companyName,
                target_entity_type: 'company',
                target_entity_id: companyId,
                link_type: 'donation_to_member',
                amount: execRows.find(e => e.name === exec.name)?.total_donations || 0,
                confidence_score: 0.95,
                description: `Executive donor: ${exec.name} personal contributions (FEC individual receipts)`,
                source_citation: JSON.stringify([{
                  source: 'FEC',
                  url: `https://www.fec.gov/data/receipts/individual-contributions/?contributor_employer=${encodeURIComponent(employerName)}&contributor_name=${encodeURIComponent(exec.name || '')}`,
                  cycle: electionCycle,
                  retrieved_at: new Date().toISOString(),
                }]),
              });
            }
          }
        }
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) {
        if (e.upstreamStatus === 422) {
          console.error(`[sync-openfec] FEC validation error on individual contributions: ${e.upstreamBody}`);
        } else {
          console.error('[sync-openfec] Error fetching individual contributions:', e);
        }
      }
    }

    // ─── Step 4: Aggregate & deduplicate candidates ───
    const candidateMap = new Map<string, typeof allCandidates[0]>();
    for (const c of allCandidates) {
      const key = normalizeName(c.name);
      const existing = candidateMap.get(key);
      if (existing) { existing.amount += c.amount; }
      else { candidateMap.set(key, { ...c }); }
    }

    const deduped = [...candidateMap.values()].sort((a, b) => b.amount - a.amount);
    stats.candidatesFunded = deduped.length;

    if (deduped.length > 0) {
      const candidateRows = deduped.map(c => ({
        company_id: companyId,
        name: c.name.replace(/\b(MR|MRS|MS|DR|JR|SR)\b\.?\s*/gi, '').replace(/\s{2,}/g, ' ').trim(),
        party: c.party,
        state: c.state,
        amount: Math.round(c.amount),
        donation_type: c.type,
        district: c.district || null,
        flagged: false,
      }));

      await supabase.from('company_candidates').delete().eq('company_id', companyId);
      const { error: candErr } = await supabase.from('company_candidates').insert(candidateRows);
      if (candErr) console.error('[sync-openfec] Candidate insert error:', candErr);
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
      if (partyErr) console.error('[sync-openfec] Party breakdown insert error:', partyErr);
    }

    // ─── Step 6: Insert entity linkages ───
    if (linkages.length > 0) {
      await supabase
        .from('entity_linkages')
        .delete()
        .eq('company_id', companyId)
        .eq('link_type', 'donation_to_member')
        .like('description', 'PAC contribution:%');

      // Also clear old executive donor linkages
      await supabase
        .from('entity_linkages')
        .delete()
        .eq('company_id', companyId)
        .eq('link_type', 'donation_to_member')
        .like('description', 'Executive donor:%');

      for (let i = 0; i < linkages.length; i += 50) {
        const batch = linkages.slice(i, i + 50);
        const { error: linkErr } = await supabase.from('entity_linkages').insert(batch);
        if (linkErr) console.error(`[sync-openfec] Linkage insert error (batch ${i}):`, linkErr);
        else stats.linkagesCreated += batch.length;
      }
    }

    // ─── Step 7: Update company record ───
    const updateFields: Record<string, any> = {
      last_reviewed: new Date().toISOString().split('T')[0],
    };
    if (stats.totalPacSpending > 0) {
      updateFields.total_pac_spending = Math.round(stats.totalPacSpending);
      updateFields.corporate_pac_exists = true;
    }

    await supabase.from('companies').update(updateFields).eq('id', companyId);

    console.log(`[sync-openfec] ✅ Complete for ${companyName}: ${stats.candidatesFunded} candidates, ${stats.executiveDonors} exec donors, $${stats.totalPacSpending.toLocaleString()} PAC spending (searched ${stats.searchNamesUsed} name variants)`);

    return new Response(
      JSON.stringify({ success: true, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[sync-openfec] error:', error);
    const isUpstreamValidation = error.upstreamStatus === 422;
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        errorType: isUpstreamValidation ? 'failed_validation' : 'server_error',
        upstreamStatus: error.upstreamStatus || null,
        upstreamBody: error.upstreamBody || null,
      }),
      { status: isUpstreamValidation ? 422 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
