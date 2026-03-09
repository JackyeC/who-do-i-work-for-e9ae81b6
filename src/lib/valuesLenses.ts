import {
  Heart, Globe, PawPrint, Users, Shield, Leaf, Hammer, Rainbow,
  Vote, ShoppingCart, Stethoscope, Church, Flag,
} from "lucide-react";

export const VALUES_LENSES = [
  {
    key: "faith_christian",
    label: "Faith & Religious Values",
    icon: Church,
    description: "See if a company's money and actions line up with faith-based values",
    plainExplainer: "We look at where the company sends its money and whether those groups or politicians support or oppose faith-related causes.",
    signalTypes: ["proxy_voting_signal", "public_commitment", "advocacy_alignment", "corporate_statement"],
    sourceHints: ["Inspire Investing", "shareholder proxy records", "corporate statements"],
  },
  {
    key: "israel_middle_east",
    label: "Israel & Middle East",
    icon: Flag,
    description: "See which politicians and groups this company funds related to Middle East policy",
    plainExplainer: "We check campaign donations, lobbying records, and public statements to see where the company stands on Middle East issues.",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "congressional records", "public statements"],
  },
  {
    key: "animal_welfare",
    label: "Animal Welfare",
    icon: PawPrint,
    description: "See how a company scores on animal welfare and who they fund on this issue",
    plainExplainer: "We check animal welfare scorecards, donations to politicians who vote on animal issues, and industry group memberships.",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "trade_association_membership"],
    sourceHints: ["Humane Society Legislative Fund", "FEC filings", "company statements"],
  },
  {
    key: "dei_equity",
    label: "Diversity & Workplace Equity",
    icon: Users,
    description: "See whether a company is expanding or pulling back on diversity programs",
    plainExplainer: "We track changes to diversity programs, job page language, and what the company tells the government about its workforce makeup.",
    signalTypes: ["DEI_rollback_signal", "website_change", "human_capital_disclosure", "corporate_statement", "public_commitment"],
    sourceHints: ["SEC EDGAR", "corporate websites", "public trackers"],
  },
  {
    key: "anti_discrimination",
    label: "Anti-Discrimination",
    icon: Shield,
    description: "See what a company says in official filings about preventing discrimination",
    plainExplainer: "We look at government filings and company policies to see how they talk about preventing workplace discrimination.",
    signalTypes: ["human_capital_disclosure", "SEC_disclosure", "corporate_statement"],
    sourceHints: ["SEC EDGAR 10-K", "bias audit disclosures", "corporate policies"],
  },
  {
    key: "environment_climate",
    label: "Environment & Climate",
    icon: Leaf,
    description: "See a company's environmental track record and who they lobby on climate issues",
    plainExplainer: "We check pollution records, climate promises, and whether the company pays lobbyists to influence environmental rules.",
    signalTypes: ["EPA_enforcement", "environmental_compliance_signal", "lobbying_filing", "public_commitment", "corporate_statement"],
    sourceHints: ["EPA records", "CDP disclosures", "lobbying filings"],
  },
  {
    key: "labor_rights",
    label: "Worker & Labor Rights",
    icon: Hammer,
    description: "See how a company treats workers and where they spend money on labor issues",
    plainExplainer: "We look at union activity, worker complaints, wage policies, and whether the company funds politicians who vote on labor laws.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["FEC filings", "NLRB records", "lobbying disclosures"],
  },
  {
    key: "lgbtq_rights",
    label: "LGBTQ+ Rights",
    icon: Rainbow,
    description: "See where a company stands on LGBTQ+ issues based on their spending and policies",
    plainExplainer: "We check equality scorecards, anti-discrimination policies, and whether the company funds politicians who support or oppose LGBTQ+ rights.",
    signalTypes: ["advocacy_alignment", "advocacy_conflict", "PAC_donation", "corporate_statement", "public_commitment"],
    sourceHints: ["HRC Corporate Equality Index", "FEC filings", "corporate policies"],
  },
  {
    key: "reproductive_rights",
    label: "Reproductive Rights",
    icon: Heart,
    description: "See who a company funds and lobbies on reproductive healthcare policy",
    plainExplainer: "We follow the money — campaign donations, lobbying reports, and public statements — to see where a company's influence goes on reproductive health issues.",
    signalTypes: ["PAC_donation", "executive_donation", "lobbying_filing", "corporate_statement"],
    sourceHints: ["FEC filings", "lobbying disclosures", "corporate statements"],
  },
  {
    key: "voting_rights",
    label: "Voting Rights",
    icon: Vote,
    description: "See if a company supports or opposes efforts to make voting easier or harder",
    plainExplainer: "We check who the company donates to and lobbies on issues like voter access, election laws, and voting restrictions.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["FEC filings", "congressional records", "advocacy trackers"],
  },
  {
    key: "consumer_protection",
    label: "Consumer Protection",
    icon: ShoppingCart,
    description: "See if a company lobbies for or against rules that protect consumers",
    plainExplainer: "We look at lobbying records to see if the company is trying to weaken or strengthen consumer safety and financial protection rules.",
    signalTypes: ["lobbying_filing", "SEC_disclosure", "advocacy_alignment"],
    sourceHints: ["lobbying disclosures", "CFPB records", "FTC actions"],
  },
  {
    key: "healthcare",
    label: "Healthcare",
    icon: Stethoscope,
    description: "See where a company spends money to influence healthcare policy",
    plainExplainer: "We track lobbying on healthcare laws, donations to politicians who vote on health policy, and drug pricing advocacy.",
    signalTypes: ["lobbying_filing", "PAC_donation", "SEC_disclosure"],
    sourceHints: ["lobbying disclosures", "FEC filings", "SEC filings"],
  },
  {
    key: "immigration",
    label: "Immigration",
    icon: Globe,
    description: "See a company's spending and lobbying on immigration policy",
    plainExplainer: "We check lobbying records, government contracts related to immigration enforcement, and donations to politicians who shape immigration law.",
    signalTypes: ["lobbying_filing", "PAC_donation", "advocacy_alignment", "advocacy_conflict"],
    sourceHints: ["lobbying disclosures", "USASpending", "FEC filings"],
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
  high: { label: "High Confidence", plainLabel: "Strong evidence", color: "border-[hsl(var(--civic-green))]/30 text-[hsl(var(--civic-green))]" },
  medium: { label: "Medium Confidence", plainLabel: "Some evidence", color: "border-[hsl(var(--civic-yellow))]/30 text-[hsl(var(--civic-yellow))]" },
  low: { label: "Low Confidence", plainLabel: "Weak evidence", color: "border-[hsl(var(--civic-red))]/30 text-[hsl(var(--civic-red))]" },
};

export const VERIFICATION_CONFIG: Record<string, { label: string; color: string }> = {
  verified: { label: "Verified", color: "text-[hsl(var(--civic-green))]" },
  partially_verified: { label: "Partially Verified", color: "text-[hsl(var(--civic-yellow))]" },
  unverified: { label: "Unverified", color: "text-muted-foreground" },
};
