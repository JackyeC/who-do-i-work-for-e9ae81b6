/**
 * WhoDoI Trail — Mock case data with rich viz data (CongressWatch-inspired).
 */
import type { CaseFile } from "./types";

export const DEMO_CASE: CaseFile = {
  id: "case-novacorp-001",
  companyName: "NovaCorp Industries",
  companyIndustry: "Technology & Defense",
  companyDescription: "A Fortune 200 tech conglomerate known for cloud infrastructure, AI hiring tools, and government contracting. Public image: innovative, inclusive, future-forward. Reality: TBD.",

  cards: [
    // ── RECEIPT CARDS ──
    {
      id: "r1", category: "receipt", title: "$4.2M PAC Spending (2024)",
      takeaway: "NovaCorp's PAC donated to 38 candidates across both parties.",
      whyItMatters: "PAC spending reveals where corporate influence flows — regardless of public brand values.",
      icon: "💰", confidence: "verified", paths: ["money"], act: 1,
      isRevealed: false, connectedTo: ["r2", "n1"],
      dataViz: {
        headline: "$4.2M",
        headlineLabel: "TOTAL PAC SPENDING",
        stats: [
          { label: "Recipients", value: "38", color: "#F2C14E" },
          { label: "PACs", value: "3", color: "#9B7BFF" },
          { label: "Cycles", value: "4", color: "#39C0BA" },
        ],
        bars: [
          { label: "Senate (R)", value: 1800000, color: "#FF6B6B" },
          { label: "Senate (D)", value: 920000, color: "#39C0BA" },
          { label: "House (R)", value: 860000, color: "#FF9F43" },
          { label: "House (D)", value: 620000, color: "#63D471" },
        ],
        breakdown: [
          { label: "Top Recipient", value: "Sen. J. Harmon (R-TX) — $340K", highlight: true },
          { label: "Energy Committee", value: "$1.1M across 8 members" },
          { label: "Defense Approps", value: "$890K across 6 members" },
        ],
      },
    },
    {
      id: "r2", category: "receipt", title: "$12M Lobbying (Anti-Labor)",
      takeaway: "Lobbied against the PRO Act and portable benefits legislation.",
      whyItMatters: "Publicly claims to support workers while funding opposition to worker protections.",
      icon: "🏛️", confidence: "verified", paths: ["money", "workers"], act: 1,
      isRevealed: false, connectedTo: ["r1", "c1"],
      dataViz: {
        headline: "$12M",
        headlineLabel: "LOBBYING SPEND (2022–2024)",
        stats: [
          { label: "Lobbyists", value: "14", color: "#FF9F43" },
          { label: "Bills Targeted", value: "7", color: "#FF6B6B" },
          { label: "Agencies", value: "5", color: "#9B7BFF" },
        ],
        bars: [
          { label: "Anti-PRO Act", value: 4200000, color: "#FF6B6B" },
          { label: "AI Deregulation", value: 3100000, color: "#F2C14E" },
          { label: "Tax Provisions", value: 2800000, color: "#9B7BFF" },
          { label: "Defense Approp.", value: 1900000, color: "#39C0BA" },
        ],
      },
    },
    {
      id: "r3", category: "receipt", title: "$890M Gov Defense Contracts",
      takeaway: "Largest revenue stream from DHS and DOD surveillance tech.",
      whyItMatters: "Workers may unknowingly build tools used for mass surveillance and border enforcement.",
      icon: "🛡️", confidence: "verified", paths: ["money", "executives"], act: 2,
      isRevealed: false, connectedTo: ["n2", "p2"],
      dataViz: {
        headline: "$890M",
        headlineLabel: "TOTAL CONTRACT VALUE",
        stats: [
          { label: "Contracts", value: "23", color: "#FF9F43" },
          { label: "Agencies", value: "4", color: "#9B7BFF" },
          { label: "Years", value: "6", color: "#39C0BA" },
        ],
        bars: [
          { label: "DHS / CBP", value: 340000000, color: "#FF6B6B" },
          { label: "DOD", value: 280000000, color: "#9B7BFF" },
          { label: "NSA", value: 180000000, color: "#F2C14E" },
          { label: "FBI", value: 90000000, color: "#FF9F43" },
        ],
      },
    },
    {
      id: "r4", category: "receipt", title: "$0 Effective Tax (2022–2024)",
      takeaway: "Paid zero federal income tax three years running despite $8B profit.",
      whyItMatters: "Tax avoidance shifts public costs onto the communities where employees live.",
      icon: "🧾", confidence: "verified", paths: ["money"], act: 2,
      isRevealed: false,
      dataViz: {
        headline: "0%",
        headlineLabel: "EFFECTIVE TAX RATE",
        stats: [
          { label: "Profit", value: "$8.1B", color: "#63D471" },
          { label: "Statutory", value: "21%", color: "#B9C0CC" },
          { label: "Paid", value: "$0", color: "#FF6B6B" },
        ],
        bars: [
          { label: "2024 Profit", value: 3200000000, color: "#63D471" },
          { label: "2023 Profit", value: 2700000000, color: "#39C0BA" },
          { label: "2022 Profit", value: 2200000000, color: "#F2C14E" },
        ],
        breakdown: [
          { label: "R&D Tax Credits", value: "$1.2B claimed" },
          { label: "Offshore Holdings", value: "Ireland, Singapore, Bermuda", highlight: true },
          { label: "Stock Comp Deduction", value: "$680M" },
        ],
      },
    },

    // ── PERSON CARDS ──
    {
      id: "p1", category: "person", title: "CEO Marcus Webb",
      takeaway: "Former McKinsey partner. Compensation: $47M/yr. Worker median: $62K.",
      whyItMatters: "CEO-to-worker pay ratio of 758:1 signals extraction, not shared prosperity.",
      icon: "👔", confidence: "verified", paths: ["executives", "money"], act: 1,
      isRevealed: false, connectedTo: ["p2", "r1"],
      personMeta: {
        role: "Chief Executive Officer",
        org: "NovaCorp Industries",
        photoInitials: "MW",
        compensation: "$47.3M",
        priorRole: "Senior Partner, McKinsey & Co.",
        stats: [
          { label: "Total Comp", value: "$47.3M", color: "#F2C14E" },
          { label: "Pay Ratio", value: "758:1", color: "#FF6B6B" },
          { label: "Tenure", value: "6 yrs", color: "#39C0BA" },
        ],
        barData: [
          { label: "Base Salary", value: 1500000, color: "#63D471" },
          { label: "Stock Awards", value: 28000000, color: "#F2C14E" },
          { label: "Options", value: 12000000, color: "#9B7BFF" },
          { label: "Bonus", value: 4800000, color: "#FF9F43" },
          { label: "Other", value: 1000000, color: "#39C0BA" },
        ],
      },
    },
    {
      id: "p2", category: "person", title: "Gen. Rita Vasquez (Ret.)",
      takeaway: "Former DHS Deputy Secretary. Joined board 6 months after leaving government.",
      whyItMatters: "Revolving-door appointments can create conflicts between public duty and corporate profit.",
      icon: "⭐", confidence: "verified", paths: ["executives", "money"], act: 2,
      isRevealed: false, connectedTo: ["r3", "n2"],
      personMeta: {
        role: "Board of Directors",
        org: "NovaCorp Industries",
        photoInitials: "RV",
        compensation: "$420K",
        priorRole: "Deputy Secretary, DHS (2019–2023)",
        stats: [
          { label: "Board Comp", value: "$420K", color: "#F2C14E" },
          { label: "Gov Exit", value: "6 mo", color: "#FF6B6B" },
          { label: "Other Boards", value: "3", color: "#9B7BFF" },
        ],
        barData: [
          { label: "Board Fee", value: 250000, color: "#F2C14E" },
          { label: "Stock Grants", value: 120000, color: "#9B7BFF" },
          { label: "Committee", value: 50000, color: "#39C0BA" },
        ],
      },
    },
    {
      id: "p3", category: "person", title: "CPO Dana Kim",
      takeaway: "Hired 2023 after previous CPO departed amid harassment allegations.",
      whyItMatters: "Leadership churn in People roles often signals unresolved cultural issues.",
      icon: "🧑‍💼", confidence: "partial", paths: ["executives", "workers"], act: 2,
      isRevealed: false, connectedTo: ["s2", "c2"],
      personMeta: {
        role: "Chief People Officer",
        org: "NovaCorp Industries",
        photoInitials: "DK",
        priorRole: "VP People, Stripe (2020–2023)",
        stats: [
          { label: "Tenure", value: "14 mo", color: "#FF9F43" },
          { label: "Predecessor", value: "Departed", color: "#FF6B6B" },
          { label: "Team Size", value: "340", color: "#39C0BA" },
        ],
      },
    },

    // ── CLAIM CARDS ──
    {
      id: "c1", category: "claim", title: '"Best Place to Work" Campaign',
      takeaway: "Spent $18M on employer branding in 2024 alone.",
      whyItMatters: "Compare branding spend to the $12M spent lobbying against worker protections.",
      icon: "✨", confidence: "verified", paths: ["image", "workers"], act: 1,
      isRevealed: false, connectedTo: ["r2", "s1"],
      dataViz: {
        headline: "$18M",
        headlineLabel: "BRANDING SPEND (2024)",
        bars: [
          { label: "Ad Campaigns", value: 8400000, color: "#39C0BA" },
          { label: "Sponsorships", value: 4200000, color: "#9B7BFF" },
          { label: "Awards Apps", value: 3100000, color: "#F2C14E" },
          { label: "Influencer", value: 2300000, color: "#FF9F43" },
        ],
      },
    },
    {
      id: "c2", category: "claim", title: '"Committed to DEI" Statement',
      takeaway: "Published equity report but quietly dissolved DEI team in Q3 2024.",
      whyItMatters: "Public claims without sustained investment may be performative.",
      icon: "🌈", confidence: "partial", paths: ["image", "workers"], act: 1,
      isRevealed: false, connectedTo: ["p3", "s3"],
      dataViz: {
        stats: [
          { label: "DEI Team Size", value: "0 (was 28)", color: "#FF6B6B" },
          { label: "ERG Budget", value: "Cut 70%", color: "#FF9F43" },
          { label: "Report Published", value: "Yes", color: "#63D471" },
        ],
      },
    },
    {
      id: "c3", category: "claim", title: '"AI Ethics Board" Announcement',
      takeaway: "Board has no external members and has published zero recommendations.",
      whyItMatters: "An ethics board with no independence or output is governance theater.",
      icon: "🤖", confidence: "emerging", paths: ["image", "executives"], act: 2,
      isRevealed: false, connectedTo: ["n3"],
      dataViz: {
        stats: [
          { label: "External Members", value: "0", color: "#FF6B6B" },
          { label: "Reports Published", value: "0", color: "#FF6B6B" },
          { label: "Meetings (2024)", value: "2", color: "#FF9F43" },
        ],
      },
    },

    // ── SIGNAL CARDS ──
    {
      id: "s1", category: "signal", title: "2,400 Layoffs (Jan 2025)",
      takeaway: "Cut 15% of workforce while posting record quarterly profits.",
      whyItMatters: "Profitable layoffs signal prioritizing shareholder returns over workforce stability.",
      icon: "📉", confidence: "verified", paths: ["workers", "money"], act: 1,
      isRevealed: false, connectedTo: ["c1", "r4"],
      dataViz: {
        headline: "2,400",
        headlineLabel: "WORKERS LAID OFF",
        stats: [
          { label: "% Workforce", value: "15%", color: "#FF6B6B" },
          { label: "Q4 Profit", value: "$2.1B", color: "#63D471" },
          { label: "Severance", value: "4 wks", color: "#FF9F43" },
        ],
        bars: [
          { label: "Engineering", value: 980, color: "#FF6B6B" },
          { label: "Operations", value: 640, color: "#FF9F43" },
          { label: "People/HR", value: 420, color: "#9B7BFF" },
          { label: "Marketing", value: 360, color: "#39C0BA" },
        ],
      },
    },
    {
      id: "s2", category: "signal", title: "3 NLRB Complaints (2024)",
      takeaway: "Workers allege retaliation for organizing discussions.",
      whyItMatters: "NLRB complaints indicate potential suppression of worker voice.",
      icon: "⚖️", confidence: "verified", paths: ["workers"], act: 2,
      isRevealed: false, connectedTo: ["p3"],
      dataViz: {
        stats: [
          { label: "Complaints", value: "3", color: "#FF6B6B" },
          { label: "Status", value: "Open", color: "#FF9F43" },
          { label: "Region", value: "Bay Area", color: "#B9C0CC" },
        ],
      },
    },
    {
      id: "s3", category: "signal", title: "Glassdoor: 2.8★ Culture",
      takeaway: "Reviews cite 'performative inclusion' and 'burnout culture'.",
      whyItMatters: "Persistent low ratings from current employees suggest systemic issues.",
      icon: "📊", confidence: "partial", paths: ["workers", "image"], act: 1,
      isRevealed: false, connectedTo: ["c2"],
      dataViz: {
        headline: "2.8",
        headlineLabel: "OUT OF 5.0 STARS",
        bars: [
          { label: "Culture", value: 2.8, color: "#FF6B6B" },
          { label: "Work-Life", value: 2.4, color: "#FF9F43" },
          { label: "Comp", value: 3.6, color: "#63D471" },
          { label: "Leadership", value: 2.1, color: "#FF6B6B" },
          { label: "Growth", value: 3.0, color: "#F2C14E" },
        ],
      },
    },

    // ── NETWORK CARDS ──
    {
      id: "n1", category: "network", title: "American Innovation Alliance",
      takeaway: "Dark money group co-founded by NovaCorp; lobbies for AI deregulation.",
      whyItMatters: "Indirect influence through trade groups obscures corporate accountability.",
      icon: "🕸️", confidence: "partial", paths: ["money", "executives"], act: 2,
      isRevealed: false, connectedTo: ["r1", "n2"],
      dataViz: {
        stats: [
          { label: "Members", value: "42 corps", color: "#FF9F43" },
          { label: "Spend", value: "$8.4M", color: "#F2C14E" },
          { label: "Disclosure", value: "None", color: "#FF6B6B" },
        ],
      },
    },
    {
      id: "n2", category: "network", title: "Defense Tech Roundtable",
      takeaway: "Closed-door group of defense contractors with rotating government advisors.",
      whyItMatters: "Elite access networks create policy influence invisible to the public.",
      icon: "🔒", confidence: "emerging", paths: ["executives", "money"], act: 2,
      isRevealed: false, connectedTo: ["p2", "r3", "n1"],
      dataViz: {
        stats: [
          { label: "Firms", value: "12", color: "#9B7BFF" },
          { label: "Gov Advisors", value: "8", color: "#FF6B6B" },
          { label: "Public Info", value: "None", color: "#FF9F43" },
        ],
      },
    },
    {
      id: "n3", category: "network", title: 'NovaCorp Foundation',
      takeaway: "Foundation donates to orgs whose board members overlap with NovaCorp's.",
      whyItMatters: "Philanthropic giving that reinforces corporate networks isn't pure altruism.",
      icon: "🎭", confidence: "partial", paths: ["image", "executives"], act: 3,
      isRevealed: false, connectedTo: ["c3", "p1"],
      dataViz: {
        headline: "$24M",
        headlineLabel: "ANNUAL GIVING",
        bars: [
          { label: "STEM Education", value: 9200000, color: "#39C0BA" },
          { label: "Policy Orgs", value: 6800000, color: "#9B7BFF" },
          { label: "Board-Linked", value: 5400000, color: "#FF9F43" },
          { label: "Community", value: 2600000, color: "#63D471" },
        ],
      },
    },
  ],

  connections: [
    { id: "conn-1", fromId: "r1", toId: "r2", type: "solid", label: "Same funding entity", isRevealed: false },
    { id: "conn-2", fromId: "r2", toId: "c1", type: "wavy", label: "Contradicts public claims", isRevealed: false },
    { id: "conn-3", fromId: "c1", toId: "s1", type: "wavy", label: "Branding vs. reality", isRevealed: false },
    { id: "conn-4", fromId: "p1", toId: "r1", type: "solid", label: "CEO authorized PAC", isRevealed: false },
    { id: "conn-5", fromId: "p2", toId: "r3", type: "dashed", label: "Revolving door", isRevealed: false },
    { id: "conn-6", fromId: "r3", toId: "n2", type: "solid", label: "Contract pipeline", isRevealed: false },
    { id: "conn-7", fromId: "n1", toId: "n2", type: "dotted", label: "Overlapping members", isRevealed: false },
    { id: "conn-8", fromId: "c2", toId: "s3", type: "wavy", label: "Claim vs. reviews", isRevealed: false },
    { id: "conn-9", fromId: "p3", toId: "s2", type: "dashed", label: "Hired after complaints", isRevealed: false },
    { id: "conn-10", fromId: "c3", toId: "n3", type: "dotted", label: "Shared board oversight", isRevealed: false },
    { id: "conn-11", fromId: "s1", toId: "r4", type: "double", label: "Profit + layoffs + $0 tax", isRevealed: false },
    { id: "conn-12", fromId: "n3", toId: "p1", type: "dotted", label: "CEO chairs foundation", isRevealed: false },
  ],

  archetypes: [
    {
      id: "arch-snack", title: "Snack Drawer Mirage", emoji: "🍿",
      verdict: "Surface perks mask structural neglect.",
      traits: ["High branding spend", "Low worker investment", "Performative culture"],
      workerImpact: "You'll enjoy the office snacks while your role gets quietly restructured. The ping-pong table stays; the headcount doesn't.",
      colorAccent: "#FF9F43",
    },
    {
      id: "arch-country", title: "Country Club Capitalism", emoji: "⛳",
      verdict: "Access is the product. Influence is the business model.",
      traits: ["Elite networks", "Revolving-door hiring", "Defense/gov dependency"],
      workerImpact: "Great resume line. But your labor funds lobbying against your own interests, and the real decisions happen in rooms you'll never enter.",
      colorAccent: "#9B7BFF",
    },
    {
      id: "arch-mission", title: "Mission Trap", emoji: "🪤",
      verdict: "The mission is real. The support isn't.",
      traits: ["Strong public values", "DEI dissolution", "Burnout culture"],
      workerImpact: "You'll believe in the work so much you'll accept the underpay, the crunch, and the guilt when you finally leave.",
      colorAccent: "#39C0BA",
    },
    {
      id: "arch-shadow", title: "Shadow Channel Strategist", emoji: "🌑",
      verdict: "Influence flows through channels designed to be invisible.",
      traits: ["Dark money groups", "Foundation self-dealing", "Ethics theater"],
      workerImpact: "You'll build products whose downstream use is obscured by design. Your ethics questions will be routed to a committee that never meets.",
      colorAccent: "#FF6B6B",
    },
  ],

  fragments: [
    { id: "frag-1", archetypeId: "arch-snack", label: "Branding > Investment", isCollected: false },
    { id: "frag-2", archetypeId: "arch-snack", label: "Profitable Layoffs", isCollected: false },
    { id: "frag-3", archetypeId: "arch-snack", label: "Culture Rating Gap", isCollected: false },
    { id: "frag-4", archetypeId: "arch-country", label: "Revolving Door", isCollected: false },
    { id: "frag-5", archetypeId: "arch-country", label: "Defense Pipeline", isCollected: false },
    { id: "frag-6", archetypeId: "arch-country", label: "Elite Access Network", isCollected: false },
    { id: "frag-7", archetypeId: "arch-mission", label: "DEI Dissolution", isCollected: false },
    { id: "frag-8", archetypeId: "arch-mission", label: "Values-Action Gap", isCollected: false },
    { id: "frag-9", archetypeId: "arch-shadow", label: "Dark Money Link", isCollected: false },
    { id: "frag-10", archetypeId: "arch-shadow", label: "Ethics Theater", isCollected: false },
    { id: "frag-11", archetypeId: "arch-shadow", label: "Foundation Loop", isCollected: false },
  ],

  artifacts: [
    { id: "art-1", name: "Empty Snack Drawer", emoji: "🗃️", description: "A souvenir from the break room they closed during restructuring.", rarity: "common", archetypeId: "arch-snack" },
    { id: "art-2", name: "Hunting Lodge Invite", emoji: "🦌", description: "Your name wasn't on the list, but you found the list.", rarity: "rare", archetypeId: "arch-country" },
    { id: "art-3", name: "Wellness Candle", emoji: "🕯️", description: "Smells like lavender and unfunded mental health benefits.", rarity: "uncommon", archetypeId: "arch-mission" },
    { id: "art-4", name: "Redacted Memo", emoji: "📝", description: "The parts they blacked out are the parts that matter.", rarity: "legendary", archetypeId: "arch-shadow" },
  ],
};
