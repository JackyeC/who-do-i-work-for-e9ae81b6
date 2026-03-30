/**
 * WDIWF Service Worker v4.1.0
 * Routes messages, queries Supabase, caches results, manages side panel.
 */

const SUPABASE_URL = 'https://tdetybqdxadmowjivtjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const cache = new Map();

// Open side panel on extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

// Handle messages from content scripts and side panel
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'COMPANY_DETECTED') {
    handleCompanyDetected(msg, sender);
  }

  if (msg.type === 'CHECK_COMPANY') {
    fetchCompanyData(msg.company_name).then(data => {
      chrome.runtime.sendMessage({ type: 'COMPANY_DATA', data });
    });
  }

  if (msg.type === 'GENERATE_DOSSIER') {
    // Dossier generation now happens on the main site — redirect there
    const slug = msg.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    chrome.tabs.create({ url: `https://wdiwf.jackyeclayton.com/dossier/${slug}` });
  }

  return true; // async
});

async function handleCompanyDetected(msg, sender) {
  // Open side panel
  if (sender.tab?.id) {
    try {
      await chrome.sidePanel.open({ tabId: sender.tab.id });
    } catch {}
  }

  // Forward detection to panel
  chrome.runtime.sendMessage({
    type: 'COMPANY_DETECTED_FORWARD',
    name: msg.name,
    platform: msg.platform,
    confidence: msg.confidence,
  });

  // Fetch data
  const data = await fetchCompanyData(msg.name);
  chrome.runtime.sendMessage({ type: 'COMPANY_DATA', data });
}

async function fetchCompanyData(companyName) {
  const key = companyName.toLowerCase().trim();

  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Search by name (case-insensitive) in the companies table
    const slug = key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Try exact slug match first, then fuzzy name match
    let data = await queryCompany(`slug=eq.${encodeURIComponent(slug)}`);

    if (!data) {
      // Try ilike on name
      data = await queryCompany(`name=ilike.*${encodeURIComponent(companyName)}*&limit=1`);
    }

    if (data) {
      // Enrich with additional signals
      const enriched = await enrichCompanyData(data);
      cache.set(key, { data: enriched, ts: Date.now() });
      return enriched;
    }

    return { error: 'Company not found', company_name: companyName };
  } catch (err) {
    return { error: err.message, company_name: companyName };
  }
}

async function queryCompany(filter) {
  const fields = 'id,name,slug,industry,state,employee_count,employer_clarity_score,career_intelligence_score,confidence_rating,total_pac_spending,lobbying_spend,insider_score,jackye_insight,logo_url,is_publicly_traded,description';

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?${filter}&select=${fields}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Accept': 'application/json',
      },
    }
  );

  if (!res.ok) return null;

  const rows = await res.json();
  return rows?.length > 0 ? rows[0] : null;
}

async function enrichCompanyData(company) {
  // Build a composite integrity result matching what the panel expects
  const clarityScore = company.employer_clarity_score || 0;
  const insiderScore = company.insider_score || 0;
  const pacSpending = company.total_pac_spending || 0;
  const lobbyingSpend = company.lobbying_spend || 0;

  // Derive sub-scores from available data
  const integrityGap = clarityScore;
  const connectedDots = insiderScore;

  // Fetch additional signals in parallel
  const [executives, contracts, stances] = await Promise.all([
    fetchRelated('company_executives', company.id, 'name,title,total_donations,departed_at'),
    fetchRelated('company_agency_contracts', company.id, 'agency_name,contract_value,contract_description'),
    fetchRelated('company_public_stances', company.id, 'stance_category,stance_summary,stance_direction'),
  ]);

  // Build reality gap evidence from stances
  const realityGapEvidence = (stances || []).slice(0, 3).map(s => ({
    summary: s.stance_summary,
    source: s.stance_category || 'Public stance',
  }));

  // Build civic concerns from PAC/lobbying
  const civicConcerns = [];
  if (pacSpending > 0) {
    civicConcerns.push({
      summary: `Corporate PAC spending totaling $${pacSpending.toLocaleString()}`,
      source: 'FEC filings',
    });
  }
  if (lobbyingSpend > 0) {
    civicConcerns.push({
      summary: `Lobbying expenditures of $${lobbyingSpend.toLocaleString()}`,
      source: 'Senate LDA disclosures',
    });
  }

  // Build insider evidence from exec donations
  const insiderEvidence = (executives || [])
    .filter(e => e.total_donations > 0)
    .slice(0, 3)
    .map(e => ({
      summary: `${e.name} (${e.title}) — $${e.total_donations.toLocaleString()} in personal political donations`,
      source: 'FEC',
    }));

  return {
    company_name: company.name,
    slug: company.slug,
    industry: company.industry,
    state: company.state,
    employee_count: company.employee_count,
    logo_url: company.logo_url,
    is_publicly_traded: company.is_publicly_traded,
    description: company.description,
    jackye_insight: company.jackye_insight,

    // Scores the panel uses
    civic_footprint_score: integrityGap,
    integrity_gap_score: integrityGap,
    insider_score: connectedDots,
    labor_impact_score: 0, // derived in panel from glassdoor data
    safety_alert_score: 0, // derived in panel from risk level

    // Evidence arrays
    reality_gap_evidence: realityGapEvidence,
    civic_concerns: civicConcerns,
    insider_score_evidence: insiderEvidence,

    // Confidence
    data_confidence: company.confidence_rating || 'medium',

    // Raw data for panel context
    total_pac_spending: pacSpending,
    lobbying_spend: lobbyingSpend,
    government_contracts: (contracts || []).length,
    executive_count: (executives || []).length,
  };
}

async function fetchRelated(table, companyId, fields) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?company_id=eq.${companyId}&select=${fields}&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Accept': 'application/json',
        },
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
