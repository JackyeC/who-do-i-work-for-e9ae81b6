/**
 * Sync Consumer Protection Signals
 * 
 * Pulls consumer-protection data from free public sources:
 * 1. CFPB Consumer Complaint Database (live API)
 * 2. CPSC Product Safety Recalls (live API)
 * 3. FDA Enforcement/Recalls (live API)
 * 4. Known FTC enforcement actions (curated)
 * 5. Known data breach records (curated)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function normalizeCompanyName(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP|Brands?)\.?$/i, '')
    .trim();
}

// ─── 1. CFPB Consumer Complaints (Live API) ───
async function fetchCFPBComplaints(companyName: string): Promise<any[]> {
  const results: any[] = [];
  const searchName = normalizeCompanyName(companyName);
  try {
    const encoded = encodeURIComponent(searchName);
    const url = `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/?company=${encoded}&size=0&no_aggs=false`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      const totalHits = data?.hits?.total?.value || data?.hits?.total || 0;
      const products = data?.aggregations?.product?.product?.buckets || [];
      if (totalHits > 0) {
        results.push({
          signal_type: 'cfpb_complaints',
          complaint_count: totalHits,
          description: `${totalHits.toLocaleString()} consumer complaints filed with CFPB. Top products: ${products.slice(0, 3).map((p: any) => `${p.key} (${p.doc_count})`).join(', ') || 'N/A'}.`,
          source_name: 'CFPB',
          source_url: `https://www.consumerfinance.gov/data-research/consumer-complaints/search/?company=${encoded}`,
        });
      }
    } else {
      console.warn(`[CFPB] ${resp.status} for "${searchName}"`);
    }
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.warn('[CFPB] Error:', e);
  }
  return results;
}

// ─── 2. CPSC Product Recalls (Live API) ───
async function fetchCPSCRecalls(companyName: string): Promise<any[]> {
  const results: any[] = [];
  const searchName = normalizeCompanyName(companyName);
  try {
    const encoded = encodeURIComponent(searchName);
    const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallTitle=${encoded}`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const data = await resp.json();
      const recalls = Array.isArray(data) ? data : [];
      for (const recall of recalls.slice(0, 10)) {
        results.push({
          signal_type: 'product_recall',
          product_name: recall.Title || recall.Description || 'Product recall',
          hazard_type: recall.Hazards?.[0]?.Name || recall.HazardType || null,
          units_affected: recall.NumberOfUnits ? parseInt(String(recall.NumberOfUnits).replace(/[^0-9]/g, '')) || null : null,
          filing_date: recall.RecallDate || null,
          description: `CPSC Recall: ${recall.Title || 'Product'}. ${recall.Hazards?.[0]?.Name || ''}. ${recall.NumberOfUnits ? `Units: ${recall.NumberOfUnits}` : ''}`.trim(),
          source_name: 'CPSC',
          source_url: recall.URL || 'https://www.cpsc.gov/Recalls',
        });
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.warn('[CPSC] Error:', e);
  }
  return results;
}

// ─── 3. FDA Enforcement (Live API) ───
async function fetchFDAEnforcement(companyName: string): Promise<any[]> {
  const results: any[] = [];
  const searchName = normalizeCompanyName(companyName);
  try {
    const encoded = encodeURIComponent(searchName);
    const url = `https://api.fda.gov/drug/enforcement.json?search=recalling_firm:"${encoded}"&limit=10`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      const recalls = data?.results || [];
      for (const recall of recalls) {
        results.push({
          signal_type: 'fda_recall',
          product_name: recall.product_description?.slice(0, 200) || 'Drug/Device',
          hazard_type: recall.reason_for_recall?.slice(0, 200) || null,
          filing_date: recall.recall_initiation_date || recall.report_date || null,
          description: `FDA ${recall.classification || ''} Recall: ${recall.product_description?.slice(0, 150) || 'Product'}. Reason: ${recall.reason_for_recall?.slice(0, 150) || 'See filing'}.`.trim(),
          source_name: 'FDA',
          source_url: 'https://open.fda.gov/',
        });
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.warn('[FDA] Error:', e);
  }
  return results;
}

// ─── 4. Known FTC Enforcement Actions (curated) ───
const KNOWN_FTC_ACTIONS: Record<string, any[]> = {
  'FACEBOOK': [
    { violation_type: 'Privacy Violation', year: 2019, settlement: 5000000000, description: 'FTC: $5B settlement for deceiving users about privacy controls. Cambridge Analytica data sharing.' },
  ],
  'META': [
    { violation_type: 'Privacy Violation', year: 2019, settlement: 5000000000, description: 'FTC: $5B settlement for deceiving users about privacy controls. Cambridge Analytica data sharing.' },
  ],
  'GOOGLE': [
    { violation_type: 'Privacy/COPPA', year: 2019, settlement: 170000000, description: 'FTC: $170M settlement for YouTube illegally collecting children\'s data without parental consent (COPPA).' },
  ],
  'ALPHABET': [
    { violation_type: 'Privacy/COPPA', year: 2019, settlement: 170000000, description: 'FTC: $170M settlement for YouTube illegally collecting children\'s data without parental consent (COPPA).' },
  ],
  'AMAZON': [
    { violation_type: 'Privacy/Alexa', year: 2023, settlement: 25000000, description: 'FTC: $25M settlement for retaining children\'s Alexa voice recordings and violating COPPA.' },
    { violation_type: 'Privacy/Ring', year: 2023, settlement: 5800000, description: 'FTC: $5.8M settlement for Ring allowing employees to access customer video feeds without consent.' },
  ],
  'WELLS FARGO': [
    { violation_type: 'Consumer Fraud', year: 2022, settlement: 3700000000, description: 'CFPB: $3.7B penalty for widespread consumer abuses including fake accounts, wrongful foreclosures, and illegal fees.' },
  ],
  'EQUIFAX': [
    { violation_type: 'Data Breach', year: 2019, settlement: 700000000, description: 'FTC: $700M settlement for 2017 data breach exposing personal info of 147M consumers.' },
  ],
  'T-MOBILE': [
    { violation_type: 'Data Breach', year: 2024, settlement: 31500000, description: 'FCC: $31.5M settlement for data breaches in 2021-2023 affecting 76M+ customers.' },
  ],
  'EPIC GAMES': [
    { violation_type: 'Privacy/COPPA/Dark Patterns', year: 2022, settlement: 520000000, description: 'FTC: $520M for COPPA violations and dark patterns tricking Fortnite players into unwanted purchases.' },
  ],
  'WALMART': [
    { violation_type: 'Deceptive Pricing', year: 2023, settlement: 0, description: 'FTC investigation into deceptive pricing practices on Walmart.com product listings.' },
  ],
};

function lookupFTCActions(companyName: string): any[] {
  const normalized = normalizeCompanyName(companyName).toUpperCase();
  for (const [key, actions] of Object.entries(KNOWN_FTC_ACTIONS)) {
    if (normalized.includes(key)) return actions;
  }
  return [];
}

// ─── 5. Known Data Breaches (curated) ───
const KNOWN_DATA_BREACHES: Record<string, any[]> = {
  'EQUIFAX': [
    { year: 2017, records: 147000000, description: 'Massive data breach exposing Social Security numbers, birth dates, and addresses of 147M consumers.' },
  ],
  'YAHOO': [
    { year: 2013, records: 3000000000, description: 'Data breach affecting all 3B Yahoo user accounts — names, emails, passwords, security questions.' },
  ],
  'FACEBOOK': [
    { year: 2019, records: 533000000, description: '533M user records exposed including phone numbers, names, and locations across 106 countries.' },
  ],
  'META': [
    { year: 2019, records: 533000000, description: '533M user records exposed including phone numbers, names, and locations across 106 countries.' },
  ],
  'T-MOBILE': [
    { year: 2021, records: 76600000, description: 'Data breach exposing names, SSNs, driver\'s license info of 76.6M current/former customers.' },
  ],
  'MARRIOTT': [
    { year: 2018, records: 500000000, description: 'Starwood reservation database breach exposing 500M guest records including passport numbers.' },
  ],
  'ANTHEM': [
    { year: 2015, records: 78800000, description: 'Health insurer breach exposing names, SSNs, medical IDs of 78.8M members.' },
  ],
  'CAPITAL ONE': [
    { year: 2019, records: 106000000, description: 'Data breach exposing 106M credit card applicants\' personal data including SSNs and bank account numbers.' },
  ],
};

function lookupDataBreaches(companyName: string): any[] {
  const normalized = normalizeCompanyName(companyName).toUpperCase();
  for (const [key, breaches] of Object.entries(KNOWN_DATA_BREACHES)) {
    if (normalized.includes(key)) return breaches;
  }
  return [];
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

    console.log(`[sync-consumer-protection] START: ${companyName} (${companyId})`);

    const signals: any[] = [];
    const stats = { cfpb: 0, cpsc: 0, fda: 0, ftc: 0, breaches: 0 };

    // 1. CFPB Consumer Complaints
    console.log('[sync-consumer-protection] Fetching CFPB complaints...');
    const cfpbResults = await fetchCFPBComplaints(companyName);
    for (const r of cfpbResults) {
      signals.push({ company_id: companyId, signal_category: 'consumer_protection', confidence: 'direct', ...r });
    }
    stats.cfpb = cfpbResults.length;

    // 2. CPSC Product Recalls
    console.log('[sync-consumer-protection] Fetching CPSC recalls...');
    const cpscResults = await fetchCPSCRecalls(companyName);
    for (const r of cpscResults) {
      signals.push({ company_id: companyId, signal_category: 'consumer_protection', confidence: 'direct', ...r });
    }
    stats.cpsc = cpscResults.length;

    // 3. FDA Enforcement
    console.log('[sync-consumer-protection] Fetching FDA recalls...');
    const fdaResults = await fetchFDAEnforcement(companyName);
    for (const r of fdaResults) {
      signals.push({ company_id: companyId, signal_category: 'consumer_protection', confidence: 'direct', ...r });
    }
    stats.fda = fdaResults.length;

    // 4. FTC Enforcement
    console.log('[sync-consumer-protection] Checking FTC enforcement...');
    const ftcActions = lookupFTCActions(companyName);
    for (const a of ftcActions) {
      signals.push({
        company_id: companyId,
        signal_category: 'consumer_protection',
        signal_type: 'ftc_enforcement',
        violation_type: a.violation_type,
        settlement_amount: a.settlement || null,
        filing_date: `${a.year}-01-01`,
        description: a.description,
        source_name: 'FTC',
        source_url: 'https://www.ftc.gov/legal-library/browse/cases-proceedings',
        confidence: 'direct',
        evidence_text: `${a.violation_type} (${a.year})`,
      });
    }
    stats.ftc = ftcActions.length;

    // 5. Data Breaches
    console.log('[sync-consumer-protection] Checking data breaches...');
    const breaches = lookupDataBreaches(companyName);
    for (const b of breaches) {
      signals.push({
        company_id: companyId,
        signal_category: 'consumer_protection',
        signal_type: 'data_breach',
        records_exposed: b.records,
        filing_date: `${b.year}-01-01`,
        description: b.description,
        source_name: 'Privacy Rights Clearinghouse',
        source_url: 'https://privacyrights.org/',
        confidence: 'direct',
        evidence_text: `${b.records.toLocaleString()} records exposed (${b.year})`,
      });
    }
    stats.breaches = breaches.length;

    // Insert
    if (signals.length > 0) {
      await supabase.from('consumer_protection_signals').delete().eq('company_id', companyId);
      const { error: insertErr } = await supabase.from('consumer_protection_signals').insert(signals);
      if (insertErr) console.error('[sync-consumer-protection] Insert error:', insertErr);
    }

    // Record scan
    await supabase.from('company_signal_scans').insert({
      company_id: companyId,
      scan_type: 'consumer_protection',
      status: 'completed',
      signals_found: signals.length,
      metadata: stats,
    }).then(({ error }) => {
      if (error) console.warn('[sync-consumer-protection] scan record error:', error);
    });

    console.log(`[sync-consumer-protection] COMPLETE: ${signals.length} signals (CFPB:${stats.cfpb} CPSC:${stats.cpsc} FDA:${stats.fda} FTC:${stats.ftc} Breaches:${stats.breaches})`);

    return new Response(JSON.stringify({ success: true, totalSignals: signals.length, stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[sync-consumer-protection] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
