const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const USASPENDING_BASE = 'https://api.usaspending.gov/api/v2';
const CONTRACT_AWARD_TYPES = ['A', 'B', 'C', 'D']; // Definitive, Indefinite, etc.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, uei } = await req.json();

    if (!companyId || !companyName) {
      return new Response(
        JSON.stringify({ success: false, error: 'companyId and companyName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Syncing federal contracts for ${companyName}${uei ? ` (UEI: ${uei})` : ''}...`);

    // Build USASpending search filters
    const filters: Record<string, unknown> = {
      award_type_codes: CONTRACT_AWARD_TYPES,
      time_period: [
        { start_date: '2020-01-01', end_date: new Date().toISOString().split('T')[0] }
      ],
    };

    // Use UEI if provided, otherwise search by recipient name
    if (uei) {
      filters.recipient_search_text = [uei];
    } else {
      filters.recipient_search_text = [companyName];
    }

    const searchPayload = {
      filters,
      fields: [
        'Award_ID', 'Recipient_Name', 'Award_Amount', 'Total_Outlays',
        'Description', 'Start_Date', 'End_Date',
        'Awarding_Agency', 'Awarding_Sub_Agency', 'Award_Type',
        'generated_internal_id'
      ],
      page: 1,
      limit: 100,
      sort: 'Award_Amount',
      order: 'desc',
      subawards: false,
    };

    console.log('Calling USASpending API...');
    const resp = await fetch(`${USASPENDING_BASE}/search/spending_by_award/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('USASpending API error:', resp.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `USASpending API returned ${resp.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await resp.json();
    const results: AwardResult[] = data.results || [];
    console.log(`Found ${results.length} contract awards (page 1 of ${Math.ceil((data.page_metadata?.total || 0) / 100)})`);

    if (results.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No federal contracts found for ${companyName}`,
          contractsFound: 0,
          linkagesCreated: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map results to entity_linkages rows
    const linkages = results
      .filter(r => r.Award_Amount && r.Award_Amount > 0)
      .map(r => ({
        company_id: companyId,
        source_entity_name: r.Awarding_Agency || r.Awarding_Sub_Agency || 'Unknown Agency',
        source_entity_type: 'federal_agency',
        source_entity_id: null,
        target_entity_name: companyName,
        target_entity_type: 'company',
        target_entity_id: companyId,
        link_type: 'committee_oversight_of_contract' as const, // closest existing enum value for contract awards
        amount: Math.round(r.Award_Amount),
        confidence_score: 0.95, // direct from USASpending = high confidence
        description: `Federal contract: ${r.Description || r.Award_Type || 'N/A'} (Award ID: ${r.Award_ID || 'N/A'})`,
        source_citation: JSON.stringify([{
          source: 'USASpending.gov',
          url: r.generated_internal_id
            ? `https://www.usaspending.gov/award/${r.generated_internal_id}`
            : 'https://www.usaspending.gov',
          award_id: r.Award_ID,
          date_range: `${r.Start_Date || 'N/A'} to ${r.End_Date || 'N/A'}`,
          retrieved_at: new Date().toISOString(),
        }]),
        metadata: JSON.stringify({
          awarding_agency: r.Awarding_Agency,
          awarding_sub_agency: r.Awarding_Sub_Agency,
          total_outlays: r.Total_Outlays,
          award_type: r.Award_Type,
          start_date: r.Start_Date,
          end_date: r.End_Date,
        }),
      }));

    // Upsert: delete existing USASpending linkages for this company, then insert fresh
    const { error: deleteErr } = await supabase
      .from('entity_linkages')
      .delete()
      .eq('company_id', companyId)
      .eq('source_entity_type', 'federal_agency')
      .eq('link_type', 'committee_oversight_of_contract')
      .like('description', 'Federal contract:%');

    if (deleteErr) {
      console.error('Failed to clear old linkages:', deleteErr);
    }

    // Insert in batches of 50
    let inserted = 0;
    for (let i = 0; i < linkages.length; i += 50) {
      const batch = linkages.slice(i, i + 50);
      const { error: insertErr } = await supabase
        .from('entity_linkages')
        .insert(batch);

      if (insertErr) {
        console.error(`Insert batch error (${i}-${i + batch.length}):`, insertErr);
      } else {
        inserted += batch.length;
      }
    }

    // Also upsert into company_agency_contracts for the dedicated table
    const contractRows = results
      .filter(r => r.Award_Amount && r.Award_Amount > 0)
      .map(r => ({
        company_id: companyId,
        agency_name: r.Awarding_Agency || 'Unknown Agency',
        agency_acronym: r.Awarding_Sub_Agency || null,
        contract_value: Math.round(r.Award_Amount),
        contract_description: r.Description || r.Award_Type || null,
        contract_id_external: r.Award_ID || null,
        fiscal_year: r.Start_Date ? parseInt(r.Start_Date.substring(0, 4)) : null,
        confidence: 'direct',
        source: 'USASpending.gov',
        controversy_flag: false,
      }));

    // Clear old USASpending contracts
    await supabase
      .from('company_agency_contracts')
      .delete()
      .eq('company_id', companyId)
      .eq('source', 'USASpending.gov');

    let contractsInserted = 0;
    for (let i = 0; i < contractRows.length; i += 50) {
      const batch = contractRows.slice(i, i + 50);
      const { error: cErr } = await supabase
        .from('company_agency_contracts')
        .insert(batch);

      if (cErr) {
        console.error(`Contract insert error:`, cErr);
      } else {
        contractsInserted += batch.length;
      }
    }

    const totalContractValue = linkages.reduce((sum, l) => sum + (l.amount || 0), 0);

    console.log(`✅ Synced ${inserted} linkages + ${contractsInserted} contracts for ${companyName}. Total value: $${totalContractValue.toLocaleString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${inserted} contract linkages for ${companyName}`,
        contractsFound: results.length,
        linkagesCreated: inserted,
        contractsInserted,
        totalContractValue,
        totalAvailable: data.page_metadata?.total || results.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('sync-federal-contracts error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
