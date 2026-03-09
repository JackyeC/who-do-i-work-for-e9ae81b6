import {
  Heart, Globe, PawPrint, Users, Shield, Leaf, Hammer, Rainbow,
  Vote, ShoppingCart, Stethoscope, Church, Flag,
} from "lucide-react";

export const VALUES_LENSES = [
  {
    key: "faith_christian",
    label: "Faith / Christian Values",
    icon: Church,
    description: "Public commitments, proxy voting, and shareholder engagement related to faith-based values",
    signalTypes: ["proxy_voting_signal", "public_commitment", "advocacy_alignment", "corporate_statement"],
    sourceHints: ["Inspire Investing", "shareholder proxy records", "corporate statements"],
  },
  {
    key: "israel_middle_east",
    label: "Israel / Middle East",
    icon: Flag,
    description: "Political giving, public statements, and advocacy signals related to Israel and Middle East policy",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "congressional records", "public statements"],
  },
  {
    key: "animal_welfare",
    label: "Animal Welfare",
    icon: PawPrint,
    description: "Scorecard ratings, legislative giving, and trade association ties related to animal welfare",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "trade_association_membership"],
    sourceHints: ["Humane Society Legislative Fund", "FEC filings", "company statements"],
  },
  {
    key: "dei_equity",
    label: "DEI / Workplace Equity",
    icon: Users,
    description: "DEI program signals, career page changes, SEC human capital disclosures, and public announcements",
    signalTypes: ["DEI_rollback_signal", "website_change", "human_capital_disclosure", "corporate_statement", "public_commitment"],
    sourceHints: ["SEC EDGAR", "corporate websites", "public trackers"],
  },
  {
    key: "anti_discrimination",
    label: "Anti-Discrimination",
    icon: Shield,
    description: "EEO references, bias audit disclosures, and anti-discrimination policy language in filings",
    signalTypes: ["human_capital_disclosure", "SEC_disclosure", "corporate_statement"],
    sourceHints: ["SEC EDGAR 10-K", "bias audit disclosures", "corporate policies"],
  },
  {
    key: "environment_climate",
    label: "Environment / Climate",
    icon: Leaf,
    description: "EPA enforcement, emissions data, climate lobbying, and sustainability commitments",
    signalTypes: ["EPA_enforcement", "environmental_compliance_signal", "lobbying_filing", "public_commitment", "corporate_statement"],
    sourceHints: ["EPA records", "CDP disclosures", "lobbying filings"],
  },
  {
    key: "labor_rights",
    label: "Labor Rights",
    icon: Hammer,
    description: "Union activity, worker protections, wage policy, and labor-related political spending",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["FEC filings", "NLRB records", "lobbying disclosures"],
  },
  {
    key: "lgbtq_rights",
    label: "LGBTQ+ Rights",
    icon: Rainbow,
    description: "Equality advocacy, anti-discrimination policy, corporate equality index, and related donations",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "corporate_statement", "public_commitment"],
    sourceHints: ["HRC Corporate Equality Index", "FEC filings", "corporate policies"],
  },
  {
    key: "reproductive_rights",
    label: "Reproductive Rights",
    icon: Heart,
    description: "Political spending and advocacy on reproductive healthcare policy",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "lobbying disclosures", "corporate statements"],
  },
  {
    key: "voting_rights",
    label: "Voting Rights",
    icon: Vote,
    description: "Election access, voter protection, and gerrymandering-related signals",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["FEC filings", "congressional records", "advocacy trackers"],
  },
  {
    key: "consumer_protection",
    label: "Consumer Protection",
    icon: ShoppingCart,
    description: "Regulatory lobbying, product safety, and consumer rights spending",
    signalTypes: ["lobbying_filing", "SEC_disclosure", "advocacy_alignment"],
    sourceHints: ["lobbying disclosures", "CFPB records", "FTC actions"],
  },
  {
    key: "healthcare",
    label: "Healthcare",
    icon: Stethoscope,
    description: "Healthcare lobbying, insurance policy, and pharmaceutical spending signals",
    signalTypes: ["lobbying_filing", "PAC_donation", "SEC_disclosure"],
    sourceHints: ["lobbying disclosures", "FEC filings", "SEC filings"],
  },
  {
    key: "immigration",
    label: "Immigration",
    icon: Globe,
    description: "Immigration policy lobbying, enforcement contracts, and advocacy connections",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["lobbying disclosures", "USASpending", "FEC filings"],
  },
] as const;

export type ValuesLensKey = typeof VALUES_LENSES[number]["key"];

export const SIGNAL_DIRECTION_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  alignment_signal: { label: "Alignment", color: "text-[hsl(var(--civic-green))]", bgColor: "bg-[hsl(var(--civic-green))]/10" },
  conflict_signal: { label: "Conflict", color: "text-[hsl(var(--civic-red))]", bgColor: "bg-[hsl(var(--civic-red))]/10" },
  informational_signal: { label: "Informational", color: "text-[hsl(var(--civic-blue))]", bgColor: "bg-[hsl(var(--civic-blue))]/10" },
  mixed_signal: { label: "Mixed", color: "text-[hsl(var(--civic-yellow))]", bgColor: "bg-[hsl(var(--civic-yellow))]/10" },
};

export const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: "High Confidence", color: "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]" },
  medium: { label: "Medium Confidence", color: "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]" },
  low: { label: "Low Confidence", color: "border-[hsl(var(--civic-red))]/30 text-[hsl(var(--civic-red))]" },
};

export const VERIFICATION_CONFIG: Record<string, { label: string; color: string }> = {
  verified: { label: "Verified", color: "text-[hsl(var(--civic-green))]" },
  partially_verified: { label: "Partially Verified", color: "text-[hsl(var(--civic-yellow))]" },
  unverified: { label: "Unverified", color: "text-muted-foreground" },
};
