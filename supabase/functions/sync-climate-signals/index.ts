/**
 * Sync Climate Signals
 * 
 * Pulls climate-related data from free government sources:
 * 1. EPA GHGRP (Greenhouse Gas Reporting Program) via Envirofacts API
 * 2. EPA ECHO (Enforcement & Compliance History)
 * 
 * Writes to: climate_signals, issue_signals
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

// ─── 1. EPA GHGRP — Greenhouse Gas Emissions ───
async function fetchGHGRPData(companyName: string): Promise<any[]> {
  const searchName = normalizeCompanyName(companyName);
  const allResults: any[] = [];

  try {
    // Envirofacts REST API for GHG emitters
    const encoded = encodeURIComponent(searchName);
    const url = `https://data.epa.gov/efservice/ghg_emitter_sector/parent_company/containing/${encoded}/JSON/0:50`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) allResults.push(...data);
    } else {
      console.warn(`[GHGRP] ${resp.status} for "${searchName}"`);
    }
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.warn('[GHGRP] Error:', e);
  }

  // Fallback: try facility-level search
  if (allResults.length === 0) {
    try {
      const encoded = encodeURIComponent(searchName);
      const url = `https://data.epa.gov/efservice/ghg_emitter_sector/facility_name/containing/${encoded}/JSON/0:25`;
      const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data)) allResults.push(...data);
      }
    } catch (e) {
      console.warn('[GHGRP facility fallback] Error:', e);
    }
  }

  return allResults;
}

// ─── 2. EPA ECHO — Enforcement & Compliance ───
async function fetchECHOData(companyName: string): Promise<any[]> {
  const searchName = normalizeCompanyName(companyName);
  const allResults: any[] = [];

  try {
    const encoded = encodeURIComponent(searchName);
    // ECHO facility search API
    const url = `https://echo.epa.gov/dfr-api/rest/services/get_facility_info?p_fn=${encoded}&output=JSON`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      const facilities = data?.Results?.Facilities || [];
      if (Array.isArray(facilities)) allResults.push(...facilities);
    } else {
      console.warn(`[ECHO] ${resp.status} for "${searchName}"`);
    }
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.warn('[ECHO] Error:', e);
  }

  return allResults;
}

// ─── 3. EPA ECHO — Enforcement Cases ───
async function fetchEPAEnforcement(companyName: string): Promise<any[]> {
  const searchName = normalizeCompanyName(companyName);
  const allResults: any[] = [];

  try {
    const encoded = encodeURIComponent(searchName);
    const url = `https://echo.epa.gov/dfr-api/rest/services/get_caa_compliance?p_fn=${encoded}&output=JSON`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      const results = data?.Results?.CAACompliance || [];
      if (Array.isArray(results)) {
        const violations = results.filter((r: any) =>
          r.HPV_FLAG === 'Y' || r.COMPLIANCE_STATUS === 'Violation'
        );
        allResults.push(...violations);
      }
    }
    await new Promise(r => setTimeout(r, 500));
  } catch (e) {
    console.warn('[EPA Enforcement] Error:', e);
  }

  return allResults;
}

// ─── Map records to climate_signals rows ───

function mapGHGRPToSignal(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'climate',
    signal_type: 'ghg_emissions',
    facility_name: record.facility_name || record.FACILITY_NAME || null,
    emissions_amount: record.co2e_emission ? parseFloat(record.co2e_emission) :
                      record.CO2E_EMISSION ? parseFloat(record.CO2E_EMISSION) : null,
    emissions_unit: 'metric_tons_co2e',
    location_state: record.state || record.STATE || null,
    description: [
      `EPA GHGRP: ${record.facility_name || record.FACILITY_NAME || 'Facility'}`,
      record.parent_company || record.PARENT_COMPANY || '',
      record.co2e_emission ? `${parseFloat(record.co2e_emission).toLocaleString()} metric tons CO₂e` : '',
      record.sector || record.SECTOR || '',
    ].filter(Boolean).join('. '),
    source_name: 'EPA Greenhouse Gas Reporting Program',
    source_url: 'https://ghgdata.epa.gov/ghgp/main.do',
    confidence: 'direct',
    evidence_text: `${record.parent_company || record.PARENT_COMPANY || ''} - ${record.city || record.CITY || ''}, ${record.state || record.STATE || ''}`,
  };
}

function mapECHOToSignal(record: any, companyId: string): any {
  const hasViolation = record.CurrVioStatus === 'Y' || record.QtrsWithNC > 0;
  return {
    company_id: companyId,
    signal_category: 'climate',
    signal_type: hasViolation ? 'epa_violation' : 'epa_compliance',
    facility_name: record.FacName || record.FAC_NAME || null,
    location_state: record.FacState || record.FAC_STATE || null,
    description: [
      hasViolation ? 'EPA compliance violation detected' : 'EPA compliance record',
      record.FacName || record.FAC_NAME || '',
      record.QtrsWithNC ? `${record.QtrsWithNC} quarters with non-compliance` : '',
      record.CAAPermitTypes || '',
    ].filter(Boolean).join('. '),
    source_name: 'EPA ECHO',
    source_url: `https://echo.epa.gov/detailed-facility-report?fid=${record.RegistryID || record.FAC_REGISTRY_ID || ''}`,
    confidence: 'direct',
    evidence_text: `${record.FacName || ''} - ${record.FacCity || ''}, ${record.FacState || ''}`,
  };
}

function mapEnforcementToSignal(record: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'climate',
    signal_type: 'epa_enforcement',
    facility_name: record.FacName || record.FAC_NAME || null,
    location_state: record.FacState || record.FAC_STATE || null,
    description: [
      'EPA Clean Air Act enforcement action',
      record.FacName || record.FAC_NAME || '',
      record.HPV_FLAG === 'Y' ? 'High Priority Violation' : '',
      record.COMPLIANCE_STATUS || '',
    ].filter(Boolean).join('. '),
    source_name: 'EPA ECHO Enforcement',
    source_url: 'https://echo.epa.gov/',
    confidence: 'direct',
    evidence_text: `${record.FacName || ''} - CAA Enforcement`,
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

    console.log(`[sync-climate] START: ${companyName} (${companyId})`);

    const signals: any[] = [];
    const stats = { ghgrp: 0, echo: 0, enforcement: 0 };

    // 1. GHGRP Emissions Data
    console.log('[sync-climate] Fetching EPA GHGRP data...');
    const ghgrpRecords = await fetchGHGRPData(companyName);
    for (const r of ghgrpRecords.slice(0, 50)) {
      signals.push(mapGHGRPToSignal(r, companyId));
    }
    stats.ghgrp = ghgrpRecords.length;
    console.log(`[sync-climate] GHGRP: ${ghgrpRecords.length} records`);

    // 2. ECHO Compliance
    console.log('[sync-climate] Fetching EPA ECHO data...');
    const echoRecords = await fetchECHOData(companyName);
    for (const r of echoRecords.slice(0, 25)) {
      signals.push(mapECHOToSignal(r, companyId));
    }
    stats.echo = echoRecords.length;
    console.log(`[sync-climate] ECHO: ${echoRecords.length} records`);

    // 3. EPA Enforcement
    console.log('[sync-climate] Fetching EPA enforcement data...');
    const enforcementRecords = await fetchEPAEnforcement(companyName);
    for (const r of enforcementRecords.slice(0, 25)) {
      signals.push(mapEnforcementToSignal(r, companyId));
    }
    stats.enforcement = enforcementRecords.length;
    console.log(`[sync-climate] Enforcement: ${enforcementRecords.length} records`);

    // Insert climate_signals
    if (signals.length > 0) {
      await supabase
        .from('climate_signals')
        .delete()
        .eq('company_id', companyId);

      const { error: insertErr } = await supabase
        .from('climate_signals')
        .insert(signals);

      if (insertErr) {
        console.error('[sync-climate] Insert error:', insertErr);
      }
    }

    // Write summary to issue_signals for unified pipeline
    const issueSignals = signals
      .filter(s => ['ghg_emissions', 'epa_violation', 'epa_enforcement'].includes(s.signal_type))
      .slice(0, 10)
      .map(s => ({
        company_id: companyId,
        issue_category: 'climate',
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
      if (issueErr) console.warn('[sync-climate] issue_signals insert error:', issueErr);
    }

    // Record scan
    await supabase.from('company_signal_scans').insert({
      company_id: companyId,
      scan_type: 'climate',
      status: 'completed',
      signals_found: signals.length,
      metadata: stats,
    }).then(({ error }) => {
      if (error) console.warn('[sync-climate] scan record error:', error);
    });

    console.log(`[sync-climate] COMPLETE: ${signals.length} signals (GHGRP:${stats.ghgrp} ECHO:${stats.echo} Enforcement:${stats.enforcement})`);

    return new Response(JSON.stringify({
      success: true,
      totalSignals: signals.length,
      stats,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-climate] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
