/**
 * Canned report templates for Intelligence Reports.
 * Each template pre-fills the report fields, sections, and claims
 * following the platform's signal-based reporting philosophy.
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  report: {
    title: string;
    subtitle: string;
    report_type: string;
    primary_issue_category: string;
    confidence_level: string;
    verification_status: string;
    executive_summary: string;
    hero_quote: string;
    issue_categories_json: string[];
  };
  sections: Array<{
    section_order: number;
    section_title: string;
    section_subtitle?: string;
    section_summary: string;
    full_section_text: string;
    issue_category?: string;
    confidence_level: string;
    verification_status: string;
  }>;
  claims: Array<{
    claim_order: number;
    claim_title: string;
    claim_text: string;
    claim_type: string;
    confidence_level: string;
    verification_status: string;
    evidence_required: boolean;
  }>;
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "dei-rollback",
    name: "Company DEI Rollback",
    description: "Document when a company scales back diversity, equity, or inclusion initiatives. Tracks public statements, program changes, and workforce impact signals.",
    icon: "🔄",
    report: {
      title: "[Company Name]: DEI Program Changes — Signal Timeline",
      subtitle: "Tracking observable shifts in diversity commitments and workforce equity programs",
      report_type: "intelligence_report",
      primary_issue_category: "dei_rollback",
      confidence_level: "medium",
      verification_status: "analysis_with_linked_evidence",
      executive_summary: "[Company Name] has made observable changes to its diversity, equity, and inclusion programs. This report documents the timeline of public statements, organizational restructuring, and workforce-facing policy shifts detected from publicly available sources.\n\nKey signals include: [list 2-3 key observations]\n\nThis report presents documented observations — not conclusions about intent or legality.",
      hero_quote: "",
      issue_categories_json: ["dei_rollback", "workforce_equity", "corporate_governance"],
    },
    sections: [
      {
        section_order: 0,
        section_title: "Timeline of Observable Changes",
        section_summary: "Chronological documentation of public DEI-related actions and announcements.",
        full_section_text: "Document each observable change with date, source, and description:\n\n• [Date]: [Description of change] — Source: [URL]\n• [Date]: [Description of change] — Source: [URL]",
        issue_category: "dei_rollback",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
      },
      {
        section_order: 1,
        section_title: "Public Statements & Corporate Communications",
        section_summary: "Official company statements regarding diversity program changes.",
        full_section_text: "Collect and present direct quotes from earnings calls, press releases, SEC filings, and executive communications.\n\n[Insert quotes with attribution and date]",
        issue_category: "dei_rollback",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
      },
      {
        section_order: 2,
        section_title: "Workforce & Organizational Signals",
        section_summary: "Changes to DEI-related roles, departments, or reporting structures detected from job postings, LinkedIn data, and organizational disclosures.",
        full_section_text: "Document observable signals:\n\n• Chief Diversity Officer role status\n• DEI team headcount changes\n• Employee Resource Group activity\n• Diversity report publication status\n• EEO-1 disclosure changes",
        issue_category: "workforce_equity",
        confidence_level: "medium",
        verification_status: "partially_verified",
      },
      {
        section_order: 3,
        section_title: "Industry & Peer Context",
        section_subtitle: "How this compares to sector-wide trends",
        section_summary: "Contextualizing the company's actions within broader industry patterns.",
        full_section_text: "Compare against peer companies in the same sector. Note whether changes are isolated or part of a broader industry pattern.\n\n[Insert peer comparison data]",
        issue_category: "dei_rollback",
        confidence_level: "low",
        verification_status: "analysis_with_linked_evidence",
      },
    ],
    claims: [
      {
        claim_order: 0,
        claim_title: "DEI Program Structure Change Detected",
        claim_text: "[Company] has made observable changes to its DEI organizational structure as documented in [source type].",
        claim_type: "factual_claim",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
        evidence_required: true,
      },
      {
        claim_order: 1,
        claim_title: "Public Commitment Shift",
        claim_text: "Language in [Company]'s public communications shows a shift from [previous framing] to [current framing] regarding diversity initiatives.",
        claim_type: "pattern_claim",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
        evidence_required: true,
      },
    ],
  },
  {
    id: "labor-violation",
    name: "Labor Violation Brief",
    description: "Document WARN notices, wage theft findings, NLRB complaints, or OSHA violations. Sources from public agency filings and court records.",
    icon: "⚖️",
    report: {
      title: "[Company Name]: Labor Compliance Signal Brief",
      subtitle: "Documented signals from WARN filings, wage enforcement actions, and labor board complaints",
      report_type: "issue_audit",
      primary_issue_category: "labor_violations",
      confidence_level: "high",
      verification_status: "fully_verified",
      executive_summary: "This brief documents labor compliance signals detected from public agency filings for [Company Name]. All data points are sourced from official government records including WARN Act notices, Department of Labor enforcement actions, NLRB case filings, and OSHA inspection reports.\n\nKey findings:\n• [Number] WARN notices filed affecting [number] workers\n• [Dollar amount] in wage enforcement recoveries\n• [Number] active NLRB complaints\n\nAll signals sourced from public records — no proprietary data used.",
      hero_quote: "",
      issue_categories_json: ["labor_violations", "wage_theft", "worker_safety", "union_activity"],
    },
    sections: [
      {
        section_order: 0,
        section_title: "WARN Act Filings",
        section_summary: "Worker Adjustment and Retraining Notification Act filings from state labor departments.",
        full_section_text: "Document each WARN filing:\n\n| Date Filed | Location | Workers Affected | Layoff Type | Source |\n|---|---|---|---|---|\n| [Date] | [City, State] | [Number] | [Permanent/Temporary] | [State DOL URL] |",
        issue_category: "warn_notices",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
      {
        section_order: 1,
        section_title: "Wage & Hour Enforcement Actions",
        section_summary: "Department of Labor Wage and Hour Division findings and recoveries.",
        full_section_text: "Document WHD enforcement actions:\n\n• Case ID: [WHD case number]\n• Violation type: [FLSA, state wage law, etc.]\n• Back wages recovered: $[amount]\n• Workers affected: [number]\n• Source: DOL enforcement database",
        issue_category: "wage_theft",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
      {
        section_order: 2,
        section_title: "NLRB Complaints & Filings",
        section_summary: "National Labor Relations Board case activity.",
        full_section_text: "Document NLRB activity:\n\n• Case number: [NLRB case ID]\n• Filing type: [ULP charge, representation petition, etc.]\n• Status: [Open/Closed/Settled]\n• Allegation summary: [Brief description]\n• Source: NLRB case database",
        issue_category: "union_activity",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
      {
        section_order: 3,
        section_title: "OSHA Inspection & Citation History",
        section_summary: "Occupational Safety and Health Administration inspection records.",
        full_section_text: "Document OSHA activity:\n\n• Inspection number: [ID]\n• Inspection type: [Planned/Complaint/Referral]\n• Violations found: [Serious/Willful/Repeat]\n• Penalties assessed: $[amount]\n• Source: OSHA inspection database",
        issue_category: "worker_safety",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
    ],
    claims: [
      {
        claim_order: 0,
        claim_title: "WARN Filing Pattern Detected",
        claim_text: "[Company] has filed [number] WARN notices in [time period], affecting approximately [number] workers across [number] locations.",
        claim_type: "factual_claim",
        confidence_level: "high",
        verification_status: "fully_verified",
        evidence_required: true,
      },
      {
        claim_order: 1,
        claim_title: "Wage Recovery Action",
        claim_text: "The Department of Labor recovered $[amount] in back wages from [Company] for [number] workers in [year].",
        claim_type: "factual_claim",
        confidence_level: "high",
        verification_status: "fully_verified",
        evidence_required: true,
      },
    ],
  },
  {
    id: "political-spending",
    name: "Political Spending Analysis",
    description: "Analyze PAC donations, lobbying expenditures, dark money connections, and legislative alignment. Sources from FEC, Senate LDA, and OpenSecrets.",
    icon: "🏛️",
    report: {
      title: "[Company Name]: Political Spending & Influence Map",
      subtitle: "Follow the Money — PAC contributions, lobbying expenditures, and legislative alignment",
      report_type: "intelligence_report",
      primary_issue_category: "political_spending",
      confidence_level: "high",
      verification_status: "analysis_with_linked_evidence",
      executive_summary: "This report maps the political spending and influence network of [Company Name] using publicly available FEC filings, Senate Lobbying Disclosure Act records, and corporate PAC disclosures.\n\nKey data points:\n• Total PAC spending: $[amount] ([election cycle])\n• Lobbying expenditures: $[amount] ([time period])\n• [Number] registered lobbyists across [number] firms\n• Key legislative focus areas: [list areas]\n\nAll financial data sourced from official disclosure filings.",
      hero_quote: "",
      issue_categories_json: ["political_spending", "lobbying", "dark_money", "legislative_alignment"],
    },
    sections: [
      {
        section_order: 0,
        section_title: "PAC Contributions — Follow the Money",
        section_summary: "Federal Election Commission data on corporate PAC disbursements to candidates and committees.",
        full_section_text: "Document PAC spending from FEC filings:\n\n**Top Recipients:**\n| Candidate/Committee | Party | Amount | Election Cycle | Source |\n|---|---|---|---|---|\n| [Name] | [R/D] | $[Amount] | [Cycle] | FEC Filing |\n\n**Party Split:** [X]% Republican, [Y]% Democratic\n**Total Disbursements:** $[Amount]",
        issue_category: "political_spending",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
      {
        section_order: 1,
        section_title: "Lobbying Expenditures — Follow the Influence",
        section_summary: "Senate LDA disclosure data on lobbying spending and issue areas.",
        full_section_text: "Document lobbying activity:\n\n**Registered Lobbying Firms:**\n• [Firm name] — $[Amount] ([Year])\n\n**Issue Areas Lobbied:**\n• [Issue code]: [Description]\n\n**Notable Bills Lobbied:**\n• [Bill number]: [Bill title] — Position: [For/Against/Monitor]",
        issue_category: "lobbying",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
      {
        section_order: 2,
        section_title: "Dark Money & Trade Association Connections",
        section_summary: "Connections to 501(c)(4) organizations, trade associations, and non-disclosing political entities.",
        full_section_text: "Document connections to non-disclosing entities:\n\n• Trade association memberships: [List]\n• 501(c)(4) connections: [List with evidence]\n• Chamber of Commerce activity: [Details]\n\nNote: Dark money connections are inherently harder to verify. Confidence levels reflect the evidence chain.",
        issue_category: "dark_money",
        confidence_level: "medium",
        verification_status: "partially_verified",
      },
      {
        section_order: 3,
        section_title: "Legislative Alignment Analysis — Follow the Policy",
        section_summary: "Mapping company lobbying positions against legislative outcomes and recipient voting records.",
        full_section_text: "Cross-reference lobbying positions with recipient voting records:\n\n| Bill | Company Position | PAC Recipient Vote | Alignment |\n|---|---|---|---|\n| [Bill] | [For/Against] | [Yes/No] | [Aligned/Misaligned] |\n\nThis section analyzes whether PAC recipients vote in alignment with the company's lobbied positions.",
        issue_category: "legislative_alignment",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
      },
    ],
    claims: [
      {
        claim_order: 0,
        claim_title: "PAC Spending Volume",
        claim_text: "[Company]'s corporate PAC disbursed $[amount] during the [cycle] election cycle, with [X]% directed to [party] candidates.",
        claim_type: "factual_claim",
        confidence_level: "high",
        verification_status: "fully_verified",
        evidence_required: true,
      },
      {
        claim_order: 1,
        claim_title: "Lobbying Focus Area",
        claim_text: "[Company] spent $[amount] lobbying on [issue area] in [year], making it their [top/second/third] lobbying priority by expenditure.",
        claim_type: "factual_claim",
        confidence_level: "high",
        verification_status: "fully_verified",
        evidence_required: true,
      },
      {
        claim_order: 2,
        claim_title: "Legislative Alignment Pattern",
        claim_text: "[X] of [Y] PAC recipients voted in alignment with [Company]'s lobbied positions on [issue area] legislation.",
        claim_type: "pattern_claim",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
        evidence_required: true,
      },
    ],
  },
  {
    id: "executive-accountability",
    name: "Executive Accountability",
    description: "Document leadership changes, revolving door connections, board interlocks, and executive political activity. Sources from SEC filings, FEC records, and corporate disclosures.",
    icon: "👔",
    report: {
      title: "[Company Name]: Executive & Board Accountability Profile",
      subtitle: "Leadership changes, revolving door connections, and board-level political influence signals",
      report_type: "company_alignment_report",
      primary_issue_category: "executive_accountability",
      confidence_level: "medium",
      verification_status: "analysis_with_linked_evidence",
      executive_summary: "This report profiles the executive leadership and board composition of [Company Name], documenting revolving door connections, interlocking directorates, personal political activity, and governance signals detected from public filings.\n\nKey observations:\n• [Number] executive changes in [time period]\n• [Number] revolving door connections to government agencies\n• [Number] board interlocks with other major employers\n\nAll data sourced from SEC filings, FEC records, and corporate proxy statements.",
      hero_quote: "",
      issue_categories_json: ["executive_accountability", "revolving_door", "board_governance", "political_spending"],
    },
    sections: [
      {
        section_order: 0,
        section_title: "Leadership Changes Timeline",
        section_summary: "C-suite and senior leadership transitions documented from SEC filings and corporate announcements.",
        full_section_text: "Document leadership changes:\n\n| Date | Executive | Previous Role | New Role/Status | Source |\n|---|---|---|---|---|\n| [Date] | [Name] | [Title] | [Departed/Appointed/Reassigned] | [SEC filing/Press release] |\n\nNote patterns: frequency of changes, whether roles are backfilled, interim appointments.",
        issue_category: "executive_accountability",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
      {
        section_order: 1,
        section_title: "Revolving Door Connections",
        section_summary: "Executives and board members with prior or subsequent government agency roles.",
        full_section_text: "Document revolving door connections:\n\n• [Name]: [Company Title] → previously [Government Role] at [Agency] ([Years])\n• [Name]: [Government Role] at [Agency] → joined [Company] as [Title] ([Year])\n\nInclude advisory committee appointments, regulatory agency alumni, and congressional staff connections.",
        issue_category: "revolving_door",
        confidence_level: "medium",
        verification_status: "partially_verified",
      },
      {
        section_order: 2,
        section_title: "Board Interlocks & Shared Directorates",
        section_summary: "Board members serving simultaneously on boards of other major companies, trade associations, or political organizations.",
        full_section_text: "Document interlocking directorates:\n\n| Board Member | Role at [Company] | Other Board(s) | Overlap Type |\n|---|---|---|---|\n| [Name] | [Title] | [Other company/org] | [Industry peer/Trade assoc./Nonprofit] |\n\nHighlight connections to companies in the same industry, major trade associations, and politically active nonprofits.",
        issue_category: "board_governance",
        confidence_level: "medium",
        verification_status: "analysis_with_linked_evidence",
      },
      {
        section_order: 3,
        section_title: "Executive Personal Political Activity",
        section_summary: "FEC-documented personal political donations from named executives and board members.",
        full_section_text: "Document personal political contributions from FEC individual contributor filings:\n\n| Executive | Title | Recipient | Amount | Date | Source |\n|---|---|---|---|---|---|\n| [Name] | [Title] | [Candidate/Committee] | $[Amount] | [Date] | FEC Filing |\n\nNote: Personal contributions reflect individual choices and are distinct from corporate PAC activity.",
        issue_category: "political_spending",
        confidence_level: "high",
        verification_status: "fully_verified",
      },
    ],
    claims: [
      {
        claim_order: 0,
        claim_title: "Executive Turnover Pattern",
        claim_text: "[Company] has had [number] C-suite departures in [time period], including [key roles].",
        claim_type: "factual_claim",
        confidence_level: "high",
        verification_status: "fully_verified",
        evidence_required: true,
      },
      {
        claim_order: 1,
        claim_title: "Revolving Door Connection",
        claim_text: "[Name], currently [Title] at [Company], previously served as [Government Role] at [Agency], which has regulatory oversight of [Company]'s industry.",
        claim_type: "factual_claim",
        confidence_level: "medium",
        verification_status: "partially_verified",
        evidence_required: true,
      },
    ],
  },
];
