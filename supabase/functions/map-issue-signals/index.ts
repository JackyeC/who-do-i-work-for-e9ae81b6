const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Issue keyword mappings ───
const ISSUE_KEYWORDS: Record<string, string[]> = {
  gun_policy: [
    'firearms', 'gun', 'second amendment', 'nra', 'weapons manufacturing',
    'firearm legislation', 'gun control', 'gun rights', 'ammunition',
    'national rifle association', 'gun violence', 'assault weapon',
    'national shooting sports foundation', 'nssf', 'second amendment foundation',
    'everytown', 'brady campaign', 'giffords', 'gun safety',
    'concealed carry', 'open carry', 'firearms policy', 'weapons regulation',
    'smith & wesson', 'sturm ruger', 'vista outdoor', 'olin corporation',
    'american outdoor brands', 'firearm manufacturer', 'ammunition manufacturer',
  ],
  reproductive_rights: [
    'abortion', 'reproductive health', 'planned parenthood', 'family planning',
    'maternal health', 'reproductive rights', 'contraception', 'birth control',
    'roe v wade', 'pro-life', 'pro-choice', 'title x funding', 'title x program',
    'contraceptive access', 'reproductive healthcare', 'dobbs', 'roe v. wade',
    'pregnancy discrimination', 'ivf', 'in vitro fertilization',
    'naral', 'emily\'s list', 'emilys list', 'susan b anthony list',
    'march for life', 'americans united for life', 'national right to life',
    'center for reproductive rights', 'reproductive freedom',
    'heartbeat bill', 'fetal personhood', 'medication abortion',
    'mifepristone', 'misoprostol', 'abortion ban', 'abortion access',
    'women\'s reproductive', 'reproductive justice',
  ],
  labor_rights: [
    'union', 'collective bargaining', 'minimum wage', 'worker protection',
    'labor standards', 'labor rights', 'wage theft', 'right to work',
    'nlrb', 'osha', 'workplace safety', 'fair labor', 'overtime',
  ],
  climate: [
    'climate', 'carbon', 'emissions', 'fossil fuel', 'renewable energy',
    'environmental regulation', 'clean energy', 'greenhouse gas', 'epa',
    'paris agreement', 'global warming', 'sustainability', 'oil and gas',
    'coal', 'petroleum', 'natural gas', 'pipeline',
  ],
  civil_rights: [
    'civil rights', 'discrimination', 'equal protection', 'racial justice',
    'voting rights act', 'affirmative action', 'diversity', 'equity',
    'inclusion', 'dei', 'racial equality', 'police reform',
  ],
  lgbtq_rights: [
    'lgbtq', 'marriage equality', 'gender identity', 'sexual orientation',
    'anti-discrimination', 'transgender', 'same-sex', 'pride',
    'equality act', 'conversion therapy', 'don\'t say gay',
  ],
  voting_rights: [
    'voting access', 'redistricting', 'election integrity', 'gerrymandering',
    'ballot access', 'voter id', 'voter registration', 'election security',
    'mail-in voting', 'absentee ballot', 'voter suppression',
  ],
  immigration: [
    'immigration', 'visa', 'border security', 'detention', 'asylum',
    'refugee', 'daca', 'dreamers', 'ice', 'deportation', 'migrant',
    'border wall', 'h-1b', 'green card', 'citizenship',
  ],
  education: [
    'education policy', 'school funding', 'charter schools', 'student loans',
    'public education', 'higher education', 'title ix', 'school choice',
    'student debt', 'teachers union', 'curriculum', 'voucher',
  ],
  healthcare: [
    'healthcare', 'insurance', 'pharmaceutical', 'drug pricing',
    'medical policy', 'medicare', 'medicaid', 'affordable care act',
    'obamacare', 'prescription drug', 'health insurance', 'public health',
    'hospital', 'biotech', 'fda',
  ],
  consumer_protection: [
    'consumer safety', 'product regulation', 'consumer rights', 'antitrust',
    'ftc', 'cfpb', 'consumer financial', 'data privacy', 'product recall',
    'price gouging', 'monopoly', 'competition',
  ],
};

// ─── Congress.gov policy_area → issue category mapping ───
// These are the official Congress.gov policy area names from bill metadata.
// This lets us generate high-confidence signals from LEGISLATION data
// instead of relying solely on keyword matching.
const POLICY_AREA_TO_ISSUE: Record<string, string[]> = {
  // Direct 1:1 mappings
  'Labor and Employment': ['labor_rights'],
  'Environmental Protection': ['climate'],
  'Energy': ['climate'],
  'Civil Rights and Liberties, Minority Issues': ['civil_rights', 'lgbtq_rights', 'voting_rights'],
  'Immigration': ['immigration'],
  'Education': ['education'],
  'Health': ['healthcare', 'reproductive_rights'],
  'Consumer Protection': ['consumer_protection', 'consumer_protection'],
  'Crime and Law Enforcement': ['gun_policy'],
  'Commerce': ['consumer_protection'],
  'Finance and Financial Sector': ['consumer_protection'],
  'Taxation': ['labor_rights'],
  'Social Welfare': ['labor_rights', 'healthcare'],
  'Public Lands and Natural Resources': ['climate'],
  'Water Resources Development': ['climate'],
  'Science, Technology, Communications': ['consumer_protection'],
  'Women': ['reproductive_rights', 'civil_rights'],
  'Families': ['reproductive_rights', 'healthcare'],
  'Armed Forces and National Security': [],
  'International Affairs': ['immigration'],
  'Government Operations and Politics': ['voting_rights'],
  'Housing and Community Development': ['civil_rights'],
  'Agriculture and Food': ['consumer_protection'],
  'Transportation and Public Works': [],
  'Native Americans': ['civil_rights'],
  'Sports and Recreation': [],
  'Animals': [],
  'Arts, Culture, Religion': [],
  'Economics and Public Finance': [],
  'Emergency Management': [],
  'Foreign Trade and International Finance': [],
  'Law': [],
};

// ─── Gun policy org-to-subtype classification ───
const GUN_RIGHTS_ORGS = [
  'national rifle association', 'nra', 'second amendment foundation',
  'national shooting sports foundation', 'nssf', 'gun owners of america',
  'firearms policy coalition', 'jews for the preservation of firearms',
  'safari club international',
];

const GUN_CONTROL_ORGS = [
  'everytown for gun safety', 'everytown', 'brady campaign', 'brady',
  'giffords', 'moms demand action', 'march for our lives',
  'coalition to stop gun violence', 'sandy hook promise',
  'violence policy center', 'giffords impact network', 'giffords law center',
];

const FIREARM_INDUSTRY_KEYWORDS = [
  'smith & wesson', 'sturm ruger', 'ruger', 'vista outdoor',
  'olin corporation', 'american outdoor brands', 'remington',
  'sig sauer', 'colt', 'beretta', 'firearms manufacturer',
  'ammunition manufacturer', 'weapons manufacturer', 'gunmaker',
];

// ─── Known corporate gun policy actions (public record) ───
const KNOWN_GUN_POLICY_ACTIONS: { companies: string[]; action: string; subtype: string; source: string }[] = [
  { companies: ["dick's sporting goods", "dicks sporting goods"], action: "Stopped selling assault-style weapons and raised purchase age to 21 (2018)", subtype: "gun_control_signal", source: "Corporate press release / SEC filing" },
  { companies: ["walmart"], action: "Raised minimum age for gun purchases to 21 and discontinued sales of assault-style rifle ammunition (2019)", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["levi strauss", "levi's"], action: "Created $1M fund for gun violence prevention groups and joined Everytown Business Leaders for Gun Safety", subtype: "gun_control_signal", source: "Giffords Impact Network" },
  { companies: ["toms", "toms shoes"], action: "Donated $5M to gun violence prevention organizations", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["rei"], action: "Suspended orders from Vista Outdoor (ammunition/firearms parent company) over gun policy", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["citigroup", "citi"], action: "Requires retail clients to restrict gun sales to those under 21 and mandate background checks", subtype: "gun_control_signal", source: "Corporate policy announcement" },
  { companies: ["bank of america"], action: "Stopped lending to manufacturers of military-style rifles for civilian use", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["amalgamated bank"], action: "Active supporter of gun safety legislation and Giffords Impact Network member", subtype: "gun_control_signal", source: "Giffords Impact Network" },
  { companies: ["salesforce"], action: "Banned customers from using Salesforce Commerce Cloud to sell certain weapons and accessories", subtype: "gun_control_signal", source: "Salesforce Acceptable Use Policy" },
  { companies: ["uber"], action: "Prohibits riders and drivers from carrying firearms during trips", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["albertsons"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["aldi"], action: "Prohibits open carry of firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["cvs", "cvs health"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["kroger"], action: "Requested customers not openly carry firearms in stores and ceased gun/ammo sales in Alaska", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["meijer"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["publix"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["walgreens"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["wegmans"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["subway"], action: "Prohibits open carry of firearms in restaurants", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["northwell health"], action: "Major healthcare system actively treating gun violence as a public health crisis", subtype: "gun_control_signal", source: "Corporate program announcement" },
  { companies: ["royal caribbean", "royal caribbean cruises"], action: "Signed letters supporting background check legislation", subtype: "gun_control_signal", source: "Giffords Impact Network" },
  { companies: ["lyft"], action: "Prohibits firearms during rides and donated to March for Our Lives", subtype: "gun_control_signal", source: "Corporate policy / press release" },
  { companies: ["vista outdoor"], action: "Major firearms and ammunition manufacturer (Federal, CCI, Speer brands)", subtype: "firearm_industry_signal", source: "SEC filings" },
  { companies: ["smith & wesson", "smith and wesson"], action: "Major firearms manufacturer, member of NSSF", subtype: "firearm_industry_signal", source: "SEC filings" },
  { companies: ["sturm ruger", "ruger"], action: "Major firearms manufacturer", subtype: "firearm_industry_signal", source: "SEC filings" },
  { companies: ["olin corporation", "olin"], action: "Ammunition manufacturer (Winchester brand)", subtype: "firearm_industry_signal", source: "SEC filings" },
  { companies: ["bass pro shops"], action: "Major firearms retailer, opposes additional gun restrictions", subtype: "gun_rights_signal", source: "Public business model" },
  { companies: ["cabela's"], action: "Major firearms retailer (owned by Bass Pro Shops)", subtype: "gun_rights_signal", source: "Public business model" },
];

function classifyGunPolicySubtype(text: string, signalType: string): string {
  const lower = text.toLowerCase();
  if (signalType === 'lobbying_issue' || lower.includes('lobbying') || lower.includes('lobbied'))
    return 'lobbying_signal';
  for (const org of GUN_RIGHTS_ORGS) { if (lower.includes(org)) return 'gun_rights_signal'; }
  for (const org of GUN_CONTROL_ORGS) { if (lower.includes(org)) return 'gun_control_signal'; }
  for (const kw of FIREARM_INDUSTRY_KEYWORDS) { if (lower.includes(kw)) return 'firearm_industry_signal'; }
  if (signalType === 'pac_donation' || lower.includes('donation') || lower.includes('pac'))
    return 'legislator_support_signal';
  return 'advocacy_signal';
}

interface IssueSignal {
  entity_id: string;
  entity_name_snapshot: string | null;
  issue_category: string;
  signal_type: string;
  signal_subtype: string | null;
  source_dataset: string;
  description: string;
  source_url: string | null;
  confidence_score: string;
  amount: number | null;
  transaction_date: string | null;
}

function matchIssues(text: string): { category: string; matchedKeywords: string[] }[] {
  const lower = text.toLowerCase();
  const matches: { category: string; matchedKeywords: string[] }[] = [];
  for (const [category, keywords] of Object.entries(ISSUE_KEYWORDS)) {
    const matched = keywords.filter(kw => lower.includes(kw));
    if (matched.length > 0) {
      matches.push({ category, matchedKeywords: matched });
    }
  }
  return matches;
}

function determineConfidence(matchCount: number, sourceType: string): string {
  if (sourceType === 'campaign_finance' || sourceType === 'lobbying_disclosure') {
    return matchCount >= 2 ? 'high' : 'medium';
  }
  if (sourceType === 'government_contract') {
    return matchCount >= 2 ? 'high' : 'medium';
  }
  if (sourceType === 'congress_legislation') {
    return 'high'; // Direct from Congress.gov — highest confidence
  }
  return matchCount >= 3 ? 'medium' : 'low';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(JSON.stringify({ error: 'companyId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[map-issue-signals] Starting issue mapping for company ${companyId}`);

    const { data: companyRow } = await supabase
      .from('companies')
      .select('name, description, industry')
      .eq('id', companyId)
      .single();
    const companyName = companyRow?.name || null;
    const companyDescription = companyRow?.description || '';
    const companyIndustry = companyRow?.industry || '';

    const signals: IssueSignal[] = [];

    function buildSignal(
      category: string,
      matchedKeywords: string[],
      signalType: string,
      sourceDataset: string,
      description: string,
      sourceUrl: string | null,
      amount: number | null,
      transactionDate: string | null,
    ): IssueSignal {
      const subtype = category === 'gun_policy'
        ? classifyGunPolicySubtype(description + ' ' + matchedKeywords.join(' '), signalType)
        : null;

      return {
        entity_id: companyId,
        entity_name_snapshot: companyName,
        issue_category: category,
        signal_type: signalType,
        signal_subtype: subtype,
        source_dataset: sourceDataset,
        description,
        source_url: sourceUrl,
        confidence_score: determineConfidence(matchedKeywords.length, sourceDataset),
        amount,
        transaction_date: transactionDate,
      };
    }

    // ═══════════════════════════════════════════════════════════
    // PRIMARY SOURCE 1: Congress.gov Legislation (HIGHEST priority)
    // PAC recipients → their sponsored bills → policy areas → issue categories
    // This is the "follow the money to the legislation" pipeline.
    // ═══════════════════════════════════════════════════════════
    const { data: congressSignals } = await supabase
      .from('company_signal_scans')
      .select('signal_type, signal_value, raw_excerpt, source_url')
      .eq('company_id', companyId)
      .eq('signal_category', 'congress_cross_reference');

    let legislationSignalsGenerated = 0;

    for (const scan of congressSignals || []) {
      if (!scan.raw_excerpt) continue;

      let parsed: any;
      try { parsed = typeof scan.raw_excerpt === 'string' ? JSON.parse(scan.raw_excerpt) : scan.raw_excerpt; }
      catch { continue; }

      // Extract policy areas from PAC recipients' sponsored legislation
      if (parsed.policy_area_focus) {
        for (const policyItem of parsed.policy_area_focus) {
          const policyArea = policyItem.area;
          const issueCategories = POLICY_AREA_TO_ISSUE[policyArea] || [];

          for (const issueCategory of issueCategories) {
            signals.push({
              entity_id: companyId,
              entity_name_snapshot: companyName,
              issue_category: issueCategory,
              signal_type: 'legislation_sponsorship',
              signal_subtype: 'pac_recipient_legislation',
              source_dataset: 'congress_legislation',
              description: `${policyItem.count} bills in "${policyArea}" sponsored by politicians who received ${companyName} PAC funds`,
              source_url: 'https://www.congress.gov',
              confidence_score: 'high',
              amount: null,
              transaction_date: null,
            });
            legislationSignalsGenerated++;
          }
        }
      }

      // Extract individual bills with policy areas from top recipients
      if (parsed.top_recipients) {
        for (const recipient of parsed.top_recipients) {
          const recipientName = recipient.name;
          const recipientParty = recipient.party;
          const recipientAmount = recipient.amount;
          const recentBill = recipient.recent_bill;

          // Check bill title against keyword mappings
          if (recentBill) {
            const billMatches = matchIssues(recentBill);
            for (const match of billMatches) {
              signals.push({
                entity_id: companyId,
                entity_name_snapshot: companyName,
                issue_category: match.category,
                signal_type: 'legislation_sponsorship',
                signal_subtype: 'pac_recipient_bill',
                source_dataset: 'congress_legislation',
                description: `${recipientName} (${recipientParty}) received $${recipientAmount?.toLocaleString()} from ${companyName} PAC and sponsors: "${recentBill}"`,
                source_url: `https://www.congress.gov/search?q=${encodeURIComponent(recentBill)}&searchResultViewType=expanded`,
                confidence_score: 'high',
                amount: recipientAmount || null,
                transaction_date: null,
              });
              legislationSignalsGenerated++;
            }
          }

          // Map committees to issue areas via keyword matching
          if (recipient.committees) {
            for (const committee of recipient.committees) {
              const committeeMatches = matchIssues(committee);
              for (const match of committeeMatches) {
                signals.push({
                  entity_id: companyId,
                  entity_name_snapshot: companyName,
                  issue_category: match.category,
                  signal_type: 'committee_assignment',
                  signal_subtype: 'pac_recipient_committee',
                  source_dataset: 'congress_legislation',
                  description: `${recipientName} (${recipientParty}) sits on "${committee}" — received $${recipientAmount?.toLocaleString()} from ${companyName} PAC`,
                  source_url: `https://www.congress.gov/member/${recipientName.toLowerCase().replace(/[^a-z]/g, '-')}`,
                  confidence_score: 'high',
                  amount: recipientAmount || null,
                  transaction_date: null,
                });
                legislationSignalsGenerated++;
              }
            }
          }
        }
      }

      // Worker-relevant legislation signal (already computed by sync-congress-votes)
      if (scan.signal_type === 'worker_relevant_legislation' && parsed.bills) {
        for (const bill of parsed.bills) {
          const policyIssues = POLICY_AREA_TO_ISSUE[bill.policy_area] || [];
          for (const issueCategory of policyIssues) {
            signals.push({
              entity_id: companyId,
              entity_name_snapshot: companyName,
              issue_category: issueCategory,
              signal_type: 'legislation_sponsorship',
              signal_subtype: 'worker_relevant_bill',
              source_dataset: 'congress_legislation',
              description: `${bill.sponsor} (${bill.party}) sponsors "${bill.bill_title}" — received ${companyName} PAC funds`,
              source_url: `https://www.congress.gov/search?q=${encodeURIComponent(bill.bill_title)}`,
              confidence_score: 'high',
              amount: null,
              transaction_date: null,
            });
            legislationSignalsGenerated++;
          }
        }
      }
    }

    console.log(`[map-issue-signals] Congress.gov legislation: ${legislationSignalsGenerated} high-confidence signals`);

    // ═══════════════════════════════════════════════════════════
    // PRIMARY SOURCE 2: FEC Campaign Finance (entity_linkages)
    // Direct PAC disbursements and individual donations
    // ═══════════════════════════════════════════════════════════
    const { data: linkages } = await supabase
      .from('entity_linkages')
      .select('source_entity_name, target_entity_name, link_type, description, amount, source_citation, confidence_score')
      .eq('company_id', companyId);

    for (const link of linkages || []) {
      const searchText = [link.description, link.source_entity_name, link.target_entity_name].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      const sourceDataset = link.link_type?.includes('donation') ? 'campaign_finance'
        : link.link_type?.includes('lobbying') ? 'lobbying_disclosure'
        : link.link_type?.includes('contract') ? 'government_contract'
        : 'entity_linkage';

      // Extract source URL from citation JSON
      let sourceUrl: string | null = null;
      if (link.source_citation) {
        try {
          const citations = typeof link.source_citation === 'string' ? JSON.parse(link.source_citation) : link.source_citation;
          if (Array.isArray(citations) && citations[0]?.url) sourceUrl = citations[0].url;
        } catch { /* ignore */ }
      }

      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'keyword_match',
          sourceDataset,
          `${match.matchedKeywords.join(', ')} found in: ${link.description || link.target_entity_name || 'linkage record'}`,
          sourceUrl,
          link.amount || null,
          null,
        ));
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PRIMARY SOURCE 3: Senate LDA Lobbying Records
    // ═══════════════════════════════════════════════════════════
    const { data: lobbying } = await supabase
      .from('company_state_lobbying')
      .select('issues, lobbying_spend, state, year, source')
      .eq('company_id', companyId);

    for (const lob of lobbying || []) {
      const searchText = (lob.issues || []).join(' ');
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'lobbying_issue',
          'lobbying_disclosure',
          `Lobbied on ${match.matchedKeywords.join(', ')} in ${lob.state} (${lob.year})`,
          lob.source || null,
          lob.lobbying_spend || null,
          null,
        ));
      }
    }

    // ═══════════════════════════════════════════════════════════
    // PRIMARY SOURCE 4: USASpending Government Contracts
    // ═══════════════════════════════════════════════════════════
    const { data: contracts } = await supabase
      .from('company_agency_contracts')
      .select('agency_name, contract_description, contract_value, controversy_description, source, contract_id_external')
      .eq('company_id', companyId);

    for (const contract of contracts || []) {
      const searchText = [contract.agency_name, contract.contract_description, contract.controversy_description].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      // Build evidence URL to USASpending
      const contractUrl = contract.contract_id_external
        ? `https://www.usaspending.gov/search/?hash=&keyword=${encodeURIComponent(contract.contract_id_external)}`
        : contract.source || null;

      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'government_contract',
          'government_contract',
          `Contract with ${contract.agency_name}: ${match.matchedKeywords.join(', ')}`,
          contractUrl,
          contract.contract_value || null,
          null,
        ));
      }
    }

    // ═══════════════════════════════════════════════════════════
    // SECONDARY SOURCES (enrichment, not primary evidence)
    // ═══════════════════════════════════════════════════════════

    // ─── Ideology flags ───
    const { data: ideologyFlags } = await supabase
      .from('company_ideology_flags')
      .select('org_name, category, description, amount, evidence_url, severity')
      .eq('company_id', companyId);

    for (const flag of ideologyFlags || []) {
      const searchText = [flag.org_name, flag.category, flag.description].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'ideology_flag',
          'ideology_scan',
          `${flag.org_name}: ${flag.description || match.matchedKeywords.join(', ')}`,
          flag.evidence_url || null,
          flag.amount || null,
          null,
        ));
      }
    }

    // ─── PAC candidates ───
    const { data: candidates } = await supabase
      .from('company_candidates')
      .select('name, party, amount, flag_reason, donation_type')
      .eq('company_id', companyId);

    for (const cand of candidates || []) {
      const searchText = [cand.flag_reason, cand.name, cand.donation_type].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'pac_donation',
          'campaign_finance',
          `PAC donation to ${cand.name} (${cand.party}): ${match.matchedKeywords.join(', ')}`,
          `https://www.fec.gov/data/receipts/?contributor_name=${encodeURIComponent(companyName || '')}`,
          cand.amount || null,
          null,
        ));
      }
    }

    // ─── Public stances ───
    const { data: stances } = await supabase
      .from('company_public_stances')
      .select('topic, public_position, spending_reality, gap')
      .eq('company_id', companyId);

    for (const stance of stances || []) {
      const searchText = [stance.topic, stance.public_position, stance.spending_reality].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'public_stance',
          'public_stance_analysis',
          `Public stance on ${stance.topic}: "${stance.public_position}" vs spending: "${stance.spending_reality}"`,
          null,
          null,
          null,
        ));
      }
    }

    // ─── Company description keyword scan ───
    if (companyDescription || companyIndustry) {
      const searchText = `${companyDescription} ${companyIndustry}`;
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'company_description',
          'company_profile',
          `Company profile mentions: ${match.matchedKeywords.join(', ')}`,
          null,
          null,
          null,
        ));
      }
    }

    // ─── Signal scan records (non-congress — those are handled above) ───
    const { data: signalScans } = await supabase
      .from('company_signal_scans')
      .select('signal_category, signal_type, signal_value, raw_excerpt, source_url')
      .eq('company_id', companyId)
      .neq('signal_category', 'congress_cross_reference'); // Already processed above

    for (const scan of signalScans || []) {
      const searchText = [scan.signal_category, scan.signal_type, scan.signal_value, scan.raw_excerpt].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'signal_scan',
          'company_signal_scan',
          `Signal scan: ${match.matchedKeywords.join(', ')} in ${scan.signal_category}`,
          scan.source_url || null,
          null,
          null,
        ));
      }
    }

    // ─── Known corporate gun policy actions ───
    if (companyName) {
      const lowerName = companyName.toLowerCase();
      for (const entry of KNOWN_GUN_POLICY_ACTIONS) {
        const matched = entry.companies.some(alias => lowerName.includes(alias) || alias.includes(lowerName));
        if (matched) {
          signals.push({
            entity_id: companyId,
            entity_name_snapshot: companyName,
            issue_category: 'gun_policy',
            signal_type: 'corporate_policy_action',
            signal_subtype: entry.subtype,
            source_dataset: 'known_corporate_actions',
            description: entry.action,
            source_url: null,
            confidence_score: 'high',
            amount: null,
            transaction_date: null,
          });
        }
      }
    }

    console.log(`[map-issue-signals] Total signals: ${signals.length} (${legislationSignalsGenerated} from legislation)`);

    if (signals.length > 0) {
      await supabase.from('issue_signals').delete().eq('entity_id', companyId);

      const seen = new Set<string>();
      const unique = signals.filter(s => {
        const key = `${s.issue_category}:${s.signal_subtype || ''}:${s.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const BATCH_SIZE = 100;
      let inserted = 0;
      for (let i = 0; i < unique.length; i += BATCH_SIZE) {
        const batch = unique.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('issue_signals').insert(batch);
        if (error) {
          console.error(`[map-issue-signals] Insert error:`, error);
        } else {
          inserted += batch.length;
        }
      }

      console.log(`[map-issue-signals] Inserted ${inserted} unique issue signals`);
    }

    const categoryCounts: Record<string, number> = {};
    for (const s of signals) {
      categoryCounts[s.issue_category] = (categoryCounts[s.issue_category] || 0) + 1;
    }

    // Count by source for transparency
    const sourceCounts: Record<string, number> = {};
    for (const s of signals) {
      sourceCounts[s.source_dataset] = (sourceCounts[s.source_dataset] || 0) + 1;
    }

    return new Response(JSON.stringify({
      success: true,
      signalsFound: signals.length,
      categoryCounts,
      sourceCounts,
      legislationSignals: legislationSignalsGenerated,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[map-issue-signals] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
