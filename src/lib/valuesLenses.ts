import {
  Heart, Globe, PawPrint, Users, Shield, Leaf, Hammer, Rainbow,
  Vote, ShoppingCart, Stethoscope, Church, Flag, Lock, Bot, Scale,
  Factory, Recycle, Zap, Accessibility, Equal, DollarSign, HardHat,
  Briefcase, GraduationCap, Building2, Eye, Handshake,
} from "lucide-react";

// ── Group definitions for UI sections ──
export const VALUES_GROUPS = [
  {
    key: "social_civil_rights",
    label: "Social & Civil Rights",
    description: "Signals related to equity, inclusion, and civil liberties",
  },
  {
    key: "worker_treatment",
    label: "Worker Treatment",
    description: "How the company treats employees, contractors, and labor",
  },
  {
    key: "environmental_impact",
    label: "Environmental Impact",
    description: "Climate, pollution, sustainability, and energy practices",
  },
  {
    key: "ethical_business",
    label: "Ethical Business Practices",
    description: "Consumer protection, data privacy, AI ethics, and anti-corruption",
  },
  {
    key: "political_activity",
    label: "Public Policy & Political Activity",
    description: "Campaign donations, lobbying, PAC funding, and geopolitical positions",
  },
  {
    key: "lifestyle_personal",
    label: "Lifestyle & Personal Values",
    description: "Faith, animal welfare, healthcare, education, and community",
  },
] as const;

export type ValuesGroupKey = typeof VALUES_GROUPS[number]["key"];

export const VALUES_LENSES = [
  // ── Social & Civil Rights ──
  {
    key: "dei_equity",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Diversity & Workplace Equity",
    icon: Users,
    description: "Whether a company is expanding or pulling back on diversity programs",
    plainExplainer: "We track changes to diversity programs, job page language, and workforce makeup disclosures.",
    signalTypes: ["DEI_rollback_signal", "website_change", "human_capital_disclosure", "corporate_statement", "public_commitment"],
    sourceHints: ["SEC EDGAR", "corporate websites", "public trackers"],
    dataSources: ["SEC EDGAR 10-K filings", "EEO-1 reports", "corporate DEI reports"],
  },
  {
    key: "anti_discrimination",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Anti-Discrimination",
    icon: Shield,
    description: "Company track record on preventing workplace discrimination",
    plainExplainer: "We look at government filings, EEOC cases, and company policies on discrimination.",
    signalTypes: ["human_capital_disclosure", "SEC_disclosure", "corporate_statement", "EEOC_case"],
    sourceHints: ["SEC EDGAR 10-K", "EEOC enforcement database", "corporate policies"],
    dataSources: ["EEOC enforcement database", "SEC EDGAR filings", "federal court records"],
  },
  {
    key: "lgbtq_rights",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "LGBTQ+ Rights",
    icon: Rainbow,
    description: "Company stance on LGBTQ+ issues based on spending and policies",
    plainExplainer: "We check equality scorecards, anti-discrimination policies, and political donations related to LGBTQ+ rights.",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "corporate_statement", "public_commitment"],
    sourceHints: ["HRC Corporate Equality Index", "FEC filings", "corporate policies"],
    dataSources: ["HRC Corporate Equality Index", "FEC filings", "state non-discrimination laws"],
  },
  {
    key: "reproductive_rights",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Reproductive Rights",
    icon: Heart,
    description: "Political spending and lobbying on reproductive healthcare policy",
    plainExplainer: "We follow campaign donations, lobbying reports, and public statements on reproductive health.",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "lobbying disclosures", "corporate statements"],
    dataSources: ["FEC filings", "Senate LDA lobbying disclosures", "corporate benefit policies"],
  },
  {
    key: "voting_rights",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Voting Rights",
    icon: Vote,
    description: "Whether the company supports or opposes voter access efforts",
    plainExplainer: "We check donations and lobbying on voter access, election laws, and voting restrictions.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["FEC filings", "congressional records", "advocacy trackers"],
    dataSources: ["FEC filings", "Senate LDA lobbying database", "congressional voting records"],
  },
  {
    key: "immigration",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Immigration",
    icon: Globe,
    description: "Company spending and lobbying on immigration policy",
    plainExplainer: "We check lobbying records, government contracts, and donations related to immigration law.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["lobbying disclosures", "USASpending", "FEC filings"],
    dataSources: ["Senate LDA lobbying database", "USASpending.gov", "FEC filings"],
  },
  {
    key: "disability_inclusion",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Disability Inclusion",
    icon: Accessibility,
    description: "Accessibility policies, ADA compliance, and disability hiring practices",
    plainExplainer: "We check ADA compliance history, accessibility commitments, and disability hiring programs.",
    signalTypes: ["human_capital_disclosure", "corporate_statement", "EEOC_case"],
    sourceHints: ["EEOC records", "DOJ ADA enforcement", "corporate accessibility pages"],
    dataSources: ["EEOC enforcement database", "DOJ ADA enforcement actions", "SEC workforce disclosures"],
  },
  {
    key: "gender_equality",
    group: "social_civil_rights" as ValuesGroupKey,
    label: "Gender Equality",
    icon: Equal,
    description: "Gender representation in leadership, pay gaps, and parental policies",
    plainExplainer: "We check board composition, executive gender ratios, pay gap disclosures, and parental leave policies.",
    signalTypes: ["human_capital_disclosure", "SEC_disclosure", "corporate_statement"],
    sourceHints: ["SEC proxy filings", "corporate governance reports", "Equileap data"],
    dataSources: ["SEC proxy statements (DEF 14A)", "corporate governance reports", "BLS earnings data"],
  },

  // ── Worker Treatment ──
  {
    key: "labor_rights",
    group: "worker_treatment" as ValuesGroupKey,
    label: "Worker & Labor Rights",
    icon: Hammer,
    description: "How a company treats workers and where they spend money on labor issues",
    plainExplainer: "We look at union activity, worker complaints, wage policies, and lobbying on labor laws.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict", "NLRB_case"],
    sourceHints: ["FEC filings", "NLRB records", "lobbying disclosures"],
    dataSources: ["NLRB case database", "FEC filings", "Senate LDA lobbying disclosures"],
  },
  {
    key: "pay_equity",
    group: "worker_treatment" as ValuesGroupKey,
    label: "Pay Equity",
    icon: DollarSign,
    description: "Compensation fairness, pay gap disclosures, and CEO-worker ratios",
    plainExplainer: "We check SEC pay ratio disclosures, pay gap analyses, and salary transparency practices.",
    signalTypes: ["SEC_disclosure", "pay_gap_signal", "compensation_disclosure"],
    sourceHints: ["SEC proxy filings", "state pay transparency laws", "BLS wage data"],
    dataSources: ["SEC DEF 14A proxy filings", "BLS Occupational Employment Statistics", "state pay transparency filings"],
  },
  {
    key: "workplace_safety",
    group: "worker_treatment" as ValuesGroupKey,
    label: "Workplace Safety",
    icon: HardHat,
    description: "OSHA violations, workplace injury rates, and safety compliance",
    plainExplainer: "We check OSHA violation history, injury rates, and workplace safety enforcement actions.",
    signalTypes: ["OSHA_violation", "workplace_safety_signal", "enforcement_action"],
    sourceHints: ["OSHA enforcement database", "BLS injury data", "MSHA records"],
    dataSources: ["OSHA enforcement database", "BLS Injuries, Illnesses, and Fatalities data", "MSHA records"],
  },
  {
    key: "union_rights",
    group: "worker_treatment" as ValuesGroupKey,
    label: "Union Rights",
    icon: Handshake,
    description: "Union organizing activity, collective bargaining, and anti-union actions",
    plainExplainer: "We check NLRB election filings, unfair labor practice charges, and corporate anti-union campaigns.",
    signalTypes: ["NLRB_case", "union_election", "unfair_labor_practice"],
    sourceHints: ["NLRB case database", "union filings", "news reports"],
    dataSources: ["NLRB election database", "NLRB unfair labor practice filings", "DOL union financial reports"],
  },
  {
    key: "gig_worker_treatment",
    group: "worker_treatment" as ValuesGroupKey,
    label: "Contractor & Gig Worker Treatment",
    icon: Briefcase,
    description: "How the company treats contractors, temps, and gig workers",
    plainExplainer: "We check misclassification lawsuits, contractor policies, and lobbying on gig economy legislation.",
    signalTypes: ["misclassification_signal", "lobbying_filing", "enforcement_action"],
    sourceHints: ["DOL enforcement", "state AG actions", "federal court records"],
    dataSources: ["DOL Wage and Hour Division enforcement", "state attorney general actions", "federal court records"],
  },

  // ── Environmental Impact ──
  {
    key: "environment_climate",
    group: "environmental_impact" as ValuesGroupKey,
    label: "Environment & Climate",
    icon: Leaf,
    description: "Environmental track record, climate commitments, and lobbying on climate",
    plainExplainer: "We check pollution records, climate promises, and lobbying on environmental rules.",
    signalTypes: ["EPA_enforcement", "environmental_compliance_signal", "lobbying_filing", "public_commitment", "corporate_statement"],
    sourceHints: ["EPA records", "CDP disclosures", "lobbying filings"],
    dataSources: ["EPA ECHO enforcement database", "CDP Climate Disclosure", "SEC climate risk filings"],
  },
  {
    key: "pollution_waste",
    group: "environmental_impact" as ValuesGroupKey,
    label: "Pollution & Waste",
    icon: Factory,
    description: "Toxic releases, waste disposal, and pollution violation history",
    plainExplainer: "We check EPA toxic release inventory, waste violations, and Superfund site connections.",
    signalTypes: ["EPA_enforcement", "toxic_release", "waste_violation"],
    sourceHints: ["EPA TRI database", "EPA ECHO", "state environmental agencies"],
    dataSources: ["EPA Toxics Release Inventory (TRI)", "EPA ECHO enforcement database", "EPA Superfund site data"],
  },
  {
    key: "sustainable_supply_chains",
    group: "environmental_impact" as ValuesGroupKey,
    label: "Sustainable Supply Chains",
    icon: Recycle,
    description: "Ethical sourcing, supply chain transparency, and sustainability certifications",
    plainExplainer: "We check supply chain disclosures, fair trade certifications, and human rights watchdog reports.",
    signalTypes: ["supply_chain_signal", "certification", "corporate_statement"],
    sourceHints: ["SEC conflict minerals filings", "Fair Trade certifications", "NGO watchdog reports"],
    dataSources: ["SEC conflict minerals filings (Form SD)", "Know The Chain benchmarks", "Fair Trade certification databases"],
  },
  {
    key: "energy_fossil_fuel",
    group: "environmental_impact" as ValuesGroupKey,
    label: "Energy & Fossil Fuel Policy",
    icon: Zap,
    description: "Fossil fuel investments, renewable energy commitments, and energy lobbying",
    plainExplainer: "We check energy investments, lobbying on energy policy, and renewable commitments.",
    signalTypes: ["lobbying_filing", "SEC_disclosure", "public_commitment", "investment_signal"],
    sourceHints: ["SEC filings", "lobbying disclosures", "CDP disclosures"],
    dataSources: ["SEC 10-K filings", "Senate LDA lobbying database", "CDP Climate Disclosure"],
  },

  // ── Ethical Business Practices ──
  {
    key: "consumer_protection",
    group: "ethical_business" as ValuesGroupKey,
    label: "Consumer Protection",
    icon: ShoppingCart,
    description: "Whether the company lobbies for or against consumer safety rules",
    plainExplainer: "We look at lobbying records and enforcement actions on consumer protection.",
    signalTypes: ["lobbying_filing", "SEC_disclosure", "advocacy_alignment", "FTC_action", "CFPB_complaint"],
    sourceHints: ["lobbying disclosures", "CFPB records", "FTC actions"],
    dataSources: ["FTC enforcement database", "CFPB complaint database", "Senate LDA lobbying disclosures"],
  },
  {
    key: "data_privacy",
    group: "ethical_business" as ValuesGroupKey,
    label: "Data Privacy",
    icon: Lock,
    description: "Data breach history, privacy policies, and surveillance practices",
    plainExplainer: "We check data breach disclosures, FTC privacy actions, and privacy policy strength.",
    signalTypes: ["data_breach", "FTC_action", "privacy_signal", "corporate_statement"],
    sourceHints: ["HHS breach portal", "FTC enforcement", "state AG data breach reports"],
    dataSources: ["HHS data breach portal", "FTC privacy enforcement database", "state attorney general breach notifications"],
  },
  {
    key: "ai_ethics",
    group: "ethical_business" as ValuesGroupKey,
    label: "AI Ethics",
    icon: Bot,
    description: "AI usage in hiring, bias audits, and algorithmic transparency",
    plainExplainer: "We check AI hiring tool disclosures, bias audit compliance, and algorithmic accountability.",
    signalTypes: ["ai_hiring_signal", "bias_audit_signal", "corporate_statement"],
    sourceHints: ["NYC Local Law 144 filings", "EEOC AI guidance", "corporate AI disclosures"],
    dataSources: ["NYC Local Law 144 bias audit filings", "EEOC AI guidance compliance", "corporate AI ethics statements"],
  },
  {
    key: "anti_corruption",
    group: "ethical_business" as ValuesGroupKey,
    label: "Anti-Corruption",
    icon: Eye,
    description: "FCPA violations, bribery cases, and corporate governance integrity",
    plainExplainer: "We check DOJ FCPA enforcement, SEC anti-corruption filings, and corporate integrity agreements.",
    signalTypes: ["FCPA_action", "SEC_enforcement", "DOJ_action"],
    sourceHints: ["DOJ FCPA actions", "SEC enforcement", "World Bank debarment list"],
    dataSources: ["DOJ FCPA enforcement database", "SEC enforcement actions", "World Bank debarment list"],
  },
  {
    key: "political_transparency",
    group: "ethical_business" as ValuesGroupKey,
    label: "Political Spending Transparency",
    icon: Scale,
    description: "How openly the company discloses political spending and lobbying",
    plainExplainer: "We check CPA-Zicklin transparency scores, political spending disclosure policies, and dark money connections.",
    signalTypes: ["transparency_score", "dark_money_signal", "corporate_statement"],
    sourceHints: ["CPA-Zicklin Index", "OpenSecrets", "corporate governance reports"],
    dataSources: ["CPA-Zicklin Index of Corporate Political Disclosure", "OpenSecrets", "SEC proxy statements"],
  },

  // ── Public Policy & Political Activity ──
  {
    key: "political_donations",
    group: "political_activity" as ValuesGroupKey,
    label: "Political Donations",
    icon: DollarSign,
    description: "Where corporate PAC and executive donations go",
    plainExplainer: "We trace PAC contributions and executive donations to specific candidates and committees.",
    signalTypes: ["PAC_donation", "executive_donation", "dark_money_signal"],
    sourceHints: ["FEC filings", "OpenSecrets", "state campaign finance databases"],
    dataSources: ["FEC Committee & Candidate filings", "OpenSecrets", "state campaign finance databases"],
  },
  {
    key: "lobbying_activity",
    group: "political_activity" as ValuesGroupKey,
    label: "Lobbying Activity",
    icon: Building2,
    description: "Federal and state lobbying expenditures and issue areas",
    plainExplainer: "We check Senate LDA filings for lobbying firms, spend amounts, and specific issue areas.",
    signalTypes: ["lobbying_filing", "lobbying_issue", "revolving_door"],
    sourceHints: ["Senate LDA database", "OpenSecrets", "state lobbying databases"],
    dataSources: ["Senate Lobbying Disclosure Act database", "OpenSecrets lobbying data", "state lobbying registries"],
  },
  {
    key: "israel_middle_east",
    group: "political_activity" as ValuesGroupKey,
    label: "Israel & Middle East",
    icon: Flag,
    description: "Political spending and lobbying related to Middle East policy",
    plainExplainer: "We check campaign donations, lobbying records, and public statements on Middle East issues.",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "congressional records", "public statements"],
    dataSources: ["FEC filings", "Senate LDA lobbying database", "congressional voting records"],
  },
  {
    key: "international_trade",
    group: "political_activity" as ValuesGroupKey,
    label: "International Trade & Geopolitics",
    icon: Globe,
    description: "Trade policy positions, sanctions compliance, and geopolitical alignment",
    plainExplainer: "We check lobbying on trade policy, sanctions violations, and international operations.",
    signalTypes: ["lobbying_filing", "OFAC_action", "trade_policy_signal"],
    sourceHints: ["Senate LDA database", "OFAC sanctions list", "BIS export controls"],
    dataSources: ["Senate LDA lobbying database", "OFAC sanctions database", "BIS entity list"],
  },

  // ── Lifestyle & Personal Values ──
  {
    key: "faith_christian",
    group: "lifestyle_personal" as ValuesGroupKey,
    label: "Faith & Religious Values",
    icon: Church,
    description: "Whether company actions align with faith-based values",
    plainExplainer: "We look at where the company sends money and whether those groups support or oppose faith-related causes.",
    signalTypes: ["proxy_voting_signal", "public_commitment", "advocacy_alignment", "corporate_statement"],
    sourceHints: ["Inspire Investing", "shareholder proxy records", "corporate statements"],
    dataSources: ["Inspire Investing ratings", "shareholder proxy records", "EEOC religious accommodation cases"],
  },
  {
    key: "animal_welfare",
    group: "lifestyle_personal" as ValuesGroupKey,
    label: "Animal Welfare",
    icon: PawPrint,
    description: "Animal welfare track record and political spending on animal issues",
    plainExplainer: "We check animal welfare scorecards, donations to related politicians, and industry memberships.",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "trade_association_membership"],
    sourceHints: ["Humane Society Legislative Fund", "FEC filings", "company statements"],
    dataSources: ["Humane Society Legislative Fund scorecard", "FEC filings", "USDA APHIS enforcement"],
  },
  {
    key: "healthcare",
    group: "lifestyle_personal" as ValuesGroupKey,
    label: "Healthcare Access",
    icon: Stethoscope,
    description: "Healthcare lobbying, employee benefits, and drug pricing positions",
    plainExplainer: "We track lobbying on healthcare laws, donations to health policy legislators, and drug pricing advocacy.",
    signalTypes: ["lobbying_filing", "PAC_donation", "SEC_disclosure", "benefits_signal"],
    sourceHints: ["lobbying disclosures", "FEC filings", "SEC filings"],
    dataSources: ["Senate LDA lobbying database", "FEC filings", "CMS Open Payments"],
  },
  {
    key: "education_access",
    group: "lifestyle_personal" as ValuesGroupKey,
    label: "Education Access",
    icon: GraduationCap,
    description: "Education benefits, tuition assistance, and education policy lobbying",
    plainExplainer: "We check education benefits, lobbying on education policy, and foundation grants to education.",
    signalTypes: ["lobbying_filing", "foundation_grant", "corporate_statement", "benefits_signal"],
    sourceHints: ["IRS 990-PF filings", "lobbying disclosures", "corporate benefit pages"],
    dataSources: ["IRS 990-PF foundation filings", "Senate LDA lobbying database", "Department of Education data"],
  },
  {
    key: "community_investment",
    group: "lifestyle_personal" as ValuesGroupKey,
    label: "Community Investment",
    icon: Building2,
    description: "Philanthropy, community development, and local economic impact",
    plainExplainer: "We check foundation giving, community reinvestment, and local hiring and investment patterns.",
    signalTypes: ["foundation_grant", "CRA_signal", "corporate_statement"],
    sourceHints: ["IRS 990-PF filings", "CRA data (for banks)", "corporate social responsibility reports"],
    dataSources: ["IRS 990-PF foundation filings", "FFIEC CRA data", "USASpending.gov place of performance"],
  },
] as const;

export type ValuesLensKey = typeof VALUES_LENSES[number]["key"];

export const SIGNAL_DIRECTION_CONFIG: Record<string, { label: string; plainLabel: string; color: string; bgColor: string }> = {
  alignment_signal: { label: "Alignment", plainLabel: "Supports this issue", color: "text-[hsl(var(--civic-green))]", bgColor: "bg-[hsl(var(--civic-green))]/10" },
  conflict_signal: { label: "Conflict", plainLabel: "Works against this issue", color: "text-[hsl(var(--civic-red))]", bgColor: "bg-[hsl(var(--civic-red))]/10" },
  informational_signal: { label: "Informational", plainLabel: "Related activity found", color: "text-[hsl(var(--civic-blue))]", bgColor: "bg-[hsl(var(--civic-blue))]/10" },
  mixed_signal: { label: "Mixed", plainLabel: "Mixed — goes both ways", color: "text-[hsl(var(--civic-yellow))]", bgColor: "bg-[hsl(var(--civic-yellow))]/10" },
};

export const CONFIDENCE_CONFIG: Record<string, { label: string; plainLabel: string; color: string }> = {
  high: { label: "Strong evidence", plainLabel: "Strong evidence", color: "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]" },
  medium: { label: "Some evidence", plainLabel: "Some evidence", color: "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]" },
  low: { label: "Weak evidence", plainLabel: "Weak evidence", color: "border-[hsl(var(--civic-red))]/30 text-[hsl(var(--civic-red))]" },
};

/** Convert a numeric confidence score (0-1) or string level to plain English */
export function plainConfidence(value: number | string): string {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "high" || lower === "strong") return "Strong evidence";
    if (lower === "medium" || lower === "moderate" || lower === "some") return "Some evidence";
    return "Weak evidence";
  }
  if (value >= 0.8) return "Strong evidence";
  if (value >= 0.5) return "Some evidence";
  return "Weak evidence";
}

/** Get a color class for a confidence level */
export function confidenceColor(value: number | string): string {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "high" || lower === "strong") return "text-primary";
    if (lower === "medium" || lower === "moderate") return "text-accent-foreground";
    return "text-destructive";
  }
  if (value >= 0.8) return "text-primary";
  if (value >= 0.5) return "text-accent-foreground";
  return "text-destructive";
}

export const VERIFICATION_CONFIG: Record<string, { label: string; color: string }> = {
  verified: { label: "Verified", color: "text-[hsl(var(--civic-green))]" },
  partially_verified: { label: "Partially Verified", color: "text-[hsl(var(--civic-yellow))]" },
  unverified: { label: "Unverified", color: "text-muted-foreground" },
};
