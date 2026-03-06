export interface Company {
  id: string;
  name: string;
  industry: string;
  revenue: string;
  description: string;
  alignmentScore: number; // 0-100, higher = more flagged affiliations
  totalPacSpending: number;
  partyBreakdown: { party: string; amount: number; color: string }[];
  candidates: Candidate[];
  executives: Executive[];
  lastUpdated: string;
  state: string;
}

export interface Candidate {
  name: string;
  party: "R" | "D" | "I";
  state: string;
  district?: string;
  amount: number;
  flagged: boolean;
  flagReason?: string;
}

export interface Executive {
  name: string;
  title: string;
  totalDonations: number;
  topRecipients: { name: string; amount: number; party: "R" | "D" | "I" }[];
}

export const companies: Company[] = [
  {
    id: "home-depot",
    name: "The Home Depot",
    industry: "Retail",
    revenue: "$157B",
    description: "Home improvement retail corporation operating stores across North America.",
    alignmentScore: 72,
    totalPacSpending: 4200000,
    state: "GA",
    partyBreakdown: [
      { party: "Republican", amount: 2940000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 1050000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 210000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Ted Cruz", party: "R", state: "TX", amount: 15000, flagged: true, flagReason: "Endorsed by Christian Nationalist PACs" },
      { name: "Sen. Marsha Blackburn", party: "R", state: "TN", amount: 12000, flagged: true, flagReason: "Supports Project 2025 agenda" },
      { name: "Rep. Jim Jordan", party: "R", state: "OH", district: "4th", amount: 10000, flagged: true, flagReason: "Ties to dominionist organizations" },
      { name: "Sen. Jon Ossoff", party: "D", state: "GA", amount: 8000, flagged: false },
      { name: "Rep. Lucy McBath", party: "D", state: "GA", district: "7th", amount: 5000, flagged: false },
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
    lastUpdated: "2025-12-15",
  },
  {
    id: "chick-fil-a",
    name: "Chick-fil-A",
    industry: "Food & Beverage",
    revenue: "$21.6B",
    description: "American fast food restaurant chain specializing in chicken sandwiches.",
    alignmentScore: 85,
    totalPacSpending: 0,
    state: "GA",
    partyBreakdown: [
      { party: "Republican", amount: 0, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 0, color: "hsl(220, 65%, 48%)" },
    ],
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
    lastUpdated: "2025-11-20",
  },
  {
    id: "hobby-lobby",
    name: "Hobby Lobby",
    industry: "Retail",
    revenue: "$7.7B",
    description: "American retail chain of arts and crafts stores.",
    alignmentScore: 91,
    totalPacSpending: 0,
    state: "OK",
    partyBreakdown: [
      { party: "Republican", amount: 0, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 0, color: "hsl(220, 65%, 48%)" },
    ],
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
    lastUpdated: "2025-10-30",
  },
  {
    id: "google",
    name: "Alphabet (Google)",
    industry: "Technology",
    revenue: "$307B",
    description: "Multinational technology conglomerate and parent company of Google.",
    alignmentScore: 18,
    totalPacSpending: 5100000,
    state: "CA",
    partyBreakdown: [
      { party: "Republican", amount: 1785000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 3060000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 255000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Mark Warner", party: "D", state: "VA", amount: 15000, flagged: false },
      { name: "Rep. Anna Eshoo", party: "D", state: "CA", district: "16th", amount: 12000, flagged: false },
      { name: "Sen. Roger Wicker", party: "R", state: "MS", amount: 10000, flagged: false },
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
    lastUpdated: "2026-01-10",
  },
  {
    id: "walmart",
    name: "Walmart",
    industry: "Retail",
    revenue: "$648B",
    description: "American multinational retail corporation operating hypermarkets and grocery stores.",
    alignmentScore: 55,
    totalPacSpending: 3800000,
    state: "AR",
    partyBreakdown: [
      { party: "Republican", amount: 2280000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 1330000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 190000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Tom Cotton", party: "R", state: "AR", amount: 15000, flagged: true, flagReason: "Endorsed by Christian Nationalist orgs" },
      { name: "Rep. Steve Womack", party: "R", state: "AR", district: "3rd", amount: 10000, flagged: false },
      { name: "Sen. Mark Pryor", party: "D", state: "AR", amount: 8000, flagged: false },
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
    lastUpdated: "2026-02-01",
  },
  {
    id: "patagonia",
    name: "Patagonia",
    industry: "Retail / Apparel",
    revenue: "$1.5B",
    description: "Outdoor clothing and gear company known for environmental activism.",
    alignmentScore: 5,
    totalPacSpending: 0,
    state: "CA",
    partyBreakdown: [
      { party: "Republican", amount: 0, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 0, color: "hsl(220, 65%, 48%)" },
    ],
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
    lastUpdated: "2026-01-25",
  },
  {
    id: "koch-industries",
    name: "Koch Industries",
    industry: "Conglomerate",
    revenue: "$125B",
    description: "Multinational conglomerate with operations in petroleum, chemicals, and more.",
    alignmentScore: 88,
    totalPacSpending: 6200000,
    state: "KS",
    partyBreakdown: [
      { party: "Republican", amount: 5580000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 310000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 310000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Mike Lee", party: "R", state: "UT", amount: 20000, flagged: true, flagReason: "Project 2025 contributor" },
      { name: "Sen. Ron Johnson", party: "R", state: "WI", amount: 18000, flagged: true, flagReason: "Ties to dominionist networks" },
      { name: "Rep. Jim Banks", party: "R", state: "IN", district: "3rd", amount: 15000, flagged: true, flagReason: "Christian Nationalist caucus member" },
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
    lastUpdated: "2026-01-18",
  },
  {
    id: "costco",
    name: "Costco",
    industry: "Retail",
    revenue: "$242B",
    description: "American multinational corporation operating a chain of membership-only warehouse clubs.",
    alignmentScore: 22,
    totalPacSpending: 1200000,
    state: "WA",
    partyBreakdown: [
      { party: "Republican", amount: 420000, color: "hsl(0, 72%, 51%)" },
      { party: "Democrat", amount: 720000, color: "hsl(220, 65%, 48%)" },
      { party: "Other", amount: 60000, color: "hsl(215, 15%, 47%)" },
    ],
    candidates: [
      { name: "Sen. Patty Murray", party: "D", state: "WA", amount: 10000, flagged: false },
      { name: "Rep. Suzan DelBene", party: "D", state: "WA", district: "1st", amount: 8000, flagged: false },
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
    lastUpdated: "2026-02-05",
  },
];

export const industries = [...new Set(companies.map((c) => c.industry))].sort();

export function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "High Concern", color: "civic-red" };
  if (score >= 40) return { label: "Moderate", color: "civic-yellow" };
  return { label: "Low Concern", color: "civic-green" };
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
