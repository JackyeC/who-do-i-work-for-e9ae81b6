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

  // Influence Network
  tradeAssociations: string[];
  flaggedOrgTies: FlaggedOrgTie[];
  boardAffiliations: string[];

  // Public Stance vs Spending
  publicStances: PublicStance[];

  // Worker / Consumer Relevance
  workerRelevance: string;
  consumerRelevance: string;

  // Legacy — renamed from alignmentScore
  civicFootprintScore: number; // 0-100, higher = more concentrated influence
}

export interface Candidate {
  name: string;
  party: "R" | "D" | "I";
  state: string;
  district?: string;
  amount: number;
  type: "corporate-pac" | "executive-personal";
  flagged: boolean;
  flagReason?: string;
}

export interface Executive {
  name: string;
  title: string;
  totalDonations: number;
  topRecipients: { name: string; amount: number; party: "R" | "D" | "I" }[];
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getFootprintLabel(score: number): { label: string; description: string; color: string } {
  if (score >= 70) return { label: "High Concentration", description: "Influence is heavily concentrated in one political direction", color: "civic-red" };
  if (score >= 40) return { label: "Mixed Influence", description: "Spending distributed across parties with some concentration", color: "civic-yellow" };
  return { label: "Broad / Low Influence", description: "Minimal or broadly distributed political spending", color: "civic-green" };
}

export function formatCurrency(amount: number): string {
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
    tradeAssociations: ["U.S. Chamber of Commerce", "Internet Association", "TechNet", "Business Roundtable"],
    flaggedOrgTies: [],
    boardAffiliations: [],
    publicStances: [
      { topic: "Climate", publicPosition: "Committed to carbon-free energy by 2030", spendingReality: "Lobbies on energy policy; member of Chamber of Commerce which has opposed climate legislation", gap: "mixed" },
      { topic: "Data Privacy", publicPosition: "Supports responsible privacy frameworks", spendingReality: "Lobbies heavily against strict privacy regulations", gap: "contradictory" },
    ],
    workerRelevance: "PAC spending is broadly distributed across both parties. Significant lobbying budget focused on tech regulation and antitrust. Generally considered a progressive employer.",
    consumerRelevance: "Using Google products supports a company with massive lobbying influence on tech regulation, privacy, and antitrust policy.",
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
    tradeAssociations: ["1% for the Planet", "Outdoor Industry Association"],
    flaggedOrgTies: [],
    boardAffiliations: ["Holdfast Collective (ownership nonprofit)"],
    publicStances: [
      { topic: "Climate & Environment", publicPosition: "Company exists to 'save our home planet'", spendingReality: "Transferred ownership to environmental nonprofit; CEO donations go to conservation orgs", gap: "aligned" },
    ],
    workerRelevance: "Company's political activity is minimal and focused on environmental causes. Ownership structure donates profits to environmental nonprofits.",
    consumerRelevance: "Purchases support a company whose profits now fund environmental nonprofits through its ownership structure.",
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
    tradeAssociations: ["National Retail Federation"],
    flaggedOrgTies: [],
    boardAffiliations: [],
    publicStances: [
      { topic: "Wages & Labor", publicPosition: "Known for above-average wages and benefits", spendingReality: "PAC spending is modest and leans Democrat; no significant anti-labor lobbying", gap: "aligned" },
    ],
    workerRelevance: "Costco is widely considered one of the better large retailers for workers. PAC spending is modest and broadly distributed.",
    consumerRelevance: "Membership fees support a company with relatively modest and balanced political spending.",
  },
];

export const industries = [...new Set(companies.map((c) => c.industry))].sort();
