/**
 * Sync Labor Rights Signals
 * 
 * Unified edge function that pulls labor rights data from multiple
 * free government sources for a given company:
 * 
 * 1. DOL OSHA Inspections (enforcedata.dol.gov)
 * 2. DOL WHD Wage & Hour Violations (enforcedata.dol.gov)
 * 3. NLRB Cases — union elections & unfair labor practices (data.nlrb.gov)
 * 4. Existing WARN data (delegates to warn-national-sync)
 * 5. BLS Union Membership rates by industry (api.bls.gov)
 * 
 * Writes to: labor_rights_signals, workplace_enforcement_signals, issue_signals
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function normalizeCompanyName(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP)\.?$/i, '')
    .trim()
    .toUpperCase();
}

// ─── 1. DOL OSHA Inspections ───
// NOTE: enforcedata.dol.gov was decommissioned Feb 23, 2026. OSHA data has NOT
// been migrated to the new DOL data portal (apiprod.dol.gov) yet. We attempt
// both old and new endpoints; when both fail we return empty and flag the gap.
async function fetchOSHA(companyName: string): Promise<{ results: any[]; dataGap: boolean }> {
  console.warn('[OSHA] WARNING: enforcedata.dol.gov API was decommissioned Feb 2026. Using fallback strategy.');
  const names = [normalizeCompanyName(companyName)];
  const allResults: any[] = [];
  let dataGap = false;

  for (const name of names) {
    const encoded = encodeURIComponent(name);

    // Attempt 1: New DOL data portal (OSHA data not migrated yet, will likely 404)
    try {
      const newUrl = `https://apiprod.dol.gov/v4/get/OSHA/inspection/json?trade_nm=${encoded}&page=0&size=25`;
      const newResp = await fetch(newUrl, { headers: { 'Accept': 'application/json' } });
      if (newResp.ok) {
        const ct = newResp.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await newResp.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[OSHA] New DOL portal returned ${data.length} records for "${name}"`);
            allResults.push(...data);
            continue; // Success — skip legacy attempts
          }
        }
      }
      console.log(`[OSHA] New DOL portal returned ${newResp.status} for "${name}" — OSHA data not yet migrated`);
    } catch (e) {
      console.warn('[OSHA] New DOL portal error (expected):', e instanceof Error ? e.message : e);
    }

    // Attempt 2: Legacy enforcedata.dol.gov (decommissioned, will likely return HTML or 404)
    try {
      const legacyUrl = `https://enforcedata.dol.gov/api/osha_inspection?trade_nm=${encoded}&page=0&size=25`;
      const resp = await fetch(legacyUrl, { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[OSHA] Legacy API unexpectedly returned ${data.length} records for "${name}"`);
            allResults.push(...data);
            continue;
          }
        }
      }
      console.log(`[OSHA] Legacy enforcedata.dol.gov returned ${resp.status} / non-JSON for "${name}" — confirmed decommissioned`);
      await resp.text(); // consume body
    } catch (e) {
      console.warn('[OSHA] Legacy API error (expected — API is decommissioned):', e instanceof Error ? e.message : e);
    }

    // Both APIs failed — flag the data gap
    dataGap = true;
    console.warn(`[OSHA] No data source available for "${name}". DOL is migrating OSHA data to apiprod.dol.gov — check back periodically.`);
  }
  return { results: allResults, dataGap };
}

// ─── 2. DOL WHD Wage & Hour ───
// NOTE: Same decommission issue as OSHA — enforcedata.dol.gov is down.
async function fetchWHD(companyName: string): Promise<{ results: any[]; dataGap: boolean }> {
  console.warn('[WHD] WARNING: enforcedata.dol.gov API was decommissioned Feb 2026. Using fallback strategy.');
  const names = [normalizeCompanyName(companyName)];
  const allResults: any[] = [];
  let dataGap = false;

  for (const name of names) {
    const encoded = encodeURIComponent(name);

    // Attempt 1: New DOL data portal
    try {
      const newUrl = `https://apiprod.dol.gov/v4/get/WHD/compliance/json?trade_nm=${encoded}&page=0&size=25`;
      const newResp = await fetch(newUrl, { headers: { 'Accept': 'application/json' } });
      if (newResp.ok) {
        const ct = newResp.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await newResp.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[WHD] New DOL portal returned ${data.length} records for "${name}"`);
            allResults.push(...data);
            continue;
          }
        }
      }
      console.log(`[WHD] New DOL portal returned ${newResp.status} for "${name}" — WHD data may not be migrated yet`);
    } catch (e) {
      console.warn('[WHD] New DOL portal error (expected):', e instanceof Error ? e.message : e);
    }

    // Attempt 2: Legacy enforcedata.dol.gov
    try {
      const legacyUrl = `https://enforcedata.dol.gov/api/whd_compliance?trade_nm=${encoded}&page=0&size=25`;
      const resp = await fetch(legacyUrl, { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const ct = resp.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await resp.json();
          if (Array.isArray(data) && data.length > 0) {
            console.log(`[WHD] Legacy API unexpectedly returned ${data.length} records for "${name}"`);
            allResults.push(...data);
            continue;
          }
        }
      }
      console.log(`[WHD] Legacy enforcedata.dol.gov returned ${resp.status} / non-JSON for "${name}" — confirmed decommissioned`);
      await resp.text();
    } catch (e) {
      console.warn('[WHD] Legacy API error (expected — API is decommissioned):', e instanceof Error ? e.message : e);
    }

    // Both APIs failed — flag the data gap
    dataGap = true;
    console.warn(`[WHD] No data source available for "${name}". DOL is migrating WHD data to apiprod.dol.gov — check back periodically.`);
  }
  return { results: allResults, dataGap };
}

// ─── 3. NLRB Cases (Union Elections + ULP) ───
async function fetchNLRB(companyName: string): Promise<any[]> {
  const allResults: any[] = [];
  const searchName = normalizeCompanyName(companyName);

  // Try multiple NLRB endpoints — the data.nlrb.gov domain may be unreachable from edge runtime
  const endpoints = [
    // Primary: NLRB CATS Data
    `https://data.nlrb.gov/api/3.0/action/datastore_search?resource_id=election-results&q=${encodeURIComponent(searchName)}&limit=25`,
    `https://data.nlrb.gov/api/3.0/action/datastore_search?resource_id=complaints-issued&q=${encodeURIComponent(searchName)}&limit=25`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const resp = await fetch(url, { 
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        console.warn(`[NLRB] ${resp.status} for ${url}`);
        await resp.text();
        continue;
      }
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        await resp.text();
        continue;
      }
      const json = await resp.json();
      const records = json?.result?.records || json?.records || [];
      if (Array.isArray(records)) allResults.push(...records);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn('[NLRB] Error:', e);
    }
  }

  // Fallback: try Data.gov NLRB dataset
  if (allResults.length === 0) {
    try {
      const dgUrl = `https://catalog.data.gov/api/3/action/package_search?q=nlrb+${encodeURIComponent(searchName)}&rows=10`;
      const resp = await fetch(dgUrl);
      if (resp.ok) {
        const json = await resp.json();
        // Extract any downloadable resources
        console.log(`[NLRB] Data.gov fallback returned ${json?.result?.count || 0} packages`);
      }
    } catch (e) {
      console.warn('[NLRB] Data.gov fallback error:', e);
    }
  }

  return allResults;
}

// ─── 4. BLS Union Membership ───
async function fetchBLSUnionData(industryCode?: string): Promise<any> {
  // Series: LNU02073395 = union membership rate (all workers)
  // We also check industry-specific series if available
  const seriesIds = ['LNU02073395'];
  if (industryCode) {
    // Add industry-specific union membership series if known
    seriesIds.push(`CEU${industryCode}00000032`); // earnings series as proxy
  }

  try {
    const resp = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: seriesIds,
        startyear: String(new Date().getFullYear() - 2),
        endyear: String(new Date().getFullYear()),
      }),
    });

    if (!resp.ok) {
      console.warn(`[BLS] ${resp.status}`);
      return null;
    }

    const json = await resp.json();
    return json?.Results?.series || null;
  } catch (e) {
    console.warn('[BLS] Error:', e);
    return null;
  }
}

// ─── Map records to labor_rights_signals rows ───

function mapOSHAToLabor(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'labor_rights',
    signal_type: record.insp_type === 'F' ? 'fatality_investigation' :
                 record.insp_type === 'C' ? 'osha_complaint' :
                 'osha_inspection',
    case_number: record.activity_nr?.toString() || null,
    filing_date: record.open_date || null,
    resolution_date: record.close_case_date || null,
    resolution_type: record.case_status || null,
    employees_affected: null,
    location_state: record.site_state || null,
    description: [
      `OSHA ${record.insp_type === 'F' ? 'fatality' : record.insp_type === 'C' ? 'complaint' : 'inspection'}`,
      record.sic_description || '',
      record.total_current_penalty ? `Penalty: $${parseFloat(record.total_current_penalty).toLocaleString()}` : '',
      record.violation_type ? `Violation: ${record.violation_type}` : '',
    ].filter(Boolean).join('. '),
    source_name: 'DOL OSHA Enforcement',
    source_url: `https://www.osha.gov/pls/imis/establishment.inspection_detail?id=${record.activity_nr || ''}`,
    confidence: 'direct',
    evidence_text: record.estab_name || null,
  };
}

function mapWHDToLabor(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'labor_rights',
    signal_type: record.flsa_violtn_cnt > 0 ? 'wage_violation' :
                 record.flsa_bw_atp_amt > 0 ? 'back_wages' :
                 'whd_investigation',
    case_number: record.case_id?.toString() || null,
    filing_date: record.findings_start_date || null,
    resolution_date: record.findings_end_date || null,
    resolution_type: null,
    employees_affected: record.flsa_ee_atp_cnt || record.ee_violtd_cnt || null,
    location_state: record.st_cd || null,
    description: [
      record.trade_nm || '',
      record.flsa_bw_atp_amt ? `Back wages: $${parseFloat(record.flsa_bw_atp_amt).toLocaleString()}` : '',
      record.flsa_violtn_cnt ? `${record.flsa_violtn_cnt} FLSA violation(s)` : '',
      record.flsa_ee_atp_cnt ? `${record.flsa_ee_atp_cnt} employees affected` : '',
    ].filter(Boolean).join('. '),
    source_name: 'DOL Wage & Hour Division',
    source_url: 'https://enforcedata.dol.gov/views/data_summary.php',
    confidence: 'direct',
    evidence_text: `${record.trade_nm || ''} - ${record.street_addr_1_txt || ''}, ${record.cty_nm || ''}, ${record.st_cd || ''}`.trim(),
  };
}

function mapNLRBToLabor(record: any, companyId: string): any {
  const isElection = !!(record.tally_type || record.votes_for || record.election_date);
  return {
    company_id: companyId,
    signal_category: 'labor_rights',
    signal_type: isElection ? 'nlrb_election' : 'nlrb_ulp',
    case_number: record.case_number || record.case_name || null,
    filing_date: record.date_filed || record.date_closed || record.election_date || null,
    resolution_date: record.date_closed || record.closing_date || null,
    resolution_type: record.status || record.closing_method || null,
    union_name: record.labor_union || record.union_name || record.unit_name || null,
    employees_affected: record.num_eligible_voters || record.num_of_employees_in_unit || null,
    location_state: record.state || null,
    description: [
      isElection ? 'NLRB Union Election' : 'NLRB Unfair Labor Practice',
      record.case_name || '',
      record.labor_union || record.union_name || '',
      record.status || '',
    ].filter(Boolean).join('. '),
    source_name: 'NLRB CATS',
    source_url: record.case_number 
      ? `https://www.nlrb.gov/case/${record.case_number}` 
      : 'https://www.nlrb.gov/search/case',
    confidence: 'direct',
    evidence_text: JSON.stringify(record).slice(0, 500),
  };
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth gate: require service-role key
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') || '';
  if (token !== Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { companyId, companyName, searchNames = [] } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-labor-rights] START: ${companyName} (${companyId})`);

    const laborSignals: any[] = [];
    const stats = { osha: 0, whd: 0, nlrb: 0, bls: 0 };
    const dataGaps: string[] = [];

    // 1. OSHA
    console.log('[sync-labor-rights] Fetching OSHA data...');
    const oshaResult = await fetchOSHA(companyName);
    for (const r of oshaResult.results.slice(0, 25)) {
      laborSignals.push(mapOSHAToLabor(r, companyId));
    }
    stats.osha = oshaResult.results.length;
    if (oshaResult.dataGap) dataGaps.push('OSHA data temporarily unavailable — DOL is migrating to a new portal');
    console.log(`[sync-labor-rights] OSHA: ${oshaResult.results.length} records${oshaResult.dataGap ? ' (DATA GAP — DOL API decommissioned)' : ''}`);

    // 2. WHD
    console.log('[sync-labor-rights] Fetching WHD data...');
    const whdResult = await fetchWHD(companyName);
    for (const r of whdResult.results.slice(0, 25)) {
      laborSignals.push(mapWHDToLabor(r, companyId));
    }
    stats.whd = whdResult.results.length;
    if (whdResult.dataGap) dataGaps.push('WHD wage & hour data temporarily unavailable — DOL is migrating to a new portal');
    console.log(`[sync-labor-rights] WHD: ${whdResult.results.length} records${whdResult.dataGap ? ' (DATA GAP — DOL API decommissioned)' : ''}`);

    // 3. NLRB
    console.log('[sync-labor-rights] Fetching NLRB data...');
    const nlrbRecords = await fetchNLRB(companyName);
    for (const r of nlrbRecords.slice(0, 25)) {
      laborSignals.push(mapNLRBToLabor(r, companyId));
    }
    stats.nlrb = nlrbRecords.length;
    console.log(`[sync-labor-rights] NLRB: ${nlrbRecords.length} records`);

    // 4. BLS Union Membership (industry-level, not per-company)
    console.log('[sync-labor-rights] Fetching BLS union data...');
    const blsData = await fetchBLSUnionData();
    if (blsData && blsData.length > 0) {
      const series = blsData[0];
      const latestData = series.data?.[0];
      if (latestData) {
        const value = parseFloat(latestData.value);
        // LNU02073395 returns union members in thousands; LNU02034093 would be the rate
        const isRate = series.seriesID?.includes('034093');
        const desc = isRate 
          ? `National union membership rate: ${value}% (${latestData.year} ${latestData.periodName || ''})`
          : `National union members: ${(value / 1000).toFixed(1)}M workers (${latestData.year} ${latestData.periodName || ''})`;
        laborSignals.push({
          company_id: companyId,
          signal_category: 'labor_rights',
          signal_type: 'union_membership_rate',
          description: desc,
          source_name: 'BLS Current Population Survey',
          source_url: 'https://www.bls.gov/news.release/union2.nr0.htm',
          confidence: 'direct',
          evidence_text: `Series ${series.seriesID}: ${latestData.value}`,
        });
        stats.bls = 1;
      }
    }

    // 5. Also trigger existing workplace enforcement sync
    try {
      await supabase.functions.invoke('sync-workplace-enforcement', {
        body: { companyId, companyName, searchNames },
      });
      console.log('[sync-labor-rights] Triggered sync-workplace-enforcement');
    } catch (e) {
      console.warn('[sync-labor-rights] sync-workplace-enforcement failed:', e);
    }

    // Insert labor_rights_signals
    if (laborSignals.length > 0) {
      // Clear old data for this company
      await supabase
        .from('labor_rights_signals')
        .delete()
        .eq('company_id', companyId);

      const { error: insertErr } = await supabase
        .from('labor_rights_signals')
        .insert(laborSignals);

      if (insertErr) {
        console.error('[sync-labor-rights] Insert error:', insertErr);
      }
    }

    // Also write summary to issue_signals for the unified signal pipeline
    const issueSignals = laborSignals
      .filter(s => ['osha_inspection', 'osha_complaint', 'fatality_investigation', 'wage_violation', 'back_wages', 'nlrb_election', 'nlrb_ulp'].includes(s.signal_type))
      .slice(0, 10)
      .map(s => ({
        company_id: companyId,
        issue_category: 'labor_rights',
        signal_type: s.signal_type,
        title: s.description?.slice(0, 200) || s.signal_type,
        description: s.description,
        source_url: s.source_url,
        source_name: s.source_name,
        confidence: s.confidence,
        detected_at: new Date().toISOString(),
      }));

    if (issueSignals.length > 0) {
      // Don't clear old issue_signals — append
      const { error: issueErr } = await supabase
        .from('issue_signals')
        .insert(issueSignals);
      if (issueErr) console.warn('[sync-labor-rights] issue_signals insert error:', issueErr);
    }

    // Record scan (with data gap flag for UI)
    const dataGapDetected = dataGaps.length > 0;
    await supabase.from('company_signal_scans').insert({
      company_id: companyId,
      signal_category: 'labor_rights',
      signal_type: 'full_scan',
      confidence_level: dataGapDetected ? 'low' : 'high',
      signal_value: `OSHA:${stats.osha} WHD:${stats.whd} NLRB:${stats.nlrb} BLS:${stats.bls}${dataGapDetected ? ' [DATA GAP: DOL API decommissioned]' : ''}`,
      source_url: 'https://apiprod.dol.gov',
    }).then(({ error }) => {
      if (error) console.warn('[sync-labor-rights] scan record error:', error);
    });

    console.log(`[sync-labor-rights] COMPLETE: ${laborSignals.length} signals (OSHA:${stats.osha} WHD:${stats.whd} NLRB:${stats.nlrb} BLS:${stats.bls})${dataGapDetected ? ' [DATA GAPS DETECTED]' : ''}`);

    return new Response(JSON.stringify({
      success: true,
      totalSignals: laborSignals.length,
      stats,
      data_gap_detected: dataGapDetected,
      data_gaps: dataGaps.length > 0 ? dataGaps : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-labor-rights] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
