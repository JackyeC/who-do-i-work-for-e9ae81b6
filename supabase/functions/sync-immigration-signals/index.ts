/**
 * Sync Immigration Signals
 * 
 * Pulls immigration-related data from free government sources:
 * 1. DOL Foreign Labor H-1B Disclosure Data (enforcedata.dol.gov)
 * 2. DOL H-2A/H-2B Guest Worker Programs
 * 3. ICE/DOJ enforcement (structured search)
 * 
 * Writes to: immigration_signals, issue_signals
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

// ─── 1. DOL H-1B Disclosure Data ───
async function fetchH1BData(companyName: string): Promise<any[]> {
  const searchName = normalizeCompanyName(companyName);
  const allResults: any[] = [];

  try {
    // DOL Foreign Labor Certification disclosure data
    const encoded = encodeURIComponent(searchName);
    const url = `https://enforcedata.dol.gov/api/h1b_disclosure?employer_name=${encoded}&page=0&size=50`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) allResults.push(...data);
    } else {
      console.warn(`[H-1B] ${resp.status} for "${searchName}"`);
    }
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.warn('[H-1B] Error:', e);
  }

  // Fallback: try LCA disclosure endpoint
  if (allResults.length === 0) {
    try {
      const encoded = encodeURIComponent(searchName);
      const url = `https://enforcedata.dol.gov/api/lca_disclosure?employer_name=${encoded}&page=0&size=50`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) allResults.push(...data);
      }
    } catch (e) {
      console.warn('[LCA fallback] Error:', e);
    }
  }

  return allResults;
}

// ─── 2. DOL H-2A / H-2B Guest Worker Data ───
async function fetchGuestWorkerData(companyName: string): Promise<any[]> {
  const searchName = normalizeCompanyName(companyName);
  const allResults: any[] = [];

  for (const visaType of ['h2a', 'h2b']) {
    try {
      const encoded = encodeURIComponent(searchName);
      const url = `https://enforcedata.dol.gov/api/${visaType}_disclosure?employer_name=${encoded}&page=0&size=25`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) {
          allResults.push(...data.map((r: any) => ({ ...r, _visa_type: visaType.toUpperCase() })));
        }
      } else {
        console.warn(`[${visaType.toUpperCase()}] ${resp.status} for "${searchName}"`);
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn(`[${visaType.toUpperCase()}] Error:`, e);
    }
  }

  return allResults;
}

// ─── 3. DOL WHD Immigration-Related Violations (I-9, MSPA) ───
async function fetchImmigrationEnforcement(companyName: string): Promise<any[]> {
  const searchName = normalizeCompanyName(companyName);
  const allResults: any[] = [];

  try {
    // WHD compliance with immigration-related violations (MSPA = Migrant worker protection)
    const encoded = encodeURIComponent(searchName);
    const url = `https://enforcedata.dol.gov/api/whd_compliance?trade_nm=${encoded}&page=0&size=25`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) {
        // Filter for immigration-related: MSPA violations or H-2 related
        const immigrationRelated = data.filter((r: any) =>
          r.mspa_violtn_cnt > 0 ||
          r.h2a_violtn_cnt > 0 ||
          r.h2b_violtn_cnt > 0 ||
          (r.case_type && /mspa|h-2|h2|migrant|immigrant/i.test(r.case_type))
        );
        allResults.push(...immigrationRelated);
      }
    }
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.warn('[Immigration Enforcement] Error:', e);
  }

  return allResults;
}

// ─── Map records to immigration_signals rows ───

function mapH1BToSignal(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'immigration',
    signal_type: 'h1b_sponsorship',
    case_number: record.case_number || record.case_no || null,
    filing_date: record.received_date || record.decision_date || null,
    visa_type: 'H-1B',
    job_title: record.job_title || record.soc_title || null,
    wage_offered: record.wage_rate_of_pay_from ? parseFloat(record.wage_rate_of_pay_from) : null,
    workers_affected: record.total_workers ? parseInt(record.total_workers) : 1,
    location_state: record.worksite_state || record.employer_state || null,
    description: [
      `H-1B LCA: ${record.job_title || record.soc_title || 'Position'}`,
      record.employer_name || '',
      record.wage_rate_of_pay_from ? `Wage: $${parseFloat(record.wage_rate_of_pay_from).toLocaleString()}` : '',
      record.case_status || '',
    ].filter(Boolean).join('. '),
    source_name: 'DOL Foreign Labor Certification',
    source_url: 'https://www.dol.gov/agencies/eta/foreign-labor/performance',
    confidence: 'direct',
    evidence_text: `${record.employer_name || ''} - ${record.worksite_city || ''}, ${record.worksite_state || ''}`,
  };
}

function mapGuestWorkerToSignal(record: any, companyId: string): any {
  const visaType = record._visa_type || 'H-2';
  return {
    company_id: companyId,
    signal_category: 'immigration',
    signal_type: visaType === 'H2A' ? 'h2a_sponsorship' : 'h2b_sponsorship',
    case_number: record.case_number || record.case_no || null,
    filing_date: record.received_date || record.decision_date || null,
    visa_type: visaType === 'H2A' ? 'H-2A' : 'H-2B',
    job_title: record.job_title || record.soc_title || null,
    wage_offered: record.basic_rate_of_pay ? parseFloat(record.basic_rate_of_pay) : null,
    workers_affected: record.nbr_workers_requested ? parseInt(record.nbr_workers_requested) : null,
    location_state: record.worksite_state || record.employer_state || null,
    description: [
      `${visaType} Guest Worker: ${record.job_title || 'Position'}`,
      record.employer_name || '',
      record.nbr_workers_requested ? `${record.nbr_workers_requested} workers requested` : '',
      record.case_status || '',
    ].filter(Boolean).join('. '),
    source_name: 'DOL Foreign Labor Certification',
    source_url: 'https://www.dol.gov/agencies/eta/foreign-labor/performance',
    confidence: 'direct',
    evidence_text: `${record.employer_name || ''} - ${record.worksite_city || ''}, ${record.worksite_state || ''}`,
  };
}

function mapEnforcementToSignal(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'immigration',
    signal_type: record.mspa_violtn_cnt > 0 ? 'mspa_violation' : 'immigration_enforcement',
    case_number: record.case_id?.toString() || null,
    filing_date: record.findings_start_date || null,
    resolution_date: record.findings_end_date || null,
    workers_affected: record.ee_violtd_cnt || null,
    location_state: record.st_cd || null,
    description: [
      record.mspa_violtn_cnt > 0 ? `MSPA (Migrant worker) violation` : 'Immigration-related enforcement',
      record.trade_nm || '',
      record.mspa_bw_atp_amt ? `Back wages: $${parseFloat(record.mspa_bw_atp_amt).toLocaleString()}` : '',
      record.mspa_violtn_cnt ? `${record.mspa_violtn_cnt} MSPA violation(s)` : '',
    ].filter(Boolean).join('. '),
    source_name: 'DOL Wage & Hour Division',
    source_url: 'https://enforcedata.dol.gov/views/data_summary.php',
    confidence: 'direct',
    evidence_text: `${record.trade_nm || ''} - ${record.cty_nm || ''}, ${record.st_cd || ''}`,
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
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ success: false, error: 'companyId and companyName required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync-immigration] START: ${companyName} (${companyId})`);

    const signals: any[] = [];
    const stats = { h1b: 0, guestWorker: 0, enforcement: 0 };

    // 1. H-1B Data
    console.log('[sync-immigration] Fetching H-1B disclosure data...');
    const h1bRecords = await fetchH1BData(companyName);
    for (const r of h1bRecords.slice(0, 50)) {
      signals.push(mapH1BToSignal(r, companyId));
    }
    stats.h1b = h1bRecords.length;
    console.log(`[sync-immigration] H-1B: ${h1bRecords.length} records`);

    // 2. Guest Worker (H-2A/H-2B)
    console.log('[sync-immigration] Fetching H-2A/H-2B data...');
    const guestRecords = await fetchGuestWorkerData(companyName);
    for (const r of guestRecords.slice(0, 25)) {
      signals.push(mapGuestWorkerToSignal(r, companyId));
    }
    stats.guestWorker = guestRecords.length;
    console.log(`[sync-immigration] Guest Worker: ${guestRecords.length} records`);

    // 3. Immigration Enforcement
    console.log('[sync-immigration] Fetching enforcement data...');
    const enforcementRecords = await fetchImmigrationEnforcement(companyName);
    for (const r of enforcementRecords.slice(0, 25)) {
      signals.push(mapEnforcementToSignal(r, companyId));
    }
    stats.enforcement = enforcementRecords.length;
    console.log(`[sync-immigration] Enforcement: ${enforcementRecords.length} records`);

    // Insert immigration_signals
    if (signals.length > 0) {
      await supabase
        .from('immigration_signals')
        .delete()
        .eq('company_id', companyId);

      const { error: insertErr } = await supabase
        .from('immigration_signals')
        .insert(signals);

      if (insertErr) {
        console.error('[sync-immigration] Insert error:', insertErr);
      }
    }

    // Write summary to issue_signals for unified pipeline
    const issueSignals = signals
      .filter(s => ['h1b_sponsorship', 'h2a_sponsorship', 'h2b_sponsorship', 'mspa_violation', 'immigration_enforcement'].includes(s.signal_type))
      .slice(0, 10)
      .map(s => ({
        company_id: companyId,
        issue_category: 'immigration',
        signal_type: s.signal_type,
        title: s.description?.slice(0, 200) || s.signal_type,
        description: s.description,
        source_url: s.source_url,
        source_name: s.source_name,
        confidence: s.confidence,
        detected_at: new Date().toISOString(),
      }));

    if (issueSignals.length > 0) {
      const { error: issueErr } = await supabase
        .from('issue_signals')
        .insert(issueSignals);
      if (issueErr) console.warn('[sync-immigration] issue_signals insert error:', issueErr);
    }

    // Record scan
    await supabase.from('company_signal_scans').insert({
      company_id: companyId,
      scan_type: 'immigration',
      status: 'completed',
      signals_found: signals.length,
      metadata: stats,
    }).then(({ error }) => {
      if (error) console.warn('[sync-immigration] scan record error:', error);
    });

    console.log(`[sync-immigration] COMPLETE: ${signals.length} signals (H1B:${stats.h1b} Guest:${stats.guestWorker} Enforcement:${stats.enforcement})`);

    return new Response(JSON.stringify({
      success: true,
      totalSignals: signals.length,
      stats,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-immigration] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
