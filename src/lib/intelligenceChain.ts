/**
 * Intelligence Chain — Data Architecture
 * 
 * The platform organizes all signals through five connected layers:
 * 
 *   Policy → Influence → Company → Work → Career
 * 
 * Every signal traces back through this chain so users can understand
 * the logical relationship between policy activity and their career.
 */

/* ── Chain Layers ── */

export type ChainLayer = "policy" | "influence" | "company" | "work" | "career";

export const CHAIN_LAYERS: { id: ChainLayer; label: string; description: string }[] = [
  { id: "policy", label: "Policy", description: "Legislation and regulatory activity that affects industries and companies." },
  { id: "influence", label: "Influence", description: "PAC donations, executive donations, lobbying contracts, and trade associations." },
  { id: "company", label: "Company", description: "Company structure, leadership, federal contracts, and financial exposure." },
  { id: "work", label: "Work", description: "Hiring patterns, layoffs, WARN notices, HR technology, and compensation." },
  { id: "career", label: "Career", description: "Job offers, career paths, recruiting strategy, and offer negotiation." },
];

/* ── Confidence ── */

export type ConfidenceLevel = "Strong Evidence" | "Some Evidence" | "Possible Connection";

export function confidenceFromScore(score: number): ConfidenceLevel {
  if (score >= 80) return "Strong Evidence";
  if (score >= 50) return "Some Evidence";
  return "Possible Connection";
}

export function confidenceColor(c: ConfidenceLevel) {
  switch (c) {
    case "Strong Evidence": return "text-civic-green";
    case "Some Evidence": return "text-civic-yellow";
    case "Possible Connection": return "text-muted-foreground";
  }
}

/* ── Chain Step ── */

export interface ChainStep {
  layer: ChainLayer;
  entity: string;
  entityType: string;
  detail?: string;
  sourceUrl?: string;
}

/* ── Chain Signal ── */

export interface ChainSignal {
  id: string;
  chain: ChainStep[];
  summary: string;
  amount?: number;
  confidence: ConfidenceLevel;
  source: string;
  sourceUrl?: string;
  issueCategories?: string[];
  alignmentStatus?: "alignment" | "conflict" | "mixed" | "informational";
  whyItMatters?: string;
}

/* ── Issue Areas ── */

export const ISSUE_AREA_IDS = [
  "labor", "reproductive", "civil-rights", "climate", "immigration",
  "lgbtq", "voting", "education", "healthcare", "consumer",
  "animal-welfare", "faith", "israel",
] as const;

export type IssueAreaId = typeof ISSUE_AREA_IDS[number];

export const ISSUE_AREA_LABELS: Record<IssueAreaId, string> = {
  labor: "Labor Rights",
  reproductive: "Reproductive Rights",
  "civil-rights": "Civil Rights",
  climate: "Climate",
  immigration: "Immigration",
  lgbtq: "LGBTQ+ Rights",
  voting: "Voting Rights",
  education: "Education",
  healthcare: "Healthcare",
  consumer: "Consumer Protection",
  "animal-welfare": "Animal Welfare",
  faith: "Faith / Christian Values",
  israel: "Israel / Middle East",
};

/* ── Alignment helpers ── */

export type AlignmentStatus = "alignment" | "conflict" | "mixed" | "informational";

export function alignmentMeta(status: AlignmentStatus) {
  switch (status) {
    case "alignment": return { label: "Alignment Signal", color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30" };
    case "conflict": return { label: "Conflict Signal", color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" };
    case "mixed": return { label: "Mixed Signal", color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30" };
    case "informational": return { label: "Informational", color: "text-muted-foreground", bg: "bg-muted/50", border: "border-border" };
  }
}

/* ── Format helpers ── */

export function formatChainCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/* ── Demo: Chain Signals ── */

export function getDemoChainSignals(company: string): ChainSignal[] {
  return [
    {
      id: "cs-1",
      chain: [
        { layer: "policy", entity: "PRO Act (H.R. 842)", entityType: "Legislation", detail: "Protecting the Right to Organize Act" },
        { layer: "influence", entity: "Rep. Virginia Foxx (R-NC)", entityType: "Legislator", detail: "Voted against PRO Act" },
        { layer: "influence", entity: `${company} PAC`, entityType: "PAC", detail: "$15,000 donation" },
        { layer: "company", entity: company, entityType: "Employer" },
        { layer: "work", entity: "Hiring Pipeline", entityType: "Work Signal", detail: "AI screening tools detected" },
      ],
      summary: `${company} PAC donated $15,000 to Rep. Virginia Foxx, who voted against the PRO Act. The company also uses AI screening in its hiring pipeline.`,
      amount: 15000,
      confidence: "Strong Evidence",
      source: "FEC Filing",
      sourceUrl: "https://www.fec.gov",
      issueCategories: ["labor"],
      alignmentStatus: "conflict",
      whyItMatters: "If labor protections matter to you, this chain connects company money to a legislator who opposed worker organizing rights — and the company's own hiring practices show limited transparency.",
    },
    {
      id: "cs-2",
      chain: [
        { layer: "policy", entity: "Clean Air Act Amendments", entityType: "Regulation", detail: "EPA emissions standards" },
        { layer: "influence", entity: "Akin Gump (Lobbying Firm)", entityType: "Lobbyist", detail: "$1.2M lobbying contract" },
        { layer: "influence", entity: `${company}`, entityType: "Client" },
        { layer: "company", entity: company, entityType: "Employer" },
      ],
      summary: `${company} spent $1.2M through Akin Gump lobbying on EPA emissions regulations under the Clean Air Act.`,
      amount: 1200000,
      confidence: "Strong Evidence",
      source: "Senate LDA Filing",
      sourceUrl: "https://lda.senate.gov",
      issueCategories: ["climate"],
      alignmentStatus: "mixed",
      whyItMatters: "The scale of lobbying on environmental regulation is significant. The specific positions aren't always public, but the engagement level signals deep interest in shaping climate policy.",
    },
    {
      id: "cs-3",
      chain: [
        { layer: "policy", entity: "H.R. 7567 (Bacon Act)", entityType: "Legislation", detail: "March 5, 2026 Farm Bill vote" },
        { layer: "influence", entity: "2 YES-vote co-sponsors", entityType: "Legislators" },
        { layer: "influence", entity: `${company} PAC`, entityType: "PAC", detail: "$5,000 donation" },
        { layer: "company", entity: company, entityType: "Employer" },
      ],
      summary: `${company} PAC donated to 2 co-sponsors of H.R. 7567 who voted YES on March 5, 2026.`,
      amount: 5000,
      confidence: "Strong Evidence",
      source: "FEC Filing",
      sourceUrl: "https://www.fec.gov",
      issueCategories: ["animal-welfare"],
      alignmentStatus: "conflict",
      whyItMatters: "If animal welfare matters to you, donations to legislators supporting the Bacon Act after the March 5 vote are a direct value conflict signal.",
    },
    {
      id: "cs-4",
      chain: [
        { layer: "policy", entity: "CFPB Data Privacy Rulemaking", entityType: "Regulation" },
        { layer: "influence", entity: `${company} Government Affairs`, entityType: "In-house Lobbyist", detail: "$420K lobbying" },
        { layer: "company", entity: company, entityType: "Employer" },
        { layer: "work", entity: "Compensation Practices", entityType: "Work Signal", detail: "42% salary range disclosure" },
        { layer: "career", entity: "Offer Transparency", entityType: "Career Signal", detail: "Below BLS median benchmark" },
      ],
      summary: `${company} lobbied against CFPB data privacy rules while its own compensation transparency sits below industry benchmarks.`,
      amount: 420000,
      confidence: "Strong Evidence",
      source: "Senate LDA Filing",
      sourceUrl: "https://lda.senate.gov",
      issueCategories: ["consumer", "labor"],
      alignmentStatus: "conflict",
      whyItMatters: "Opposition to consumer protection regulation combined with limited compensation transparency creates a pattern worth understanding before accepting an offer.",
    },
    {
      id: "cs-5",
      chain: [
        { layer: "company", entity: company, entityType: "Employer" },
        { layer: "company", entity: "Department of Justice", entityType: "Federal Agency", detail: "$42M in contracts" },
        { layer: "work", entity: "EEO Compliance", entityType: "Work Signal", detail: "Federal contractor obligations" },
      ],
      summary: `${company} holds $42M in federal contracts with the DOJ, which subjects it to Executive Order equal employment requirements.`,
      amount: 42000000,
      confidence: "Strong Evidence",
      source: "USASpending.gov",
      sourceUrl: "https://www.usaspending.gov",
      issueCategories: ["civil-rights"],
      alignmentStatus: "informational",
      whyItMatters: "Federal contractors must comply with EEO requirements. This is a compliance signal, not necessarily a values signal.",
    },
    {
      id: "cs-6",
      chain: [
        { layer: "influence", entity: "National Association of Manufacturers", entityType: "Trade Association", detail: "Member" },
        { layer: "influence", entity: "NAM Lobbying", entityType: "Advocacy", detail: "Opposed OSHA safety rule expansion" },
        { layer: "company", entity: company, entityType: "Employer" },
        { layer: "work", entity: "Workforce Safety", entityType: "Work Signal" },
      ],
      summary: `${company} is a member of NAM, which has lobbied against OSHA workplace safety rule expansions.`,
      confidence: "Some Evidence",
      source: "NAM Membership Directory",
      issueCategories: ["labor"],
      alignmentStatus: "informational",
      whyItMatters: "Trade association positions don't always represent each member's view, but membership funds shared advocacy.",
    },
    {
      id: "cs-7",
      chain: [
        { layer: "company", entity: company, entityType: "Employer" },
        { layer: "work", entity: "WARN Filings", entityType: "Work Signal", detail: "No filings in 12 months" },
        { layer: "work", entity: "Headcount Trend", entityType: "Work Signal", detail: "Flat — not growing" },
        { layer: "career", entity: "Job Stability Assessment", entityType: "Career Signal", detail: "Stable" },
      ],
      summary: `No WARN Act layoff notices filed for ${company} in the past 12 months. Headcount trend is flat.`,
      confidence: "Strong Evidence",
      source: "State WARN Databases",
      issueCategories: ["labor"],
      alignmentStatus: "alignment",
      whyItMatters: "Workforce stability is a positive signal for candidates evaluating long-term employment prospects.",
    },
    {
      id: "cs-8",
      chain: [
        { layer: "influence", entity: "Americans for Prosperity", entityType: "501(c)(4)", detail: "Advocates against renewable energy mandates" },
        { layer: "influence", entity: "CEO Personal Donation", entityType: "Executive Donation", detail: "$50,000" },
        { layer: "company", entity: company, entityType: "Employer" },
      ],
      summary: `CEO personally donated $50,000 to Americans for Prosperity, which has advocated against renewable energy mandates.`,
      amount: 50000,
      confidence: "Strong Evidence",
      source: "FEC Individual Contributions",
      sourceUrl: "https://www.fec.gov",
      issueCategories: ["climate"],
      alignmentStatus: "conflict",
      whyItMatters: "Executive personal donations reflect individual priorities, not always corporate policy. But at this level, the connection is notable.",
    },
  ];
}
