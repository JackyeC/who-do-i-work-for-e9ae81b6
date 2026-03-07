// ─── Types ───────────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  parentCompany?: string;
  industry: string;
  revenue: string;
  employeeCount?: string;
  description: string;
  state: string;
  careersUrl?: string;
  lastUpdated: string;
  confidenceRating: "high" | "medium" | "low";

  // Money Trail
  corporatePacExists: boolean;
  totalPacSpending: number;
  partyBreakdown: { party: string; amount: number; color: string }[];
  candidates: Candidate[];
  executives: Executive[];
  lobbyingSpend?: number;

  // Indirect / Dark Money
  superPacs: SuperPacTie[];
  darkMoneyOrgs: DarkMoneyOrg[];
  
  // Government ROI
  governmentContracts?: number;
  subsidiesReceived?: number;
  effectiveTaxRate?: string;
  revolvingDoor: RevolvingDoorEntry[];

  // Influence Network
  tradeAssociations: string[];
  flaggedOrgTies: FlaggedOrgTie[];
  boardAffiliations: string[];

  // Historical Spending (by election cycle)
  spendingHistory: SpendingCycle[];

  // Public Stance vs Spending
  publicStances: PublicStance[];

  // Worker / Consumer Relevance
  workerRelevance: string;
  consumerRelevance: string;

  civicFootprintScore: number; // 0-100, higher = more concentrated influence

  // Scoring
  influenceROI?: InfluenceROIData;
  hypocrisyIndex?: HypocrisyIndexData;
  politicalRisk?: PoliticalRiskData;
  benchmark?: BenchmarkData;

  // ROI Pipeline (connective tissue)
  roiPipeline?: ROIPipelineData;
}

export interface ROIPipelineData {
  moneyIn: { label: string; amount: number; type: string }[];
  network: { label: string; role: string; type: string }[];
  benefitsOut: { label: string; amount: number; type: string }[];
  linkages: { source: string; target: string; description: string; confidence: number }[];
  totalSpending: number;
  totalBenefits: number;
}

export interface Candidate {
  name: string;
  party: "R" | "D" | "I";
  state: string;
  district?: string;
  amount: number;
  type: "corporate-pac" | "executive-personal" | "super-pac";
  flagged: boolean;
  flagReason?: string;
}

export interface Executive {
  name: string;
  title: string;
  totalDonations: number;
  topRecipients: { name: string; amount: number; party: "R" | "D" | "I" }[];
}

export interface SuperPacTie {
  name: string;
  type: "super-pac" | "527";
  amount: number;
  relationship: "direct" | "leadership-linked" | "corporate-affiliated";
  description: string;
  confidence: "direct" | "inferred" | "unverified";
}

export interface DarkMoneyOrg {
  name: string;
  type: "501c4" | "501c6" | "other";
  estimatedAmount?: number;
  relationship: string;
  confidence: "direct" | "inferred" | "unverified";
  description: string;
  source?: string;
}

export interface RevolvingDoorEntry {
  person: string;
  formerRole: string;
  currentRole: string;
  relevance: string;
  confidence: "direct" | "inferred" | "unverified";
}

export interface SpendingCycle {
  cycle: string; // e.g. "2020", "2022", "2024", "2026"
  pacSpending: number;
  lobbyingSpend: number;
  executiveGiving: number;
}

export interface FlaggedOrgTie {
  orgName: string;
  relationship: "direct-funding" | "board-membership" | "trade-association" | "foundation-grant" | "amicus-support";
  confidence: "direct" | "inferred" | "unverified";
  description: string;
  source?: string;
}

export interface PublicStance {
  topic: string;
  publicPosition: string;
  spendingReality: string;
  gap: "aligned" | "mixed" | "contradictory";
}

// ─── Scoring Interfaces ──────────────────────────────────────────────────────

export interface InfluenceROIData {
  totalPoliticalSpending: number;
  totalGovernmentBenefits: number;
  roiRatio: number;
  policyWinRate?: number;
  grade: string;
}

export interface HypocrisyIndexData {
  chiScore: number;
  grade: string;
  directConflicts: number;
  indirectConflicts: number;
  alignedStances: number;
  totalStances: number;
}

export interface PoliticalRiskData {
  riskScore: number;
  grade: string;
  revolvingDoorCount: number;
  darkMoneyPercentage: number;
  stakeholderDisconnect: number;
  flaggedOrgCount: number;
}

export interface BenchmarkData {
  industry: string;
  transparencyGrade: string;
  cpaZicklinScore?: number;
  industryRank?: number;
  industryTotal?: number;
  peerAvgCivicFootprint: number;
  peerAvgLobbying: number;
  peerAvgPacSpending: number;
  isIndustryLeader: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFootprintLabel(score: number): { label: string; description: string; color: string } {
  if (score >= 70) return { label: "High Concentration", description: "Influence is heavily concentrated in one political direction", color: "civic-red" };
  if (score >= 40) return { label: "Mixed Influence", description: "Spending distributed across parties with some concentration", color: "civic-yellow" };
  return { label: "Broad / Low Influence", description: "Minimal or broadly distributed political spending", color: "civic-green" };
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

export function searchCompanies(query: string): Company[] {
  const q = query.toLowerCase().trim();
  if (!q) return companies;
  return companies.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q)
  );
}

// industries is computed lazily after companies array below

// ─── Sample Data ─────────────────────────────────────────────────────────────

export const companies: Company[] = [
  {
    id: "home-depot",
    name: "The Home Depot",
    industry: "Retail",
    revenue: "$157B",
    employeeCount: "~475,000",
    description: "Home improvement retail corporation operating stores across North America.",
    state: "GA",
    careersUrl: "https://careers.homedepot.com",
    lastUpdated: "2025-12-15",
    confidenceRating: "high",
    civicFootprintScore: 72,
    corporatePacExists: true,
    totalPacSpending: 4200000,
    lobbyingSpend: 3100000,
    partyBreakdown: [
      { party: "Republican", amount: 2940000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 1050000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 210000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Ted Cruz", party: "R", state: "TX", amount: 15000, type: "corporate-pac", flagged: true, flagReason: "Endorsed by Christian Nationalist PACs" },
      { name: "Sen. Marsha Blackburn", party: "R", state: "TN", amount: 12000, type: "corporate-pac", flagged: true, flagReason: "Supports Project 2025 agenda" },
      { name: "Rep. Jim Jordan", party: "R", state: "OH", district: "4th", amount: 10000, type: "corporate-pac", flagged: true, flagReason: "Ties to dominionist organizations" },
      { name: "Sen. Jon Ossoff", party: "D", state: "GA", amount: 8000, type: "corporate-pac", flagged: false },
      { name: "Rep. Lucy McBath", party: "D", state: "GA", district: "7th", amount: 5000, type: "corporate-pac", flagged: false },
    ],
    executives: [
      {
        name: "Bernard Marcus (Co-founder)",
        title: "Co-Founder (Retired)",
        totalDonations: 32000000,
        topRecipients: [
          { name: "Senate Leadership Fund", amount: 18000000, party: "R" },
          { name: "Club for Growth", amount: 7000000, party: "R" },
          { name: "Republican National Committee", amount: 5000000, party: "R" },
        ],
      },
    ],
    superPacs: [
      { name: "Senate Leadership Fund", type: "super-pac", amount: 18000000, relationship: "leadership-linked", description: "Co-founder Marcus is a top donor to this Super PAC supporting Republican Senate candidates.", confidence: "direct" },
    ],
    darkMoneyOrgs: [],
    revolvingDoor: [
      { person: "Craig Menear", formerRole: "CEO, The Home Depot", currentRole: "Board member, National Retail Federation", relevance: "NRF lobbies on labor and trade policy that directly affects Home Depot's business interests.", confidence: "direct" },
    ],
    governmentContracts: 450000000,
    subsidiesReceived: 180000000,
    effectiveTaxRate: "23.1%",
    spendingHistory: [
      { cycle: "2020", pacSpending: 3600000, lobbyingSpend: 2800000, executiveGiving: 28000000 },
      { cycle: "2022", pacSpending: 3900000, lobbyingSpend: 2900000, executiveGiving: 30000000 },
      { cycle: "2024", pacSpending: 4100000, lobbyingSpend: 3000000, executiveGiving: 31000000 },
      { cycle: "2026", pacSpending: 4200000, lobbyingSpend: 3100000, executiveGiving: 32000000 },
    ],
    tradeAssociations: ["National Retail Federation", "U.S. Chamber of Commerce"],
    flaggedOrgTies: [
      { orgName: "Club for Growth", relationship: "direct-funding", confidence: "direct", description: "Co-founder Bernard Marcus has donated $7M+ to Club for Growth.", source: "OpenSecrets.org" },
    ],
    boardAffiliations: ["Republican Jewish Coalition (Marcus)"],
    publicStances: [
      { topic: "Diversity & Inclusion", publicPosition: "Publicly committed to DEI initiatives and diverse hiring", spendingReality: "Co-founder actively funds organizations opposing DEI policies", gap: "contradictory" },
    ],
    workerRelevance: "Leadership spending may signal likely positions on labor rights, union policy, and workplace protections. Co-founder's significant political spending is personal, not corporate.",
    consumerRelevance: "Purchases support a company whose PAC leans Republican and whose co-founder is a major conservative donor.",
    influenceROI: { totalPoliticalSpending: 39300000, totalGovernmentBenefits: 630000000, roiRatio: 16.0, policyWinRate: 72, grade: "A+" },
    hypocrisyIndex: { chiScore: 68, grade: "D", directConflicts: 1, indirectConflicts: 0, alignedStances: 0, totalStances: 1 },
    politicalRisk: { riskScore: 62, grade: "D", revolvingDoorCount: 1, darkMoneyPercentage: 0, stakeholderDisconnect: 55, flaggedOrgCount: 1 },
    benchmark: { industry: "Retail", transparencyGrade: "B", cpaZicklinScore: 65, industryRank: 3, industryTotal: 8, peerAvgCivicFootprint: 45, peerAvgLobbying: 3500000, peerAvgPacSpending: 2800000, isIndustryLeader: false },
    roiPipeline: {
      totalSpending: 39300000, totalBenefits: 630000000,
      moneyIn: [
        { label: "Corporate PAC", amount: 4200000, type: "PAC" },
        { label: "Lobbying", amount: 3100000, type: "Lobbying" },
        { label: "Bernard Marcus (Personal)", amount: 32000000, type: "Executive" },
      ],
      network: [
        { label: "Sen. Ted Cruz", role: "Commerce Committee", type: "Recipient" },
        { label: "National Retail Federation", role: "Trade Assoc — lobbies on labor & trade", type: "Trade Group" },
        { label: "Craig Menear", role: "Former CEO → NRF Board", type: "Revolving Door" },
      ],
      benefitsOut: [
        { label: "Federal Contracts", amount: 450000000, type: "Contracts" },
        { label: "State/Local Subsidies", amount: 180000000, type: "Subsidies" },
      ],
      linkages: [
        { source: "Home Depot PAC", target: "Sen. Ted Cruz", description: "$15K donation; Cruz sits on Commerce Committee overseeing retail regulation", confidence: 1.0 },
        { source: "NRF Lobbying", target: "Labor Committee", description: "NRF lobbied against minimum wage increase; Home Depot is top member", confidence: 0.8 },
        { source: "Federal Procurement", target: "Home Depot", description: "$450M in government supply contracts for facilities maintenance", confidence: 1.0 },
      ],
    },
  },
  {
    id: "chick-fil-a",
    name: "Chick-fil-A",
    industry: "Food & Beverage",
    revenue: "$21.6B",
    employeeCount: "~200,000",
    description: "American fast food restaurant chain specializing in chicken sandwiches.",
    state: "GA",
    lastUpdated: "2025-11-20",
    confidenceRating: "high",
    civicFootprintScore: 85,
    corporatePacExists: false,
    totalPacSpending: 0,
    partyBreakdown: [],
    candidates: [],
    executives: [
      {
        name: "Dan Cathy",
        title: "Chairman",
        totalDonations: 8500000,
        topRecipients: [
          { name: "National Christian Foundation", amount: 5000000, party: "R" },
          { name: "Fellowship of Christian Athletes", amount: 2000000, party: "R" },
          { name: "Focus on the Family", amount: 1500000, party: "R" },
        ],
      },
    ],
    superPacs: [],
    darkMoneyOrgs: [
      { name: "National Christian Foundation", type: "501c4", estimatedAmount: 5000000, relationship: "Chairman Dan Cathy is a major personal donor", confidence: "direct", description: "NCF is one of the largest donors to anti-LGBTQ+ organizations. It operates as a donor-advised fund that obscures the ultimate recipients.", source: "Tax filings, Sludge reporting" },
    ],
    revolvingDoor: [],
    spendingHistory: [
      { cycle: "2020", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 7000000 },
      { cycle: "2022", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 7500000 },
      { cycle: "2024", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 8000000 },
      { cycle: "2026", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 8500000 },
    ],
    tradeAssociations: ["National Restaurant Association"],
    flaggedOrgTies: [
      { orgName: "National Christian Foundation", relationship: "foundation-grant", confidence: "direct", description: "Chairman Dan Cathy has personally donated $5M+ to NCF, which funds groups opposing LGBTQ+ rights.", source: "Tax filings, public reporting" },
      { orgName: "Focus on the Family", relationship: "direct-funding", confidence: "direct", description: "Cathy family has donated to Focus on the Family, classified as anti-LGBTQ+ by SPLC.", source: "SPLC, tax filings" },
    ],
    boardAffiliations: [],
    publicStances: [
      { topic: "LGBTQ+ Rights", publicPosition: "Stated in 2019 it would stop donating to anti-LGBTQ+ organizations", spendingReality: "Chairman's personal and family foundation giving continues to fund organizations opposing LGBTQ+ rights", gap: "contradictory" },
    ],
    workerRelevance: "LGBTQ+ employees and allies may want to consider executive leadership's personal funding of organizations that oppose LGBTQ+ protections.",
    consumerRelevance: "Purchases support a company whose leadership has well-documented ties to organizations opposing LGBTQ+ rights through personal and foundation giving.",
    influenceROI: { totalPoliticalSpending: 8500000, totalGovernmentBenefits: 0, roiRatio: 0, grade: "N/A" },
    hypocrisyIndex: { chiScore: 85, grade: "F", directConflicts: 1, indirectConflicts: 0, alignedStances: 0, totalStances: 1 },
    politicalRisk: { riskScore: 72, grade: "F", revolvingDoorCount: 0, darkMoneyPercentage: 59, stakeholderDisconnect: 75, flaggedOrgCount: 2 },
    benchmark: { industry: "Food & Beverage", transparencyGrade: "F", industryRank: 12, industryTotal: 12, peerAvgCivicFootprint: 35, peerAvgLobbying: 2000000, peerAvgPacSpending: 1500000, isIndustryLeader: false },
  },
  {
    id: "hobby-lobby",
    name: "Hobby Lobby",
    industry: "Retail",
    revenue: "$7.7B",
    employeeCount: "~47,000",
    description: "American retail chain of arts and crafts stores.",
    state: "OK",
    lastUpdated: "2025-10-30",
    confidenceRating: "high",
    civicFootprintScore: 91,
    corporatePacExists: false,
    totalPacSpending: 0,
    partyBreakdown: [],
    candidates: [],
    executives: [
      {
        name: "David Green",
        title: "Founder & CEO",
        totalDonations: 18000000,
        topRecipients: [
          { name: "Museum of the Bible", amount: 10000000, party: "R" },
          { name: "Alliance Defending Freedom", amount: 5000000, party: "R" },
          { name: "National Christian Foundation", amount: 3000000, party: "R" },
        ],
      },
    ],
    superPacs: [],
    darkMoneyOrgs: [
      { name: "Alliance Defending Freedom", type: "501c4", estimatedAmount: 5000000, relationship: "CEO David Green is a major donor", confidence: "direct", description: "ADF is designated as an anti-LGBTQ+ hate group by SPLC. Operates as a 501(c)(3) legal organization but engages in extensive political advocacy.", source: "SPLC, tax filings" },
    ],
    revolvingDoor: [],
    spendingHistory: [
      { cycle: "2020", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 15000000 },
      { cycle: "2022", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 16000000 },
      { cycle: "2024", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 17000000 },
      { cycle: "2026", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 18000000 },
    ],
    tradeAssociations: [],
    flaggedOrgTies: [
      { orgName: "Alliance Defending Freedom", relationship: "direct-funding", confidence: "direct", description: "CEO David Green has donated $5M+ to ADF, designated as an anti-LGBTQ+ hate group by SPLC.", source: "SPLC, tax filings" },
      { orgName: "National Christian Foundation", relationship: "foundation-grant", confidence: "direct", description: "Green family foundation has donated $3M+ to NCF.", source: "Tax filings" },
    ],
    boardAffiliations: ["Museum of the Bible (Founder)"],
    publicStances: [
      { topic: "Reproductive Rights", publicPosition: "Company sued the government to avoid covering contraceptives (Burwell v. Hobby Lobby, 2014)", spendingReality: "Funds organizations that advocate for further restrictions on reproductive rights", gap: "aligned" },
      { topic: "Religious Liberty", publicPosition: "Publicly frames business around Christian values", spendingReality: "CEO's donations go to organizations classified as anti-LGBTQ+ by civil rights watchdogs", gap: "aligned" },
    ],
    workerRelevance: "Company has successfully argued for religious exemptions that affect employee healthcare benefits (contraceptive coverage).",
    consumerRelevance: "Revenue directly supports a family-owned business whose leadership funds organizations opposing LGBTQ+ rights and reproductive healthcare access.",
    influenceROI: { totalPoliticalSpending: 18000000, totalGovernmentBenefits: 0, roiRatio: 0, grade: "N/A" },
    hypocrisyIndex: { chiScore: 0, grade: "A+", directConflicts: 0, indirectConflicts: 0, alignedStances: 2, totalStances: 2 },
    politicalRisk: { riskScore: 78, grade: "F", revolvingDoorCount: 0, darkMoneyPercentage: 28, stakeholderDisconnect: 65, flaggedOrgCount: 2 },
    benchmark: { industry: "Retail", transparencyGrade: "F", industryRank: 8, industryTotal: 8, peerAvgCivicFootprint: 45, peerAvgLobbying: 3500000, peerAvgPacSpending: 2800000, isIndustryLeader: false },
  },
  {
    id: "google",
    name: "Alphabet (Google)",
    industry: "Technology",
    revenue: "$307B",
    employeeCount: "~182,000",
    description: "Multinational technology conglomerate and parent company of Google.",
    state: "CA",
    careersUrl: "https://careers.google.com",
    lastUpdated: "2026-01-10",
    confidenceRating: "high",
    civicFootprintScore: 18,
    corporatePacExists: true,
    totalPacSpending: 5100000,
    lobbyingSpend: 13400000,
    partyBreakdown: [
      { party: "Republican", amount: 1785000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 3060000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 255000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Mark Warner", party: "D", state: "VA", amount: 15000, type: "corporate-pac", flagged: false },
      { name: "Rep. Anna Eshoo", party: "D", state: "CA", district: "16th", amount: 12000, type: "corporate-pac", flagged: false },
      { name: "Sen. Roger Wicker", party: "R", state: "MS", amount: 10000, type: "corporate-pac", flagged: false },
    ],
    executives: [
      {
        name: "Sundar Pichai",
        title: "CEO",
        totalDonations: 250000,
        topRecipients: [
          { name: "DNC Services Corp", amount: 100000, party: "D" },
          { name: "Biden Victory Fund", amount: 100000, party: "D" },
          { name: "TechNet", amount: 50000, party: "D" },
        ],
      },
    ],
    superPacs: [],
    darkMoneyOrgs: [],
    revolvingDoor: [
      { person: "Susan Molinari", formerRole: "U.S. Representative (R-NY)", currentRole: "Former VP of Public Policy, Google", relevance: "Former congresswoman who led Google's lobbying operation in Washington.", confidence: "direct" },
    ],
    governmentContracts: 2700000000,
    effectiveTaxRate: "16.2%",
    spendingHistory: [
      { cycle: "2020", pacSpending: 4200000, lobbyingSpend: 11800000, executiveGiving: 200000 },
      { cycle: "2022", pacSpending: 4600000, lobbyingSpend: 12500000, executiveGiving: 220000 },
      { cycle: "2024", pacSpending: 4900000, lobbyingSpend: 13000000, executiveGiving: 240000 },
      { cycle: "2026", pacSpending: 5100000, lobbyingSpend: 13400000, executiveGiving: 250000 },
    ],
    tradeAssociations: ["U.S. Chamber of Commerce", "Internet Association", "TechNet", "Business Roundtable"],
    flaggedOrgTies: [],
    boardAffiliations: [],
    publicStances: [
      { topic: "Climate", publicPosition: "Committed to carbon-free energy by 2030", spendingReality: "Lobbies on energy policy; member of Chamber of Commerce which has opposed climate legislation", gap: "mixed" },
      { topic: "Data Privacy", publicPosition: "Supports responsible privacy frameworks", spendingReality: "Lobbies heavily against strict privacy regulations", gap: "contradictory" },
    ],
    workerRelevance: "PAC spending is broadly distributed across both parties. Significant lobbying budget focused on tech regulation and antitrust. Generally considered a progressive employer.",
    consumerRelevance: "Using Google products supports a company with massive lobbying influence on tech regulation, privacy, and antitrust policy.",
    influenceROI: { totalPoliticalSpending: 18750000, totalGovernmentBenefits: 2700000000, roiRatio: 144.0, policyWinRate: 68, grade: "A+" },
    hypocrisyIndex: { chiScore: 55, grade: "D", directConflicts: 1, indirectConflicts: 1, alignedStances: 0, totalStances: 2 },
    politicalRisk: { riskScore: 35, grade: "B", revolvingDoorCount: 1, darkMoneyPercentage: 0, stakeholderDisconnect: 30, flaggedOrgCount: 0 },
    benchmark: { industry: "Technology", transparencyGrade: "A", cpaZicklinScore: 82, industryRank: 2, industryTotal: 15, peerAvgCivicFootprint: 30, peerAvgLobbying: 8000000, peerAvgPacSpending: 3000000, isIndustryLeader: true },
    roiPipeline: {
      totalSpending: 18750000, totalBenefits: 2700000000,
      moneyIn: [
        { label: "Corporate PAC", amount: 5100000, type: "PAC" },
        { label: "Lobbying", amount: 13400000, type: "Lobbying" },
        { label: "Sundar Pichai (Personal)", amount: 250000, type: "Executive" },
      ],
      network: [
        { label: "Sen. Mark Warner", role: "Intelligence Committee — tech oversight", type: "Recipient" },
        { label: "Susan Molinari", role: "Former Rep (R-NY) → Google VP of Public Policy", type: "Revolving Door" },
        { label: "Business Roundtable", role: "Lobbies on antitrust & AI regulation", type: "Trade Group" },
      ],
      benefitsOut: [
        { label: "Federal Cloud Contracts", amount: 2700000000, type: "Contracts" },
      ],
      linkages: [
        { source: "Google PAC", target: "Sen. Mark Warner", description: "$15K donation; Warner on Intelligence Committee overseeing tech surveillance", confidence: 1.0 },
        { source: "Susan Molinari", target: "Google Policy Team", description: "Former congresswoman hired to lead Google's DC lobbying operation", confidence: 1.0 },
        { source: "Google Lobbying ($13.4M)", target: "Antitrust Legislation", description: "Lobbied against antitrust bills targeting search dominance", confidence: 0.9 },
        { source: "Federal Cloud Services", target: "Google Cloud", description: "$2.7B in federal cloud infrastructure contracts (DoD, civilian)", confidence: 1.0 },
      ],
    },
  },
  {
    id: "walmart",
    name: "Walmart",
    industry: "Retail",
    revenue: "$648B",
    employeeCount: "~2,100,000",
    description: "American multinational retail corporation operating hypermarkets and grocery stores.",
    state: "AR",
    careersUrl: "https://careers.walmart.com",
    lastUpdated: "2026-02-01",
    confidenceRating: "high",
    civicFootprintScore: 55,
    corporatePacExists: true,
    totalPacSpending: 3800000,
    lobbyingSpend: 8200000,
    partyBreakdown: [
      { party: "Republican", amount: 2280000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 1330000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 190000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Tom Cotton", party: "R", state: "AR", amount: 15000, type: "corporate-pac", flagged: true, flagReason: "Endorsed by Christian Nationalist orgs" },
      { name: "Rep. Steve Womack", party: "R", state: "AR", district: "3rd", amount: 10000, type: "corporate-pac", flagged: false },
      { name: "Sen. Mark Pryor", party: "D", state: "AR", amount: 8000, type: "corporate-pac", flagged: false },
    ],
    executives: [
      {
        name: "Alice Walton",
        title: "Board Member",
        totalDonations: 7500000,
        topRecipients: [
          { name: "Conduit for Action", amount: 3000000, party: "R" },
          { name: "Congressional Leadership Fund", amount: 2500000, party: "R" },
          { name: "Republican Governors Association", amount: 2000000, party: "R" },
        ],
      },
    ],
    superPacs: [
      { name: "Congressional Leadership Fund", type: "super-pac", amount: 2500000, relationship: "leadership-linked", description: "Alice Walton is a top donor to CLF, the main Super PAC supporting House Republican candidates.", confidence: "direct" },
    ],
    darkMoneyOrgs: [],
    revolvingDoor: [
      { person: "Multiple", formerRole: "Congressional staffers", currentRole: "Walmart government affairs team", relevance: "Walmart employs one of the largest corporate lobbying teams in Washington, heavily staffed by former Hill aides.", confidence: "inferred" },
    ],
    governmentContracts: 1200000000,
    subsidiesReceived: 890000000,
    effectiveTaxRate: "24.5%",
    spendingHistory: [
      { cycle: "2020", pacSpending: 3200000, lobbyingSpend: 7500000, executiveGiving: 6000000 },
      { cycle: "2022", pacSpending: 3500000, lobbyingSpend: 7800000, executiveGiving: 6500000 },
      { cycle: "2024", pacSpending: 3700000, lobbyingSpend: 8000000, executiveGiving: 7000000 },
      { cycle: "2026", pacSpending: 3800000, lobbyingSpend: 8200000, executiveGiving: 7500000 },
    ],
    tradeAssociations: ["National Retail Federation", "U.S. Chamber of Commerce", "Business Roundtable"],
    flaggedOrgTies: [
      { orgName: "Conduit for Action", relationship: "direct-funding", confidence: "direct", description: "Alice Walton has donated $3M to Conduit for Action, a conservative Arkansas PAC.", source: "OpenSecrets.org" },
    ],
    boardAffiliations: [],
    publicStances: [
      { topic: "Wages & Labor", publicPosition: "Raised minimum wage to $14/hr, promotes advancement opportunities", spendingReality: "Lobbies against federal minimum wage increases and has opposed unionization efforts", gap: "contradictory" },
      { topic: "Sustainability", publicPosition: "Project Gigaton emissions reduction commitment", spendingReality: "Member of trade associations that have opposed climate legislation", gap: "mixed" },
    ],
    workerRelevance: "As the nation's largest private employer, Walmart's lobbying on labor policy, minimum wage, and union rights directly affects millions of workers.",
    consumerRelevance: "Purchases support a company with significant political influence through lobbying, PAC spending, and Walton family personal donations.",
    influenceROI: { totalPoliticalSpending: 19500000, totalGovernmentBenefits: 2090000000, roiRatio: 107.2, policyWinRate: 74, grade: "A+" },
    hypocrisyIndex: { chiScore: 72, grade: "F", directConflicts: 1, indirectConflicts: 1, alignedStances: 0, totalStances: 2 },
    politicalRisk: { riskScore: 52, grade: "C", revolvingDoorCount: 1, darkMoneyPercentage: 0, stakeholderDisconnect: 50, flaggedOrgCount: 1 },
    benchmark: { industry: "Retail", transparencyGrade: "B+", cpaZicklinScore: 70, industryRank: 2, industryTotal: 8, peerAvgCivicFootprint: 45, peerAvgLobbying: 3500000, peerAvgPacSpending: 2800000, isIndustryLeader: false },
    roiPipeline: {
      totalSpending: 19500000, totalBenefits: 2090000000,
      moneyIn: [
        { label: "Corporate PAC", amount: 3800000, type: "PAC" },
        { label: "Lobbying", amount: 8200000, type: "Lobbying" },
        { label: "Alice Walton (Personal)", amount: 7500000, type: "Executive" },
      ],
      network: [
        { label: "Sen. Tom Cotton", role: "Armed Services & Banking Committees", type: "Recipient" },
        { label: "Congressional Leadership Fund", role: "Super PAC — Alice Walton top donor", type: "Super PAC" },
        { label: "Walmart Gov Affairs Team", role: "Former Hill staffers → corporate lobbying", type: "Revolving Door" },
      ],
      benefitsOut: [
        { label: "Federal Contracts", amount: 1200000000, type: "Contracts" },
        { label: "State/Local Subsidies", amount: 890000000, type: "Subsidies" },
      ],
      linkages: [
        { source: "Walmart PAC", target: "Sen. Tom Cotton (AR)", description: "$15K donation; Cotton represents Walmart's home state, sits on Banking Committee", confidence: 1.0 },
        { source: "Alice Walton", target: "Congressional Leadership Fund", description: "$2.5M personal donation to Republican House Super PAC", confidence: 1.0 },
        { source: "Walmart Lobbying ($8.2M)", target: "Minimum Wage Legislation", description: "Lobbied against federal $15/hr minimum wage increase", confidence: 0.9 },
        { source: "Federal & State Procurement", target: "Walmart", description: "$1.2B federal + $890M state subsidies and tax incentives", confidence: 1.0 },
      ],
    },
  },
  {
    id: "patagonia",
    name: "Patagonia",
    industry: "Retail / Apparel",
    revenue: "$1.5B",
    employeeCount: "~3,000",
    description: "Outdoor clothing and gear company known for environmental activism. Ownership transferred to Holdfast Collective, a nonprofit.",
    state: "CA",
    careersUrl: "https://www.patagonia.com/careers",
    lastUpdated: "2026-01-25",
    confidenceRating: "high",
    civicFootprintScore: 5,
    corporatePacExists: false,
    totalPacSpending: 0,
    partyBreakdown: [],
    candidates: [],
    executives: [
      {
        name: "Ryan Gellert",
        title: "CEO",
        totalDonations: 50000,
        topRecipients: [
          { name: "League of Conservation Voters", amount: 25000, party: "D" },
          { name: "Environmental Defense Fund", amount: 15000, party: "D" },
          { name: "ActBlue", amount: 10000, party: "D" },
        ],
      },
    ],
    superPacs: [],
    darkMoneyOrgs: [],
    revolvingDoor: [],
    spendingHistory: [
      { cycle: "2020", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 30000 },
      { cycle: "2022", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 35000 },
      { cycle: "2024", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 45000 },
      { cycle: "2026", pacSpending: 0, lobbyingSpend: 0, executiveGiving: 50000 },
    ],
    tradeAssociations: ["1% for the Planet", "Outdoor Industry Association"],
    flaggedOrgTies: [],
    boardAffiliations: ["Holdfast Collective (ownership nonprofit)"],
    publicStances: [
      { topic: "Climate & Environment", publicPosition: "Company exists to 'save our home planet'", spendingReality: "Transferred ownership to environmental nonprofit; CEO donations go to conservation orgs", gap: "aligned" },
    ],
    workerRelevance: "Company's political activity is minimal and focused on environmental causes. Ownership structure donates profits to environmental nonprofits.",
    consumerRelevance: "Purchases support a company whose profits now fund environmental nonprofits through its ownership structure.",
    influenceROI: { totalPoliticalSpending: 50000, totalGovernmentBenefits: 0, roiRatio: 0, grade: "N/A" },
    hypocrisyIndex: { chiScore: 0, grade: "A+", directConflicts: 0, indirectConflicts: 0, alignedStances: 1, totalStances: 1 },
    politicalRisk: { riskScore: 5, grade: "A+", revolvingDoorCount: 0, darkMoneyPercentage: 0, stakeholderDisconnect: 0, flaggedOrgCount: 0 },
    benchmark: { industry: "Retail / Apparel", transparencyGrade: "A+", cpaZicklinScore: 95, industryRank: 1, industryTotal: 5, peerAvgCivicFootprint: 30, peerAvgLobbying: 500000, peerAvgPacSpending: 200000, isIndustryLeader: true },
  },
  {
    id: "koch-industries",
    name: "Koch Industries",
    industry: "Conglomerate",
    revenue: "$125B",
    employeeCount: "~120,000",
    description: "Multinational conglomerate with operations in petroleum, chemicals, and more.",
    state: "KS",
    lastUpdated: "2026-01-18",
    confidenceRating: "high",
    civicFootprintScore: 88,
    corporatePacExists: true,
    totalPacSpending: 6200000,
    lobbyingSpend: 12500000,
    partyBreakdown: [
      { party: "Republican", amount: 5580000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 310000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 310000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Mike Lee", party: "R", state: "UT", amount: 20000, type: "corporate-pac", flagged: true, flagReason: "Project 2025 contributor" },
      { name: "Sen. Ron Johnson", party: "R", state: "WI", amount: 18000, type: "corporate-pac", flagged: true, flagReason: "Ties to dominionist networks" },
      { name: "Rep. Jim Banks", party: "R", state: "IN", district: "3rd", amount: 15000, type: "corporate-pac", flagged: true, flagReason: "Christian Nationalist caucus member" },
    ],
    executives: [
      {
        name: "Charles Koch",
        title: "Chairman & CEO",
        totalDonations: 45000000,
        topRecipients: [
          { name: "Americans for Prosperity", amount: 20000000, party: "R" },
          { name: "Freedom Partners", amount: 15000000, party: "R" },
          { name: "Stand Together", amount: 10000000, party: "R" },
        ],
      },
    ],
    superPacs: [
      { name: "Freedom Partners Action Fund", type: "super-pac", amount: 60000000, relationship: "corporate-affiliated", description: "Koch network Super PAC that has spent tens of millions on conservative candidates.", confidence: "direct" },
    ],
    darkMoneyOrgs: [
      { name: "Americans for Prosperity", type: "501c4", estimatedAmount: 400000000, relationship: "Koch-founded and funded", confidence: "direct", description: "501(c)(4) that does not disclose donors. Has spent hundreds of millions on political advocacy opposing climate legislation, healthcare reform, and labor protections.", source: "OpenSecrets.org, investigative reporting" },
      { name: "Donors Trust", type: "501c4", estimatedAmount: 100000000, relationship: "Koch network donor-advised fund", confidence: "inferred", description: "Donor-advised fund that channels money to conservative causes while obscuring the original donors.", source: "Tax filings, investigative journalism" },
    ],
    revolvingDoor: [
      { person: "Marc Short", formerRole: "VP Mike Pence's Chief of Staff", currentRole: "Koch network political operative", relevance: "Senior White House official who moved between Koch political operations and government.", confidence: "direct" },
      { person: "Multiple EPA officials", formerRole: "Koch Industries employees", currentRole: "EPA appointees during Trump administration", relevance: "Koch-linked individuals placed in the agency that regulates Koch's petroleum operations.", confidence: "inferred" },
    ],
    governmentContracts: 350000000,
    effectiveTaxRate: "Not publicly disclosed (private company)",
    spendingHistory: [
      { cycle: "2020", pacSpending: 5800000, lobbyingSpend: 11000000, executiveGiving: 40000000 },
      { cycle: "2022", pacSpending: 6000000, lobbyingSpend: 11500000, executiveGiving: 42000000 },
      { cycle: "2024", pacSpending: 6100000, lobbyingSpend: 12000000, executiveGiving: 44000000 },
      { cycle: "2026", pacSpending: 6200000, lobbyingSpend: 12500000, executiveGiving: 45000000 },
    ],
    tradeAssociations: ["American Petroleum Institute", "National Association of Manufacturers", "U.S. Chamber of Commerce"],
    flaggedOrgTies: [
      { orgName: "Americans for Prosperity", relationship: "direct-funding", confidence: "direct", description: "Koch-founded organization that has spent billions on conservative political infrastructure.", source: "OpenSecrets.org, public reporting" },
      { orgName: "Stand Together", relationship: "direct-funding", confidence: "direct", description: "Koch network umbrella organization funding conservative causes.", source: "Public reporting" },
    ],
    boardAffiliations: ["Americans for Prosperity (Founder)", "Stand Together (Founder)"],
    publicStances: [
      { topic: "Climate Change", publicPosition: "Has acknowledged need for energy innovation", spendingReality: "Spent billions opposing climate legislation and funding climate change skepticism", gap: "contradictory" },
      { topic: "Criminal Justice Reform", publicPosition: "Publicly supported bipartisan criminal justice reform", spendingReality: "Funded reform efforts through Stand Together — a rare bipartisan stance", gap: "aligned" },
    ],
    workerRelevance: "Koch Industries' political network is one of the most influential in American politics. Working here means contributing to a company whose leadership actively shapes conservative policy.",
    consumerRelevance: "Koch subsidiaries include Georgia-Pacific (Brawny, Dixie, Quilted Northern), Guardian Industries, and Molex. Revenue supports extensive political infrastructure.",
    influenceROI: { totalPoliticalSpending: 63700000, totalGovernmentBenefits: 350000000, roiRatio: 5.5, policyWinRate: 81, grade: "A" },
    hypocrisyIndex: { chiScore: 50, grade: "D", directConflicts: 1, indirectConflicts: 0, alignedStances: 1, totalStances: 2 },
    politicalRisk: { riskScore: 92, grade: "F", revolvingDoorCount: 2, darkMoneyPercentage: 78, stakeholderDisconnect: 70, flaggedOrgCount: 2 },
    benchmark: { industry: "Conglomerate", transparencyGrade: "F", industryRank: 10, industryTotal: 10, peerAvgCivicFootprint: 40, peerAvgLobbying: 5000000, peerAvgPacSpending: 3000000, isIndustryLeader: false },
    roiPipeline: {
      totalSpending: 63700000, totalBenefits: 350000000,
      moneyIn: [
        { label: "Corporate PAC", amount: 6200000, type: "PAC" },
        { label: "Lobbying", amount: 12500000, type: "Lobbying" },
        { label: "Charles Koch (Personal)", amount: 45000000, type: "Executive" },
      ],
      network: [
        { label: "Americans for Prosperity", role: "Koch-founded 501(c)(4) — $400M+ political spending", type: "Dark Money" },
        { label: "Marc Short", role: "VP Pence Chief of Staff → Koch network", type: "Revolving Door" },
        { label: "EPA Appointees", role: "Koch employees → Trump EPA officials", type: "Revolving Door" },
        { label: "Sen. Mike Lee", role: "Judiciary Committee — deregulation ally", type: "Recipient" },
      ],
      benefitsOut: [
        { label: "Federal Contracts", amount: 350000000, type: "Contracts" },
      ],
      linkages: [
        { source: "Koch PAC", target: "Sen. Mike Lee", description: "$20K donation; Lee on Judiciary Committee pushing deregulation agenda aligned with Koch interests", confidence: 1.0 },
        { source: "Koch Network", target: "Americans for Prosperity", description: "$400M+ channeled through 501(c)(4) for political advocacy without donor disclosure", confidence: 0.9 },
        { source: "Marc Short", target: "VP Pence's Office → Koch Ops", description: "Revolving door between White House and Koch political network", confidence: 1.0 },
        { source: "Koch Employees", target: "EPA Appointments", description: "Multiple Koch-linked individuals placed at EPA, which regulates Koch's petrochemical operations", confidence: 0.7 },
        { source: "Federal Procurement", target: "Koch Industries", description: "$350M in federal contracts across subsidiaries", confidence: 1.0 },
      ],
    },
  },
  {
    id: "costco",
    name: "Costco",
    industry: "Retail",
    revenue: "$242B",
    employeeCount: "~316,000",
    description: "American multinational corporation operating a chain of membership-only warehouse clubs.",
    state: "WA",
    careersUrl: "https://www.costco.com/jobs.html",
    lastUpdated: "2026-02-05",
    confidenceRating: "high",
    civicFootprintScore: 22,
    corporatePacExists: true,
    totalPacSpending: 1200000,
    lobbyingSpend: 1800000,
    partyBreakdown: [
      { party: "Republican", amount: 420000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 720000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 60000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Patty Murray", party: "D", state: "WA", amount: 10000, type: "corporate-pac", flagged: false },
      { name: "Rep. Suzan DelBene", party: "D", state: "WA", district: "1st", amount: 8000, type: "corporate-pac", flagged: false },
    ],
    executives: [
      {
        name: "Craig Jelinek",
        title: "Former CEO",
        totalDonations: 180000,
        topRecipients: [
          { name: "DNC Services Corp", amount: 100000, party: "D" },
          { name: "ActBlue", amount: 50000, party: "D" },
          { name: "Biden Victory Fund", amount: 30000, party: "D" },
        ],
      },
    ],
    superPacs: [],
    darkMoneyOrgs: [],
    revolvingDoor: [],
    spendingHistory: [
      { cycle: "2020", pacSpending: 900000, lobbyingSpend: 1400000, executiveGiving: 150000 },
      { cycle: "2022", pacSpending: 1000000, lobbyingSpend: 1500000, executiveGiving: 160000 },
      { cycle: "2024", pacSpending: 1100000, lobbyingSpend: 1700000, executiveGiving: 170000 },
      { cycle: "2026", pacSpending: 1200000, lobbyingSpend: 1800000, executiveGiving: 180000 },
    ],
    tradeAssociations: ["National Retail Federation"],
    flaggedOrgTies: [],
    boardAffiliations: [],
    publicStances: [
      { topic: "Wages & Labor", publicPosition: "Known for above-average wages and benefits", spendingReality: "PAC spending is modest and leans Democrat; no significant anti-labor lobbying", gap: "aligned" },
    ],
    workerRelevance: "Costco is widely considered one of the better large retailers for workers. PAC spending is modest and broadly distributed.",
    consumerRelevance: "Membership fees support a company with relatively modest and balanced political spending.",
    influenceROI: { totalPoliticalSpending: 3000000, totalGovernmentBenefits: 0, roiRatio: 0, grade: "N/A" },
    hypocrisyIndex: { chiScore: 0, grade: "A+", directConflicts: 0, indirectConflicts: 0, alignedStances: 1, totalStances: 1 },
    politicalRisk: { riskScore: 8, grade: "A+", revolvingDoorCount: 0, darkMoneyPercentage: 0, stakeholderDisconnect: 5, flaggedOrgCount: 0 },
    benchmark: { industry: "Retail", transparencyGrade: "A", cpaZicklinScore: 88, industryRank: 1, industryTotal: 8, peerAvgCivicFootprint: 45, peerAvgLobbying: 3500000, peerAvgPacSpending: 2800000, isIndustryLeader: true },
  },
];

export const industries = [...new Set(companies.map((c) => c.industry))].sort();
