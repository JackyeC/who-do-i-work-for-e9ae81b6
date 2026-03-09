const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
// These are well-documented, publicly reported corporate actions.
// Source: Giffords Impact Network, corporate press releases, SEC filings, news reports
const KNOWN_GUN_POLICY_ACTIONS: { companies: string[]; action: string; subtype: string; source: string }[] = [
  // Retailers - product restrictions
  { companies: ["dick's sporting goods", "dicks sporting goods"], action: "Stopped selling assault-style weapons and raised purchase age to 21 (2018)", subtype: "gun_control_signal", source: "Corporate press release / SEC filing" },
  { companies: ["walmart"], action: "Raised minimum age for gun purchases to 21 and discontinued sales of assault-style rifle ammunition (2019)", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["levi strauss", "levi's"], action: "Created $1M fund for gun violence prevention groups and joined Everytown Business Leaders for Gun Safety", subtype: "gun_control_signal", source: "Giffords Impact Network" },
  { companies: ["toms", "toms shoes"], action: "Donated $5M to gun violence prevention organizations", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["rei"], action: "Suspended orders from Vista Outdoor (ammunition/firearms parent company) over gun policy", subtype: "gun_control_signal", source: "Corporate press release" },
  // Financial institutions
  { companies: ["citigroup", "citi"], action: "Requires retail clients to restrict gun sales to those under 21 and mandate background checks", subtype: "gun_control_signal", source: "Corporate policy announcement" },
  { companies: ["bank of america"], action: "Stopped lending to manufacturers of military-style rifles for civilian use", subtype: "gun_control_signal", source: "Corporate press release" },
  { companies: ["amalgamated bank"], action: "Active supporter of gun safety legislation and Giffords Impact Network member", subtype: "gun_control_signal", source: "Giffords Impact Network" },
  // Technology
  { companies: ["salesforce"], action: "Banned customers from using Salesforce Commerce Cloud to sell certain weapons and accessories", subtype: "gun_control_signal", source: "Salesforce Acceptable Use Policy" },
  { companies: ["uber"], action: "Prohibits riders and drivers from carrying firearms during trips", subtype: "gun_control_signal", source: "Corporate policy" },
  // Open carry prohibitions (retailers)
  { companies: ["albertsons"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["aldi"], action: "Prohibits open carry of firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["cvs", "cvs health"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["kroger"], action: "Requested customers not openly carry firearms in stores and ceased gun/ammo sales in Alaska", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["meijer"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["publix"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["walgreens"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate statement" },
  { companies: ["wegmans"], action: "Requested customers not openly carry firearms in stores", subtype: "gun_control_signal", source: "Corporate policy" },
  { companies: ["subway"], action: "Prohibits open carry of firearms in restaurants", subtype: "gun_control_signal", source: "Corporate policy" },
  // Healthcare / Other
  { companies: ["northwell health"], action: "Major healthcare system actively treating gun violence as a public health crisis", subtype: "gun_control_signal", source: "Corporate program announcement" },
  { companies: ["royal caribbean", "royal caribbean cruises"], action: "Signed letters supporting background check legislation", subtype: "gun_control_signal", source: "Giffords Impact Network" },
  { companies: ["lyft"], action: "Prohibits firearms during rides and donated to March for Our Lives", subtype: "gun_control_signal", source: "Corporate policy / press release" },
  // Gun rights / pro-2A companies
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

  for (const org of GUN_RIGHTS_ORGS) {
    if (lower.includes(org)) return 'gun_rights_signal';
  }
  for (const org of GUN_CONTROL_ORGS) {
    if (lower.includes(org)) return 'gun_control_signal';
  }
  for (const kw of FIREARM_INDUSTRY_KEYWORDS) {
    if (lower.includes(kw)) return 'firearm_industry_signal';
  }

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

    // Fetch company name + description for snapshot
    const { data: companyRow } = await supabase
      .from('companies')
      .select('name, description, industry')
      .eq('id', companyId)
      .single();
    const companyName = companyRow?.name || null;
    const companyDescription = companyRow?.description || '';
    const companyIndustry = companyRow?.industry || '';

    const signals: IssueSignal[] = [];

    // Helper to build signal with gun subtype
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

    // ─── Source 1: Entity linkages ───
    const { data: linkages } = await supabase
      .from('entity_linkages')
      .select('source_entity_name, target_entity_name, link_type, description, amount, source_url, confidence_score')
      .eq('company_id', companyId);

    for (const link of linkages || []) {
      const searchText = [link.description, link.source_entity_name, link.target_entity_name].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      const sourceDataset = link.link_type?.includes('donation') ? 'campaign_finance'
        : link.link_type?.includes('lobbying') ? 'lobbying_disclosure'
        : link.link_type?.includes('contract') ? 'government_contract'
        : 'entity_linkage';

      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'keyword_match',
          sourceDataset,
          `${match.matchedKeywords.join(', ')} found in: ${link.description || link.target_entity_name || 'linkage record'}`,
          link.source_url || null,
          link.amount || null,
          null,
        ));
      }
    }

    // ─── Source 2: Lobbying records ───
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

    // ─── Source 3: Ideology flags ───
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

    // ─── Source 4: PAC candidates ───
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
          null,
          cand.amount || null,
          null,
        ));
      }
    }

    // ─── Source 5: Government contracts ───
    const { data: contracts } = await supabase
      .from('company_agency_contracts')
      .select('agency_name, contract_description, contract_value, controversy_description, source')
      .eq('company_id', companyId);

    for (const contract of contracts || []) {
      const searchText = [contract.agency_name, contract.contract_description, contract.controversy_description].filter(Boolean).join(' ');
      const matches = matchIssues(searchText);
      for (const match of matches) {
        signals.push(buildSignal(
          match.category,
          match.matchedKeywords,
          'government_contract',
          'government_contract',
          `Contract with ${contract.agency_name}: ${match.matchedKeywords.join(', ')}`,
          contract.source || null,
          contract.contract_value || null,
          null,
        ));
      }
    }

    // ─── Source 6: Public stances ───
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

    // ─── Source 7: Company description keyword scan ───
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

    // ─── Source 8: Signal scan records ───
    const { data: signalScans } = await supabase
      .from('company_signal_scans')
      .select('signal_category, signal_type, signal_value, raw_excerpt, source_url')
      .eq('company_id', companyId);

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

    // ─── Source 9: Known corporate gun policy actions ───
    // Match company name against reference database of documented corporate gun policy positions
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

    console.log(`[map-issue-signals] Found ${signals.length} issue signals for company ${companyId}`);

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

    return new Response(JSON.stringify({
      success: true,
      signalsFound: signals.length,
      categoryCounts,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[map-issue-signals] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
