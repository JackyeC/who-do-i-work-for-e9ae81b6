const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const USASPENDING_BASE = 'https://api.usaspending.gov/api/v2';
const CONTRACT_AWARD_TYPES = ['A', 'B', 'C', 'D'];
const GRANT_AWARD_TYPES = ['02', '03', '04', '05']; // Grants & financial assistance

interface AwardResult {
  Award_ID: string;
  Recipient_Name: string;
  Award_Amount: number;
  Total_Outlays: number;
  Description: string;
  Start_Date: string;
  End_Date: string;
  Awarding_Agency: string;
  Awarding_Sub_Agency: string;
  Award_Type: string;
  generated_internal_id: string;
}

function validateUSASpendingPayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload.filters) { errors.push('Missing required "filters" object'); return { valid: false, errors }; }
  const f = payload.filters;
  if (!Array.isArray(f.award_type_codes) || f.award_type_codes.length === 0) errors.push('filters.award_type_codes must be a non-empty array');
  if (!Array.isArray(f.time_period) || f.time_period.length === 0) {
    errors.push('filters.time_period must be a non-empty array');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const tp of f.time_period) {
      if (!tp.start_date || !tp.end_date) errors.push('time_period entries must have start_date and end_date');
      if (tp.start_date && !dateRegex.test(tp.start_date)) errors.push(`Invalid start_date format: "${tp.start_date}"`);
      if (tp.end_date && !dateRegex.test(tp.end_date)) errors.push(`Invalid end_date format: "${tp.end_date}"`);
    }
  }
  if (f.recipient_search_text) {
    if (!Array.isArray(f.recipient_search_text) || f.recipient_search_text.length === 0) errors.push('filters.recipient_search_text must be a non-empty array');
    else if (f.recipient_search_text.some((s: any) => typeof s !== 'string' || !s.trim())) errors.push('filters.recipient_search_text entries must be non-empty strings');
  }
  return { valid: errors.length === 0, errors };
}

async function searchUSASpending(searchText: string, awardTypes: string[]): Promise<{ results: any[]; total: number }> {
  const endDate = new Date().toISOString().split('T')[0];
  const searchPayload = {
    filters: {
      award_type_codes: awardTypes,
      time_period: [{ start_date: '2018-01-01', end_date: endDate }],
      recipient_search_text: [searchText.trim()],
    },
    fields: [
      'Award ID', 'Recipient Name', 'Award Amount', 'Total Outlays',
      'Description', 'Start Date', 'End Date',
      'Awarding Agency', 'Awarding Sub Agency', 'Award Type',
      'generated_internal_id'
    ],
    page: 1,
    limit: 100,
    sort: 'Award Amount',
    order: 'desc',
    subawards: false,
  };

  const validation = validateUSASpendingPayload(searchPayload);
  if (!validation.valid) {
    console.error(`[sync-federal-contracts] Validation failed: ${validation.errors.join('; ')}`);
    return { results: [], total: 0 };
  }

  const resp = await fetch(`${USASPENDING_BASE}/search/spending_by_award/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(searchPayload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[sync-federal-contracts] USASpending API error ${resp.status}: ${errText.substring(0, 300)}`);
    throw new Error(`USASpending API returned ${resp.status}`);
  }

  const data = await resp.json();
  return { results: data.results || [], total: data.page_metadata?.total || 0 };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, uei, searchNames, entityMap } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[sync-federal-contracts] Syncing for ${companyName}${uei ? ` (UEI: ${uei})` : ''}...`);

    // Use entity resolution: search with all resolved names
    const namesToSearch = searchNames?.length
      ? searchNames.filter((n: string) => {
          const type = entityMap?.[n];
          return !type || !['ticker', 'legal_variant'].includes(type);
        }).slice(0, 4)
      : [uei || companyName];

    let allResults: any[] = [];
    let totalAvailable = 0;
    let sourcesScanned = 0;

    // Search contracts for each name variant
    for (const searchText of namesToSearch) {
      if (!searchText?.trim()) continue;
      try {
        // Search contracts
        const contractData = await searchUSASpending(searchText, CONTRACT_AWARD_TYPES);
        allResults = [...allResults, ...contractData.results];
        totalAvailable += contractData.total;
        sourcesScanned++;
        console.log(`[sync-federal-contracts] Contracts for "${searchText}": ${contractData.results.length} results`);

        // Search grants/financial assistance
        const grantData = await searchUSASpending(searchText, GRANT_AWARD_TYPES);
        allResults = [...allResults, ...grantData.results];
        totalAvailable += grantData.total;
        sourcesScanned++;
        console.log(`[sync-federal-contracts] Grants for "${searchText}": ${grantData.results.length} results`);

        await new Promise(r => setTimeout(r, 300));
        if (allResults.length >= 100) break;
      } catch (e) {
        console.error(`[sync-federal-contracts] Error searching "${searchText}":`, e);
      }
    }

    // Deduplicate by Award ID
    const seenAwards = new Set<string>();
    const uniqueResults = allResults.filter(r => {
      const id = (r['Award ID'] ?? r.Award_ID ?? '') as string;
      if (!id || seenAwards.has(id)) return false;
      seenAwards.add(id);
      return true;
    });

    console.log(`[sync-federal-contracts] Found ${uniqueResults.length} unique awards (${totalAvailable} total available)`);

    if (uniqueResults.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No federal contracts/grants found for ${companyName}`,
          contractsFound: 0,
          linkagesCreated: 0,
          sourcesScanned,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map results to entity_linkages + contract rows
    const linkages = uniqueResults
      .filter(r => {
        const amount = r['Award Amount'] ?? r.Award_Amount;
        return amount && Number(amount) > 0;
      })
      .map(r => {
        const awardAmount = Number(r['Award Amount'] ?? r.Award_Amount ?? 0);
        const awardId = (r['Award ID'] ?? r.Award_ID ?? 'N/A') as string;
        const recipientName = (r['Recipient Name'] ?? r.Recipient_Name ?? companyName) as string;
        const description = (r['Description'] ?? r.Description ?? 'N/A') as string;
        const startDate = (r['Start Date'] ?? r.Start_Date ?? null) as string | null;
        const endDate = (r['End Date'] ?? r.End_Date ?? null) as string | null;
        const awardingAgency = (r['Awarding Agency'] ?? r.Awarding_Agency ?? 'Unknown Agency') as string;
        const awardingSubAgency = (r['Awarding Sub Agency'] ?? r.Awarding_Sub_Agency ?? null) as string | null;
        const awardType = (r['Award Type'] ?? r.Award_Type ?? null) as string | null;
        const totalOutlays = Number(r['Total Outlays'] ?? r.Total_Outlays ?? 0);
        const genId = r.generated_internal_id || null;

        const isGrant = GRANT_AWARD_TYPES.includes(awardType || '');

        return {
          company_id: companyId,
          source_entity_name: awardingAgency,
          source_entity_type: 'federal_agency',
          source_entity_id: null,
          target_entity_name: companyName,
          target_entity_type: 'company',
          target_entity_id: companyId,
          link_type: 'committee_oversight_of_contract' as const,
          amount: Math.round(awardAmount),
          confidence_score: 0.95,
          description: `${isGrant ? 'Federal grant' : 'Federal contract'}: ${description} (Award ID: ${awardId})`,
          source_citation: JSON.stringify([{
            source: 'USASpending.gov',
            url: genId ? `https://www.usaspending.gov/award/${genId}` : 'https://www.usaspending.gov',
            award_id: awardId,
            date_range: `${startDate || 'N/A'} to ${endDate || 'N/A'}`,
            retrieved_at: new Date().toISOString(),
          }]),
          metadata: JSON.stringify({
            awarding_agency: awardingAgency,
            awarding_sub_agency: awardingSubAgency,
            total_outlays: totalOutlays,
            award_type: awardType,
            is_grant: isGrant,
            start_date: startDate,
            end_date: endDate,
          }),
          _contract_row: {
            company_id: companyId,
            agency_name: awardingAgency,
            agency_acronym: awardingSubAgency,
            contract_value: Math.round(awardAmount),
            contract_description: description || awardType || null,
            contract_id_external: awardId !== 'N/A' ? awardId : null,
            fiscal_year: startDate ? parseInt(startDate.substring(0, 4)) : null,
            confidence: 'direct',
            source: 'USASpending.gov',
            controversy_flag: false,
          },
        };
      });

    // Clear old USASpending linkages
    await supabase
      .from('entity_linkages')
      .delete()
      .eq('company_id', companyId)
      .eq('source_entity_type', 'federal_agency')
      .eq('link_type', 'committee_oversight_of_contract');

    // Insert linkages in batches
    let inserted = 0;
    const contractRows: any[] = [];
    
    for (let i = 0; i < linkages.length; i += 50) {
      const batch = linkages.slice(i, i + 50);
      const linkageBatch = batch.map(({ _contract_row, ...linkage }) => linkage);
      contractRows.push(...batch.map(b => b._contract_row));
      
      const { error: insertErr } = await supabase.from('entity_linkages').insert(linkageBatch);
      if (insertErr) {
        console.error(`[sync-federal-contracts] Insert batch error:`, insertErr);
      } else {
        inserted += batch.length;
      }
    }

    // Upsert into company_agency_contracts
    await supabase.from('company_agency_contracts').delete().eq('company_id', companyId).eq('source', 'USASpending.gov');

    let contractsInserted = 0;
    for (let i = 0; i < contractRows.length; i += 50) {
      const batch = contractRows.slice(i, i + 50);
      const { error: cErr } = await supabase.from('company_agency_contracts').insert(batch);
      if (cErr) console.error(`[sync-federal-contracts] Contract insert error:`, cErr);
      else contractsInserted += batch.length;
    }

    // Update company government_contracts total
    const totalContractValue = linkages.reduce((sum, l) => sum + (l.amount || 0), 0);
    if (totalContractValue > 0) {
      await supabase.from('companies').update({
        government_contracts: Math.round(totalContractValue),
      }).eq('id', companyId);
    }

    console.log(`[sync-federal-contracts] ✅ Synced ${inserted} linkages + ${contractsInserted} contracts. Total: $${totalContractValue.toLocaleString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        contractsFound: uniqueResults.length,
        linkagesCreated: inserted,
        contractsInserted,
        totalContractValue,
        totalAvailable,
        sourcesScanned,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-federal-contracts] error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'server_error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
