import {
  Heart, Globe, PawPrint, Users, Shield, Leaf, Hammer, Rainbow,
  Vote, ShoppingCart, Stethoscope, Church, Flag, Lock, Bot, Scale,
  Factory, Recycle, Zap, Accessibility, Equal, DollarSign, HardHat,
  Briefcase, GraduationCap, Building2, Eye, Handshake,
  TrendingUp, Award, Layers, UserCheck, Megaphone,
} from "lucide-react";

// ── Group definitions — workplace-oriented, neutral categories ──
export const VALUES_GROUPS = [
  {
    key: "workplace_experience",
    label: "Workplace Experience",
    description: "How companies treat employees day-to-day — culture, inclusion, and safety",
  },
  {
    key: "compensation_conditions",
    label: "Compensation & Work Conditions",
    description: "Pay practices, benefits, and how fairly workers are compensated",
  },
  {
    key: "leadership_governance",
    label: "Leadership & Decision-Making",
    description: "How leadership operates, who has power, and how transparent decisions are",
  },
  {
    key: "corporate_behavior",
    label: "Corporate Behavior",
    description: "How the company acts in the world — lobbying, spending, and public commitments",
  },
  {
    key: "business_impact",
    label: "Business Impact",
    description: "Environmental footprint, supply chain practices, and community effects",
  },
  {
    key: "personal_alignment",
    label: "Personal Alignment",
    description: "Optional — values that matter to you personally when choosing where to work",
  },
] as const;

export type ValuesGroupKey = typeof VALUES_GROUPS[number]["key"];

export const VALUES_LENSES = [
  // ── Workplace Experience ──
  {
    key: "dei_equity",
    group: "workplace_experience" as ValuesGroupKey,
    label: "Inclusive Workplace Practices",
    icon: Users,
    description: "Whether a company is expanding or pulling back on inclusion programs",
    plainExplainer: "We track changes to inclusion programs, job page language, and workforce makeup disclosures.",
    signalTypes: ["DEI_rollback_signal", "website_change", "human_capital_disclosure", "corporate_statement", "public_commitment"],
    sourceHints: ["SEC EDGAR", "corporate websites", "public trackers"],
    dataSources: ["SEC EDGAR 10-K filings", "EEO-1 reports", "corporate inclusion reports"],
  },
  {
    key: "anti_discrimination",
    group: "workplace_experience" as ValuesGroupKey,
    label: "Fair Treatment & Non-Discrimination",
    icon: Shield,
    description: "Company track record on preventing workplace discrimination",
    plainExplainer: "We look at government filings, EEOC cases, and company policies on discrimination.",
    signalTypes: ["human_capital_disclosure", "SEC_disclosure", "corporate_statement", "EEOC_case"],
    sourceHints: ["SEC EDGAR 10-K", "EEOC enforcement database", "corporate policies"],
    dataSources: ["EEOC enforcement database", "SEC EDGAR filings", "federal court records"],
  },
  {
    key: "lgbtq_rights",
    group: "workplace_experience" as ValuesGroupKey,
    label: "LGBTQ+ Workplace Inclusion",
    icon: Rainbow,
    description: "Workplace policies and benefits supporting LGBTQ+ employees",
    plainExplainer: "We check equality scorecards, non-discrimination policies, and benefits for LGBTQ+ employees.",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "corporate_statement", "public_commitment"],
    sourceHints: ["HRC Corporate Equality Index", "FEC filings", "corporate policies"],
    dataSources: ["HRC Corporate Equality Index", "FEC filings", "state non-discrimination laws"],
  },
  {
    key: "disability_inclusion",
    group: "workplace_experience" as ValuesGroupKey,
    label: "Accessibility & Disability Support",
    icon: Accessibility,
    description: "Accessibility policies, ADA compliance, and disability hiring practices",
    plainExplainer: "We check ADA compliance history, accessibility commitments, and disability hiring programs.",
    signalTypes: ["human_capital_disclosure", "corporate_statement", "EEOC_case"],
    sourceHints: ["EEOC records", "DOJ ADA enforcement", "corporate accessibility pages"],
    dataSources: ["EEOC enforcement database", "DOJ ADA enforcement actions", "SEC workforce disclosures"],
  },
  {
    key: "gender_equality",
    group: "workplace_experience" as ValuesGroupKey,
    label: "Gender Equity in the Workplace",
    icon: Equal,
    description: "Gender representation in leadership, pay gaps, and parental policies",
    plainExplainer: "We check board composition, executive gender ratios, pay gap disclosures, and parental leave policies.",
    signalTypes: ["human_capital_disclosure", "SEC_disclosure", "corporate_statement"],
    sourceHints: ["SEC proxy filings", "corporate governance reports", "Equileap data"],
    dataSources: ["SEC proxy statements (DEF 14A)", "corporate governance reports", "BLS earnings data"],
  },
  {
    key: "workplace_safety",
    group: "workplace_experience" as ValuesGroupKey,
    label: "Workplace Safety Standards",
    icon: HardHat,
    description: "OSHA violations, workplace injury rates, and safety compliance",
    plainExplainer: "We check OSHA violation history, injury rates, and workplace safety enforcement actions.",
    signalTypes: ["OSHA_violation", "workplace_safety_signal", "enforcement_action"],
    sourceHints: ["OSHA enforcement database", "BLS injury data", "MSHA records"],
    dataSources: ["OSHA enforcement database", "BLS Injuries, Illnesses, and Fatalities data", "MSHA records"],
  },

  // ── Compensation & Work Conditions ──
  {
    key: "pay_equity",
    group: "compensation_conditions" as ValuesGroupKey,
    label: "Pay Fairness & Transparency",
    icon: DollarSign,
    description: "Compensation fairness, pay gap disclosures, and CEO-worker ratios",
    plainExplainer: "We check SEC pay ratio disclosures, pay gap analyses, and salary transparency practices.",
    signalTypes: ["SEC_disclosure", "pay_gap_signal", "compensation_disclosure"],
    sourceHints: ["SEC proxy filings", "state pay transparency laws", "BLS wage data"],
    dataSources: ["SEC DEF 14A proxy filings", "BLS Occupational Employment Statistics", "state pay transparency filings"],
  },
  {
    key: "labor_rights",
    group: "compensation_conditions" as ValuesGroupKey,
    label: "Worker Rights & Protections",
    icon: Hammer,
    description: "How a company treats workers and where they spend money on labor issues",
    plainExplainer: "We look at union activity, worker complaints, wage policies, and lobbying on labor laws.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict", "NLRB_case"],
    sourceHints: ["FEC filings", "NLRB records", "lobbying disclosures"],
    dataSources: ["NLRB case database", "FEC filings", "Senate LDA lobbying disclosures"],
  },
  {
    key: "union_rights",
    group: "compensation_conditions" as ValuesGroupKey,
    label: "Collective Bargaining & Organizing",
    icon: Handshake,
    description: "Union organizing activity, collective bargaining, and worker organizing history",
    plainExplainer: "We check NLRB election filings, unfair labor practice charges, and corporate organizing responses.",
    signalTypes: ["NLRB_case", "union_election", "unfair_labor_practice"],
    sourceHints: ["NLRB case database", "union filings", "news reports"],
    dataSources: ["NLRB election database", "NLRB unfair labor practice filings", "DOL union financial reports"],
  },
  {
    key: "gig_worker_treatment",
    group: "compensation_conditions" as ValuesGroupKey,
    label: "Contractor & Flexible Worker Treatment",
    icon: Briefcase,
    description: "How the company treats contractors, temps, and flexible workers",
    plainExplainer: "We check misclassification lawsuits, contractor policies, and lobbying on gig economy legislation.",
    signalTypes: ["misclassification_signal", "lobbying_filing", "enforcement_action"],
    sourceHints: ["DOL enforcement", "state AG actions", "federal court records"],
    dataSources: ["DOL Wage and Hour Division enforcement", "state attorney general actions", "federal court records"],
  },
  {
    key: "healthcare",
    group: "compensation_conditions" as ValuesGroupKey,
    label: "Healthcare & Benefits Support",
    icon: Stethoscope,
    description: "Healthcare benefits quality, coverage breadth, and employee support programs",
    plainExplainer: "We track benefits disclosures, healthcare spending lobbying, and employee benefit program quality.",
    signalTypes: ["lobbying_filing", "PAC_donation", "SEC_disclosure", "benefits_signal"],
    sourceHints: ["lobbying disclosures", "FEC filings", "SEC filings"],
    dataSources: ["Senate LDA lobbying database", "FEC filings", "CMS Open Payments"],
  },
  {
    key: "reproductive_rights",
    group: "compensation_conditions" as ValuesGroupKey,
    label: "Reproductive Healthcare Coverage",
    icon: Heart,
    description: "Employee benefits and company positions related to reproductive healthcare",
    plainExplainer: "We follow benefit policies, lobbying reports, and public statements on reproductive healthcare coverage.",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "lobbying disclosures", "corporate statements"],
    dataSources: ["FEC filings", "Senate LDA lobbying disclosures", "corporate benefit policies"],
  },

  // ── Leadership & Decision-Making ──
  {
    key: "political_transparency",
    group: "leadership_governance" as ValuesGroupKey,
    label: "Spending & Decision Transparency",
    icon: Scale,
    description: "How openly the company discloses spending and governance decisions",
    plainExplainer: "We check transparency scores, spending disclosure policies, and governance openness.",
    signalTypes: ["transparency_score", "dark_money_signal", "corporate_statement"],
    sourceHints: ["CPA-Zicklin Index", "OpenSecrets", "corporate governance reports"],
    dataSources: ["CPA-Zicklin Index of Corporate Political Disclosure", "OpenSecrets", "SEC proxy statements"],
  },
  {
    key: "anti_corruption",
    group: "leadership_governance" as ValuesGroupKey,
    label: "Ethical Leadership & Integrity",
    icon: Eye,
    description: "Corporate integrity, anti-bribery compliance, and governance quality",
    plainExplainer: "We check DOJ enforcement, SEC anti-corruption filings, and corporate integrity agreements.",
    signalTypes: ["FCPA_action", "SEC_enforcement", "DOJ_action"],
    sourceHints: ["DOJ FCPA actions", "SEC enforcement", "World Bank debarment list"],
    dataSources: ["DOJ FCPA enforcement database", "SEC enforcement actions", "World Bank debarment list"],
  },
  {
    key: "ai_ethics",
    group: "leadership_governance" as ValuesGroupKey,
    label: "AI & Automation Practices",
    icon: Bot,
    description: "AI usage in hiring, bias audits, and algorithmic transparency",
    plainExplainer: "We check AI hiring tool disclosures, bias audit compliance, and algorithmic accountability.",
    signalTypes: ["ai_hiring_signal", "bias_audit_signal", "corporate_statement"],
    sourceHints: ["NYC Local Law 144 filings", "EEOC AI guidance", "corporate AI disclosures"],
    dataSources: ["NYC Local Law 144 bias audit filings", "EEOC AI guidance compliance", "corporate AI ethics statements"],
  },
  {
    key: "data_privacy",
    group: "leadership_governance" as ValuesGroupKey,
    label: "Data Privacy & Employee Trust",
    icon: Lock,
    description: "Data breach history, privacy policies, and surveillance practices",
    plainExplainer: "We check data breach disclosures, FTC privacy actions, and privacy policy strength.",
    signalTypes: ["data_breach", "FTC_action", "privacy_signal", "corporate_statement"],
    sourceHints: ["HHS breach portal", "FTC enforcement", "state AG data breach reports"],
    dataSources: ["HHS data breach portal", "FTC privacy enforcement database", "state attorney general breach notifications"],
  },

  // ── Corporate Behavior ──
  {
    key: "political_donations",
    group: "corporate_behavior" as ValuesGroupKey,
    label: "Corporate Political Activity",
    icon: Megaphone,
    description: "Where corporate PAC and leadership donations go",
    plainExplainer: "We trace PAC contributions and executive donations to specific candidates and committees.",
    signalTypes: ["PAC_donation", "executive_donation", "dark_money_signal"],
    sourceHints: ["FEC filings", "OpenSecrets", "state campaign finance databases"],
    dataSources: ["FEC Committee & Candidate filings", "OpenSecrets", "state campaign finance databases"],
  },
  {
    key: "lobbying_activity",
    group: "corporate_behavior" as ValuesGroupKey,
    label: "Government Influence & Lobbying",
    icon: Building2,
    description: "Federal and state lobbying expenditures and issue areas",
    plainExplainer: "We check lobbying filings for spend amounts and specific issue areas.",
    signalTypes: ["lobbying_filing", "lobbying_issue", "revolving_door"],
    sourceHints: ["Senate LDA database", "OpenSecrets", "state lobbying databases"],
    dataSources: ["Senate Lobbying Disclosure Act database", "OpenSecrets lobbying data", "state lobbying registries"],
  },
  {
    key: "consumer_protection",
    group: "corporate_behavior" as ValuesGroupKey,
    label: "Consumer Trust & Product Safety",
    icon: ShoppingCart,
    description: "Whether the company supports or opposes consumer safety measures",
    plainExplainer: "We look at enforcement actions and lobbying on consumer protection.",
    signalTypes: ["lobbying_filing", "SEC_disclosure", "advocacy_alignment", "FTC_action", "CFPB_complaint"],
    sourceHints: ["lobbying disclosures", "CFPB records", "FTC actions"],
    dataSources: ["FTC enforcement database", "CFPB complaint database", "Senate LDA lobbying disclosures"],
  },
  {
    key: "voting_rights",
    group: "corporate_behavior" as ValuesGroupKey,
    label: "Civic Engagement Support",
    icon: Vote,
    description: "Whether the company supports employee voting access and civic participation",
    plainExplainer: "We check corporate policies on voting leave, civic engagement, and related lobbying.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["FEC filings", "congressional records", "advocacy trackers"],
    dataSources: ["FEC filings", "Senate LDA lobbying database", "congressional voting records"],
  },
  {
    key: "international_trade",
    group: "corporate_behavior" as ValuesGroupKey,
    label: "Global Operations & Trade Practices",
    icon: Globe,
    description: "International operations, sanctions compliance, and global trade positions",
    plainExplainer: "We check lobbying on trade policy, sanctions compliance, and international operations.",
    signalTypes: ["lobbying_filing", "OFAC_action", "trade_policy_signal"],
    sourceHints: ["Senate LDA database", "OFAC sanctions list", "BIS export controls"],
    dataSources: ["Senate LDA lobbying database", "OFAC sanctions database", "BIS entity list"],
  },

  // ── Business Impact ──
  {
    key: "environment_climate",
    group: "business_impact" as ValuesGroupKey,
    label: "Environmental Commitments",
    icon: Leaf,
    description: "Environmental track record, climate commitments, and sustainability efforts",
    plainExplainer: "We check pollution records, climate commitments, and environmental compliance.",
    signalTypes: ["EPA_enforcement", "environmental_compliance_signal", "lobbying_filing", "public_commitment", "corporate_statement"],
    sourceHints: ["EPA records", "CDP disclosures", "lobbying filings"],
    dataSources: ["EPA ECHO enforcement database", "CDP Climate Disclosure", "SEC climate risk filings"],
  },
  {
    key: "pollution_waste",
    group: "business_impact" as ValuesGroupKey,
    label: "Pollution & Waste Management",
    icon: Factory,
    description: "Toxic releases, waste disposal, and pollution violation history",
    plainExplainer: "We check EPA toxic release inventory, waste violations, and environmental compliance.",
    signalTypes: ["EPA_enforcement", "toxic_release", "waste_violation"],
    sourceHints: ["EPA TRI database", "EPA ECHO", "state environmental agencies"],
    dataSources: ["EPA Toxics Release Inventory (TRI)", "EPA ECHO enforcement database", "EPA Superfund site data"],
  },
  {
    key: "sustainable_supply_chains",
    group: "business_impact" as ValuesGroupKey,
    label: "Responsible Supply Chains",
    icon: Recycle,
    description: "Ethical sourcing, supply chain transparency, and sustainability certifications",
    plainExplainer: "We check supply chain disclosures, fair trade certifications, and human rights watchdog reports.",
    signalTypes: ["supply_chain_signal", "certification", "corporate_statement"],
    sourceHints: ["SEC conflict minerals filings", "Fair Trade certifications", "NGO watchdog reports"],
    dataSources: ["SEC conflict minerals filings (Form SD)", "Know The Chain benchmarks", "Fair Trade certification databases"],
  },
  {
    key: "energy_fossil_fuel",
    group: "business_impact" as ValuesGroupKey,
    label: "Energy & Climate Policy",
    icon: Zap,
    description: "Energy investments, renewable commitments, and energy policy positions",
    plainExplainer: "We check energy investments, lobbying on energy policy, and renewable commitments.",
    signalTypes: ["lobbying_filing", "SEC_disclosure", "public_commitment", "investment_signal"],
    sourceHints: ["SEC filings", "lobbying disclosures", "CDP disclosures"],
    dataSources: ["SEC 10-K filings", "Senate LDA lobbying database", "CDP Climate Disclosure"],
  },
  {
    key: "community_investment",
    group: "business_impact" as ValuesGroupKey,
    label: "Community & Local Impact",
    icon: Building2,
    description: "Philanthropy, community development, and local economic impact",
    plainExplainer: "We check foundation giving, community reinvestment, and local hiring and investment patterns.",
    signalTypes: ["foundation_grant", "CRA_signal", "corporate_statement"],
    sourceHints: ["IRS 990-PF filings", "CRA data (for banks)", "corporate social responsibility reports"],
    dataSources: ["IRS 990-PF foundation filings", "FFIEC CRA data", "USASpending.gov place of performance"],
  },

  // ── Personal Alignment (optional) ──
  {
    key: "immigration",
    group: "personal_alignment" as ValuesGroupKey,
    label: "Immigration & Workforce Mobility",
    icon: Globe,
    description: "Company practices on visa sponsorship, immigration benefits, and workforce mobility",
    plainExplainer: "We check visa sponsorship programs, lobbying on immigration, and workforce mobility policies.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["lobbying disclosures", "USASpending", "FEC filings"],
    dataSources: ["Senate LDA lobbying database", "USASpending.gov", "FEC filings"],
  },
  {
    key: "faith_christian",
    group: "personal_alignment" as ValuesGroupKey,
    label: "Faith & Values-Based Culture",
    icon: Church,
    description: "Whether company culture aligns with faith-based or traditional values",
    plainExplainer: "We look at where the company sends money and whether those groups support or oppose faith-related causes.",
    signalTypes: ["proxy_voting_signal", "public_commitment", "advocacy_alignment", "corporate_statement"],
    sourceHints: ["Inspire Investing", "shareholder proxy records", "corporate statements"],
    dataSources: ["Inspire Investing ratings", "shareholder proxy records", "EEOC religious accommodation cases"],
  },
  {
    key: "animal_welfare",
    group: "personal_alignment" as ValuesGroupKey,
    label: "Animal Welfare Practices",
    icon: PawPrint,
    description: "Animal welfare track record and corporate policies on animal issues",
    plainExplainer: "We check animal welfare scorecards, related donations, and industry memberships.",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "trade_association_membership"],
    sourceHints: ["Humane Society Legislative Fund", "FEC filings", "company statements"],
    dataSources: ["Humane Society Legislative Fund scorecard", "FEC filings", "USDA APHIS enforcement"],
  },
  {
    key: "education_access",
    group: "personal_alignment" as ValuesGroupKey,
    label: "Education & Growth Opportunities",
    icon: GraduationCap,
    description: "Education benefits, tuition assistance, and professional development support",
    plainExplainer: "We check education benefits, tuition programs, and company-funded learning opportunities.",
    signalTypes: ["lobbying_filing", "foundation_grant", "corporate_statement", "benefits_signal"],
    sourceHints: ["IRS 990-PF filings", "lobbying disclosures", "corporate benefit pages"],
    dataSources: ["IRS 990-PF foundation filings", "Senate LDA lobbying database", "Department of Education data"],
  },
] as const;

export type ValuesLensKey = typeof VALUES_LENSES[number]["key"];

export const SIGNAL_DIRECTION_CONFIG: Record<string, { label: string; plainLabel: string; color: string; bgColor: string }> = {
  alignment_signal: { label: "Alignment", plainLabel: "Supports this area", color: "text-[hsl(var(--civic-green))]", bgColor: "bg-[hsl(var(--civic-green))]/10" },
  conflict_signal: { label: "Conflict", plainLabel: "Works against this area", color: "text-[hsl(var(--civic-red))]", bgColor: "bg-[hsl(var(--civic-red))]/10" },
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

/** Legacy group key mapping — maps old group keys to new ones for backward compatibility */
export const LEGACY_GROUP_MAP: Record<string, ValuesGroupKey> = {
  social_civil_rights: "workplace_experience",
  worker_treatment: "compensation_conditions",
  environmental_impact: "business_impact",
  ethical_business: "leadership_governance",
  political_activity: "corporate_behavior",
  lifestyle_personal: "personal_alignment",
};

/** Resolve a group key, handling legacy keys */
export function resolveGroupKey(key: string): ValuesGroupKey {
  return (LEGACY_GROUP_MAP[key] as ValuesGroupKey) || (key as ValuesGroupKey);
}
