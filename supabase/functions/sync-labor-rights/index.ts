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
async function fetchOSHA(companyName: string): Promise<any[]> {
  const names = [normalizeCompanyName(companyName)];
  const allResults: any[] = [];

  for (const name of names) {
    try {
      const encoded = encodeURIComponent(name);
      // Use the DOL data API v2 with JSON response
      const url = `https://enforcedata.dol.gov/api/osha_inspection?trade_nm=${encoded}&page=0&size=25`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) { console.warn(`[OSHA] ${resp.status} for "${name}"`); await resp.text(); continue; }
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        console.warn(`[OSHA] Got non-JSON response (${contentType}) for "${name}" — API may have changed`);
        await resp.text(); // consume body
        // Fallback: try DOL v2 enforcement search
        try {
          const fallbackUrl = `https://enforcedata.dol.gov/api/search?query=${encoded}&agency=osha&size=20`;
          const fallbackResp = await fetch(fallbackUrl, { headers: { 'Accept': 'application/json' } });
          const fallbackCt = fallbackResp.headers.get('content-type') || '';
          if (fallbackResp.ok && fallbackCt.includes('json')) {
            const fallbackData = await fallbackResp.json();
            const hits = fallbackData?.hits?.hits || [];
            for (const hit of hits) {
              const src = hit._source || {};
              allResults.push({
                activity_nr: src.activity_nr,
                estab_name: src.establishment_name || name,
                site_state: src.site_state,
                open_date: src.open_date,
                close_case_date: src.close_date,
                total_current_penalty: src.total_penalty ? parseFloat(src.total_penalty) : 0,
                viol_type_desc: src.violation_type || 'Serious',
                total_violations: src.total_violations || 1,
              });
            }
          } else {
            await fallbackResp.text();
          }
        } catch (fallbackErr) {
          console.warn('[OSHA fallback] Error:', fallbackErr);
        }
        continue;
      }
      const data = await resp.json();
      if (Array.isArray(data)) allResults.push(...data);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn('[OSHA] Error:', e);
    }
  }
  return allResults;
}

// ─── 2. DOL WHD Wage & Hour ───
async function fetchWHD(companyName: string): Promise<any[]> {
  const names = [normalizeCompanyName(companyName)];
  const allResults: any[] = [];

  for (const name of names) {
    try {
      const encoded = encodeURIComponent(name);
      const url = `https://enforcedata.dol.gov/api/whd_compliance?trade_nm=${encoded}&page=0&size=25`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!resp.ok) { console.warn(`[WHD] ${resp.status} for "${name}"`); await resp.text(); continue; }
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        console.warn(`[WHD] Got non-JSON response (${contentType}) for "${name}" — API may have changed`);
        await resp.text();
        // Fallback: DOL enforcement search for WHD
        try {
          const fallbackUrl = `https://enforcedata.dol.gov/api/search?query=${encoded}&agency=whd&size=20`;
          const fallbackResp = await fetch(fallbackUrl, { headers: { 'Accept': 'application/json' } });
          const fallbackCt = fallbackResp.headers.get('content-type') || '';
          if (fallbackResp.ok && fallbackCt.includes('json')) {
            const fallbackData = await fallbackResp.json();
            const hits = fallbackData?.hits?.hits || [];
            for (const hit of hits) {
              const src = hit._source || {};
              allResults.push({
                trade_nm: src.establishment_name || name,
                st_cd: src.site_state,
                findings_start_date: src.open_date,
                findings_end_date: src.close_date,
                bw_amt: src.back_wages ? parseFloat(src.back_wages) : 0,
                flsa_mw_bw_amt: 0,
                flsa_ot_bw_amt: 0,
                ee_violtd_cnt: src.employees_affected || 0,
              });
            }
          } else {
            await fallbackResp.text();
          }
        } catch (fallbackErr) {
          console.warn('[WHD fallback] Error:', fallbackErr);
        }
        continue;
      }
      const data = await resp.json();
      if (Array.isArray(data)) allResults.push(...data);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn('[WHD] Error:', e);
    }
  }
  return allResults;
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

    // 1. OSHA
    console.log('[sync-labor-rights] Fetching OSHA data...');
    const oshaRecords = await fetchOSHA(companyName);
    for (const r of oshaRecords.slice(0, 25)) {
      laborSignals.push(mapOSHAToLabor(r, companyId));
    }
    stats.osha = oshaRecords.length;
    console.log(`[sync-labor-rights] OSHA: ${oshaRecords.length} records`);

    // 2. WHD
    console.log('[sync-labor-rights] Fetching WHD data...');
    const whdRecords = await fetchWHD(companyName);
    for (const r of whdRecords.slice(0, 25)) {
      laborSignals.push(mapWHDToLabor(r, companyId));
    }
    stats.whd = whdRecords.length;
    console.log(`[sync-labor-rights] WHD: ${whdRecords.length} records`);

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

    // Record scan
    await supabase.from('company_signal_scans').insert({
      company_id: companyId,
      signal_category: 'labor_rights',
      signal_type: 'full_scan',
      confidence_level: 'high',
      signal_value: `OSHA:${stats.osha} WHD:${stats.whd} NLRB:${stats.nlrb} BLS:${stats.bls}`,
      source_url: 'https://enforcedata.dol.gov',
    }).then(({ error }) => {
      if (error) console.warn('[sync-labor-rights] scan record error:', error);
    });

    console.log(`[sync-labor-rights] COMPLETE: ${laborSignals.length} signals (OSHA:${stats.osha} WHD:${stats.whd} NLRB:${stats.nlrb} BLS:${stats.bls})`);

    return new Response(JSON.stringify({
      success: true,
      totalSignals: laborSignals.length,
      stats,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-labor-rights] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
