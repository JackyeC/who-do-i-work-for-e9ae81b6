const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// DOL enforcement data API
// NOTE: enforcedata.dol.gov was decommissioned Feb 23, 2026.
// New portal: apiprod.dol.gov — but OSHA/WHD data not yet migrated.
const DOL_LEGACY_BASE = 'https://enforcedata.dol.gov/api';
const DOL_NEW_BASE = 'https://apiprod.dol.gov/v4/get';

// Legacy endpoints (decommissioned)
const OSHA_LEGACY = `${DOL_LEGACY_BASE}/osha_inspection`;
const WHD_LEGACY = `${DOL_LEGACY_BASE}/whd_compliance`;

// New endpoints (OSHA data not yet migrated)
const OSHA_NEW = `${DOL_NEW_BASE}/OSHA/inspection/json`;
const WHD_NEW = `${DOL_NEW_BASE}/WHD/compliance/json`;

function normalizeCompanyName(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP)\.?$/i, '')
    .trim()
    .toUpperCase();
}

async function searchDOLEnforcement(
  legacyEndpoint: string,
  newEndpoint: string,
  companyName: string,
  searchNames: string[],
): Promise<{ results: any[]; dataGap: boolean }> {
  console.warn(`[sync-workplace-enforcement] WARNING: enforcedata.dol.gov API was decommissioned Feb 2026. Trying new + legacy endpoints.`);
  const allResults: any[] = [];
  const namesToSearch = [companyName, ...searchNames.slice(0, 2)].map(normalizeCompanyName);
  const uniqueNames = [...new Set(namesToSearch)];
  let dataGap = false;

  for (const name of uniqueNames) {
    const encoded = encodeURIComponent(name);
    let found = false;

    // Attempt 1: New DOL data portal
    try {
      const newUrl = `${newEndpoint}?trade_nm=${encoded}&page=0&size=20`;
      const newResp = await fetch(newUrl, { headers: { 'Accept': 'application/json' } });
      if (newResp.ok) {
        const ct = newResp.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await newResp.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[sync-workplace-enforcement] New DOL portal returned ${data.length} records for "${name}"`);
            allResults.push(...data);
            found = true;
          }
        }
      }
      if (!found) console.log(`[sync-workplace-enforcement] New DOL portal: ${newResp.status} for "${name}" — data not yet migrated`);
    } catch (err) {
      console.warn(`[sync-workplace-enforcement] New DOL portal error (expected):`, err instanceof Error ? err.message : err);
    }

    // Attempt 2: Legacy endpoint (decommissioned)
    if (!found) {
      try {
        const legacyUrl = `${legacyEndpoint}?trade_nm=${encoded}&page=0&size=20`;
        const resp = await fetch(legacyUrl, { headers: { 'Accept': 'application/json' } });
        if (resp.ok) {
          const ct = resp.headers.get('content-type') || '';
          if (ct.includes('json')) {
            const data = await resp.json();
            if (Array.isArray(data) && data.length > 0) {
              console.log(`[sync-workplace-enforcement] Legacy API unexpectedly returned ${data.length} records for "${name}"`);
              allResults.push(...data);
              found = true;
            }
          }
        }
        if (!found) {
          console.log(`[sync-workplace-enforcement] Legacy enforcedata.dol.gov: ${resp.status} / non-JSON for "${name}" — confirmed decommissioned`);
          await resp.text();
        }
      } catch (err) {
        console.warn(`[sync-workplace-enforcement] Legacy API error (expected — API is decommissioned):`, err instanceof Error ? err.message : err);
      }
    }

    if (!found) {
      dataGap = true;
      console.warn(`[sync-workplace-enforcement] No data source available for "${name}". DOL is migrating data to apiprod.dol.gov.`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }

  return { results: allResults, dataGap };
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
    const dataGaps: string[] = [];

    // 1. OSHA Inspections
    console.log('[sync-workplace-enforcement] Searching OSHA inspections...');
    const oshaResult = await searchDOLEnforcement(OSHA_LEGACY, OSHA_NEW, companyName, searchNames);
    sourcesScanned++;

    for (const record of oshaResult.results.slice(0, 20)) {
      allSignals.push(mapOSHAToSignal(record, companyId));
    }
    if (oshaResult.dataGap) dataGaps.push('OSHA data temporarily unavailable — DOL is migrating to a new portal');
    console.log(`[sync-workplace-enforcement] OSHA: ${oshaResult.results.length} records found${oshaResult.dataGap ? ' (DATA GAP)' : ''}`);

    // 2. Wage & Hour Division
    console.log('[sync-workplace-enforcement] Searching WHD compliance...');
    const whdResult = await searchDOLEnforcement(WHD_LEGACY, WHD_NEW, companyName, searchNames);
    sourcesScanned++;

    for (const record of whdResult.results.slice(0, 20)) {
      allSignals.push(mapWHDToSignal(record, companyId));
    }
    if (whdResult.dataGap) dataGaps.push('WHD wage & hour data temporarily unavailable — DOL is migrating to a new portal');
    console.log(`[sync-workplace-enforcement] WHD: ${whdResult.results.length} records found${whdResult.dataGap ? ' (DATA GAP)' : ''}`);

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

    const dataGapDetected = dataGaps.length > 0;
    console.log(`[sync-workplace-enforcement] COMPLETE: ${signalsFound} signals from ${sourcesScanned} sources${dataGapDetected ? ' [DATA GAPS DETECTED]' : ''}`);

    return new Response(JSON.stringify({
      success: true,
      sourcesScanned,
      signalsFound,
      oshaRecords: oshaResult.results.length,
      whdRecords: whdResult.results.length,
      data_gap_detected: dataGapDetected,
      data_gaps: dataGaps.length > 0 ? dataGaps : undefined,
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
