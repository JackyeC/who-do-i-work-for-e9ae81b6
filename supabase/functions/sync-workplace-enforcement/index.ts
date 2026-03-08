const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// DOL enforcement data API
const DOL_ENFORCEMENT_BASE = 'https://enforcedata.dol.gov/api';

// OSHA enforcement
const OSHA_BASE = 'https://enforcedata.dol.gov/api/osha_inspection';

// Wage & Hour (WHD) enforcement
const WHD_BASE = 'https://enforcedata.dol.gov/api/whd_compliance';

function normalizeCompanyName(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP)\.?$/i, '')
    .trim()
    .toUpperCase();
}

async function searchDOLEnforcement(endpoint: string, companyName: string, searchNames: string[]): Promise<any[]> {
  const allResults: any[] = [];
  const namesToSearch = [companyName, ...searchNames.slice(0, 2)].map(normalizeCompanyName);
  const uniqueNames = [...new Set(namesToSearch)];

  for (const name of uniqueNames) {
    try {
      const encoded = encodeURIComponent(name);
      const url = `${endpoint}?trade_nm=${encoded}&page=0&size=20`;

      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!resp.ok) {
        console.warn(`[sync-workplace-enforcement] ${endpoint} returned ${resp.status} for "${name}"`);
        continue;
      }

      const data = await resp.json();
      if (Array.isArray(data)) {
        allResults.push(...data);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`[sync-workplace-enforcement] Error fetching ${endpoint}:`, err);
    }
  }

  return allResults;
}

function mapOSHAToSignal(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'workplace_safety',
    signal_type: record.insp_type === 'F' ? 'fatality_investigation' :
                 record.insp_type === 'C' ? 'complaint_investigation' :
                 record.insp_type === 'R' ? 'referral_investigation' :
                 'osha_inspection',
    agency_name: 'OSHA',
    case_number: record.activity_nr?.toString() || null,
    enforcement_date: record.open_date || null,
    resolution_type: record.case_status || null,
    penalty_amount: record.total_current_penalty ? Math.round(parseFloat(record.total_current_penalty)) : null,
    employees_affected: null,
    description: [
      record.sic_description || '',
      record.violation_type ? `Violation type: ${record.violation_type}` : '',
      record.nr_in_state ? `Inspection in ${record.site_state}` : '',
    ].filter(Boolean).join('. ') || 'OSHA inspection record',
    source_name: 'DOL OSHA Enforcement',
    source_url: `https://www.osha.gov/pls/imis/establishment.inspection_detail?id=${record.activity_nr || ''}`,
    confidence: 'direct',
    evidence_text: record.estab_name || null,
    detection_method: 'government_filing',
    detected_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
  };
}

function mapWHDToSignal(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'wage_hour_enforcement',
    signal_type: record.flsa_violtn_cnt > 0 ? 'flsa_violation' :
                 record.flsa_bw_atp_amt > 0 ? 'back_wages_owed' :
                 'whd_investigation',
    agency_name: 'DOL Wage & Hour Division',
    case_number: record.case_id?.toString() || null,
    enforcement_date: record.findings_start_date || null,
    resolution_type: null,
    penalty_amount: record.flsa_cmp_assd_amt ? Math.round(parseFloat(record.flsa_cmp_assd_amt)) : null,
    employees_affected: record.flsa_ee_atp_cnt || record.ee_violtd_cnt || null,
    description: [
      record.trade_nm || '',
      record.flsa_bw_atp_amt ? `Back wages: $${parseFloat(record.flsa_bw_atp_amt).toLocaleString()}` : '',
      record.flsa_violtn_cnt ? `${record.flsa_violtn_cnt} FLSA violation(s)` : '',
      record.flsa_ee_atp_cnt ? `${record.flsa_ee_atp_cnt} employees affected` : '',
    ].filter(Boolean).join('. ') || 'WHD investigation record',
    source_name: 'DOL Wage & Hour Division',
    source_url: 'https://enforcedata.dol.gov/views/data_summary.php',
    confidence: 'direct',
    evidence_text: `${record.trade_nm || ''} - ${record.street_addr_1_txt || ''}, ${record.cty_nm || ''}, ${record.st_cd || ''}`.trim(),
    detection_method: 'government_filing',
    detected_at: new Date().toISOString(),
    last_verified_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId, companyName, searchNames = [] } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-workplace-enforcement] START: ${companyName} (${companyId})`);

    let sourcesScanned = 0;
    let signalsFound = 0;
    const allSignals: any[] = [];

    // 1. OSHA Inspections
    console.log('[sync-workplace-enforcement] Searching OSHA inspections...');
    const oshaResults = await searchDOLEnforcement(OSHA_BASE, companyName, searchNames);
    sourcesScanned++;

    for (const record of oshaResults.slice(0, 20)) {
      allSignals.push(mapOSHAToSignal(record, companyId));
    }
    console.log(`[sync-workplace-enforcement] OSHA: ${oshaResults.length} records found`);

    // 2. Wage & Hour Division
    console.log('[sync-workplace-enforcement] Searching WHD compliance...');
    const whdResults = await searchDOLEnforcement(WHD_BASE, companyName, searchNames);
    sourcesScanned++;

    for (const record of whdResults.slice(0, 20)) {
      allSignals.push(mapWHDToSignal(record, companyId));
    }
    console.log(`[sync-workplace-enforcement] WHD: ${whdResults.length} records found`);

    // Insert signals
    if (allSignals.length > 0) {
      // Clear old signals from these sources
      await supabase
        .from('workplace_enforcement_signals')
        .delete()
        .eq('company_id', companyId)
        .in('agency_name', ['OSHA', 'DOL Wage & Hour Division']);

      const { error: insertErr } = await supabase
        .from('workplace_enforcement_signals')
        .insert(allSignals);

      if (insertErr) {
        console.error('[sync-workplace-enforcement] Insert error:', insertErr);
      } else {
        signalsFound = allSignals.length;
      }
    }

    console.log(`[sync-workplace-enforcement] COMPLETE: ${signalsFound} signals from ${sourcesScanned} sources`);

    return new Response(JSON.stringify({
      success: true,
      sourcesScanned,
      signalsFound,
      oshaRecords: oshaResults.length,
      whdRecords: whdResults.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-workplace-enforcement] Unhandled error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'exception',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
