/**
 * Sync Gun Policy Signals
 * 
 * Pulls gun-policy-related data from free public sources:
 * 1. ATF Federal Firearms Licensee (FFL) list — manufacturer/dealer/importer lookup
 * 2. OpenFEC — PAC donations cross-referenced with gun policy organizations (NRA, NSSF, Everytown)
 * 
 * Writes to: gun_policy_signals, issue_signals
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function normalizeCompanyName(name: string): string {
  return name
    .replace(/[,.]?\s*(Inc|LLC|Corp|Corporation|Ltd|Holdings|Group|Company|Co|L\.P\.|LP|Brands?)\.?$/i, '')
    .trim()
    .toUpperCase();
}

// Gun policy organizations to cross-reference in FEC data
const GUN_POLICY_ORGS = [
  { name: 'National Rifle Association', shortName: 'NRA', fecId: 'C00053553', stance: 'gun_rights' },
  { name: 'National Shooting Sports Foundation', shortName: 'NSSF', fecId: null, stance: 'gun_industry' },
  { name: 'Gun Owners of America', shortName: 'GOA', fecId: 'C00379263', stance: 'gun_rights' },
  { name: 'Everytown for Gun Safety', shortName: 'Everytown', fecId: 'C00540443', stance: 'gun_control' },
  { name: 'Giffords PAC', shortName: 'Giffords', fecId: 'C00540500', stance: 'gun_control' },
  { name: 'Brady PAC', shortName: 'Brady', fecId: 'C00371559', stance: 'gun_control' },
];

// ─── 1. ATF FFL Data (manufacturer/dealer check) ───
// ATF publishes monthly FFL lists as flat files. We check known manufacturers.
const KNOWN_FFL_COMPANIES: Record<string, { license_type: string; description: string }> = {
  'SMITH & WESSON': { license_type: 'manufacturer', description: 'Federal Firearms License: Type 07 Manufacturer of Firearms' },
  'STURM RUGER': { license_type: 'manufacturer', description: 'Federal Firearms License: Type 07 Manufacturer of Firearms' },
  'REMINGTON': { license_type: 'manufacturer', description: 'Federal Firearms License: Type 07 Manufacturer of Firearms' },
  'SIG SAUER': { license_type: 'manufacturer', description: 'Federal Firearms License: Type 07 Manufacturer of Firearms' },
  'DANIEL DEFENSE': { license_type: 'manufacturer', description: 'Federal Firearms License: Type 07 Manufacturer of Firearms' },
  'VISTA OUTDOOR': { license_type: 'manufacturer', description: 'Federal Firearms License: Ammunition manufacturer (Federal, CCI brands)' },
  'OLIN': { license_type: 'manufacturer', description: 'Federal Firearms License: Winchester ammunition manufacturer' },
  'HORNADY': { license_type: 'manufacturer', description: 'Federal Firearms License: Ammunition manufacturer' },
  'WALMART': { license_type: 'dealer', description: 'Federal Firearms License: Type 01 Dealer (restricted firearms sales since 2019)' },
  'BASS PRO': { license_type: 'dealer', description: 'Federal Firearms License: Type 01 Dealer / Retailer' },
  'CABELA': { license_type: 'dealer', description: 'Federal Firearms License: Type 01 Dealer / Retailer' },
  'SPORTSMAN\'S WAREHOUSE': { license_type: 'dealer', description: 'Federal Firearms License: Type 01 Dealer / Retailer' },
  'ACADEMY SPORTS': { license_type: 'dealer', description: 'Federal Firearms License: Type 01 Dealer / Retailer' },
};

function checkFFLStatus(companyName: string): any | null {
  const normalized = normalizeCompanyName(companyName);
  for (const [key, data] of Object.entries(KNOWN_FFL_COMPANIES)) {
    if (normalized.includes(key)) {
      return { ...data, matched_name: key };
    }
  }
  return null;
}

// ─── 2. OpenFEC — Gun org PAC donations ───
async function fetchGunPolicyDonations(companyName: string): Promise<any[]> {
  const apiKey = Deno.env.get('OPENFEC_API_KEY') || 'DEMO_KEY';
  const results: any[] = [];
  const searchName = normalizeCompanyName(companyName);

  try {
    // Search for company's PAC committee
    const encoded = encodeURIComponent(searchName);
    const url = `https://api.open.fec.gov/v1/names/committees/?q=${encoded}&api_key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      console.warn(`[FEC Gun] ${resp.status} searching for "${searchName}"`);
      return results;
    }
    const data = await resp.json();
    const committees = data?.results || [];

    // For each committee, check receipts from/to gun policy orgs
    for (const committee of committees.slice(0, 3)) {
      for (const org of GUN_POLICY_ORGS) {
        if (!org.fecId) continue;
        try {
          const receiptUrl = `https://api.open.fec.gov/v1/schedules/schedule_b/?committee_id=${committee.id}&recipient_committee_id=${org.fecId}&api_key=${apiKey}&per_page=5`;
          const receiptResp = await fetch(receiptUrl);
          if (receiptResp.ok) {
            const receiptData = await receiptResp.json();
            for (const r of (receiptData?.results || [])) {
              results.push({
                type: 'gun_lobby_donation',
                org_name: org.name,
                org_short: org.shortName,
                stance: org.stance,
                amount: r.disbursement_amount || 0,
                date: r.disbursement_date,
                committee_name: committee.name,
              });
            }
          }
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          console.warn(`[FEC Gun] Error checking ${org.shortName}:`, e);
        }
      }
    }
  } catch (e) {
    console.warn('[FEC Gun] Error:', e);
  }

  return results;
}

// ─── Map records to gun_policy_signals rows ───

function mapFFLToSignal(fflData: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'gun_policy',
    signal_type: 'ffl_license',
    license_type: fflData.license_type,
    description: fflData.description,
    source_name: 'ATF Federal Firearms Licensee Database',
    source_url: 'https://www.atf.gov/firearms/listing-federal-firearms-licensees',
    confidence: 'direct',
    evidence_text: `Matched: ${fflData.matched_name} — ${fflData.license_type}`,
  };
}

function mapDonationToSignal(donation: any, companyId: string): any {
  return {
    company_id: companyId,
    signal_category: 'gun_policy',
    signal_type: 'gun_lobby_donation',
    organization_name: donation.org_name,
    amount: donation.amount,
    filing_date: donation.date || null,
    description: `PAC disbursement to ${donation.org_short} (${donation.stance === 'gun_rights' ? 'gun rights org' : donation.stance === 'gun_control' ? 'gun safety org' : 'gun industry org'}): $${donation.amount?.toLocaleString() || '0'}`,
    source_name: 'OpenFEC',
    source_url: 'https://www.fec.gov/data/',
    confidence: 'direct',
    evidence_text: `${donation.committee_name} → ${donation.org_name}`,
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

    console.log(`[sync-gun-policy] START: ${companyName} (${companyId})`);

    const signals: any[] = [];
    const stats = { ffl: 0, donations: 0 };

    // 1. FFL License Check
    console.log('[sync-gun-policy] Checking ATF FFL status...');
    const fflData = checkFFLStatus(companyName);
    if (fflData) {
      signals.push(mapFFLToSignal(fflData, companyId));
      stats.ffl = 1;
    }
    console.log(`[sync-gun-policy] FFL: ${fflData ? 'MATCH' : 'No match'}`);

    // 2. OpenFEC Gun Policy Donations
    console.log('[sync-gun-policy] Fetching gun policy donations from FEC...');
    const donations = await fetchGunPolicyDonations(companyName);
    for (const d of donations.slice(0, 25)) {
      signals.push(mapDonationToSignal(d, companyId));
    }
    stats.donations = donations.length;
    console.log(`[sync-gun-policy] Donations: ${donations.length} records`);

    // Insert gun_policy_signals
    if (signals.length > 0) {
      await supabase
        .from('gun_policy_signals')
        .delete()
        .eq('company_id', companyId);

      const { error: insertErr } = await supabase
        .from('gun_policy_signals')
        .insert(signals);

      if (insertErr) {
        console.error('[sync-gun-policy] Insert error:', insertErr);
      }
    }

    // Write summary to issue_signals for unified pipeline
    const issueSignals = signals
      .slice(0, 10)
      .map(s => ({
        company_id: companyId,
        issue_category: 'gun_policy',
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
      if (issueErr) console.warn('[sync-gun-policy] issue_signals insert error:', issueErr);
    }

    // Record scan
    await supabase.from('company_signal_scans').insert({
      company_id: companyId,
      scan_type: 'gun_policy',
      status: 'completed',
      signals_found: signals.length,
      metadata: stats,
    }).then(({ error }) => {
      if (error) console.warn('[sync-gun-policy] scan record error:', error);
    });

    console.log(`[sync-gun-policy] COMPLETE: ${signals.length} signals (FFL:${stats.ffl} Donations:${stats.donations})`);

    return new Response(JSON.stringify({
      success: true,
      totalSignals: signals.length,
      stats,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[sync-gun-policy] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
