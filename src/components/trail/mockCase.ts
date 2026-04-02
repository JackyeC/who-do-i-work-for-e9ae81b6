/**
 * WhoDoI Trail — Mock case data reframed for job seekers.
 * Every takeaway answers: "What does this mean for MY career decision?"
 */
import type { CaseFile } from "./types";

export const DEMO_CASE: CaseFile = {
  id: "case-novacorp-001",
  companyName: "NovaCorp Industries",
  companyIndustry: "Technology & Defense",
  companyDescription: "A Fortune 200 tech company known for cloud infrastructure, AI hiring tools, and government contracting. Their careers page says 'people first.' Let's see if the public record agrees.",

  cards: [
    // ── RECEIPT CARDS ──
    {
      id: "r1", category: "receipt", title: "$4.2M PAC Spending (2024)",
      takeaway: "While marketing itself as 'values-driven,' NovaCorp's PAC funded 38 politicians — including several who voted against pay transparency and parental leave laws.",
      whyItMatters: "If you care about workplace protections, know that your employer may be actively working against them. This is the gap between the careers page and the lobbying page.",
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
          { label: "Anti-Labor Votes", value: "22 of 38 recipients" },
          { label: "Pay Transparency Opponents", value: "14 recipients" },
        ],
      },
    },
    {
      id: "r2", category: "receipt", title: "$12M Lobbying Against Worker Protections",
      takeaway: "NovaCorp spent $12M lobbying against the PRO Act (which protects your right to organize) and portable benefits legislation — while running a 'We Stand With Workers' campaign.",
      whyItMatters: "This tells you something the recruiter won't: the company's official position is that workers should have fewer legal protections. That affects your leverage from day one.",
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
      id: "r3", category: "receipt", title: "$890M Government Defense Contracts",
      takeaway: "NovaCorp's largest revenue stream comes from DHS and DOD contracts for surveillance technology. If you're an engineer here, this is likely what you'll be building.",
      whyItMatters: "Before you accept, ask yourself: am I comfortable building tools used for mass surveillance and border enforcement? Some workers found out too late. You don't have to.",
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
      id: "r4", category: "receipt", title: "$0 Effective Tax Rate (3 Years Running)",
      takeaway: "NovaCorp made $8.1B in profit and paid zero federal income tax — while your paycheck is taxed at full rate. The communities where employees live shoulder the cost.",
      whyItMatters: "This isn't just a number — it means the roads, schools, and services in your city get less while the company keeps more. That's money not going to the places where you actually live and work.",
      icon: "🧾", confidence: "verified", paths: ["money"], act: 2,
      isRevealed: false,
      dataViz: {
        headline: "0%",
        headlineLabel: "EFFECTIVE TAX RATE",
        stats: [
          { label: "Profit", value: "$8.1B", color: "#63D471" },
          { label: "Statutory Rate", value: "21%", color: "#B9C0CC" },
          { label: "Actually Paid", value: "$0", color: "#FF6B6B" },
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
      takeaway: "Makes $47.3M/year while the median employee makes $62K. That's a 758:1 pay ratio — meaning he earns in one day what you'd earn in two years.",
      whyItMatters: "Pay ratios tell you who the company is really built for. When the CEO makes 758x the median worker, ask: where does my growth actually fit in this picture?",
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
      takeaway: "Former DHS Deputy Secretary who joined NovaCorp's board just 6 months after leaving government — the same agency that awarded NovaCorp $340M in contracts.",
      whyItMatters: "Revolving-door hires signal that the company's real advantage isn't innovation — it's access. And that access doesn't trickle down to your desk.",
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
          { label: "Gov Exit Gap", value: "6 months", color: "#FF6B6B" },
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
      takeaway: "NovaCorp's third Chief People Officer in five years. Hired after the previous CPO left amid harassment allegations that were quietly settled.",
      whyItMatters: "When the person in charge of 'people' keeps leaving, that's not bad luck — it's a pattern. If leadership can't retain its own HR chief, what does that tell you about the culture you'd be joining?",
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
      takeaway: "NovaCorp spent $18M on employer branding in 2024 — that's 50% more than they spent lobbying against the very worker protections they claim to support.",
      whyItMatters: "When a company spends more on telling you it's great than on actually being great, that's a signal. The career page is marketing. The lobbying record is strategy.",
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
      takeaway: "Published a glossy equity report in Q1 2024 — then quietly dissolved the entire DEI team in Q3 and cut ERG budgets by 70%.",
      whyItMatters: "If you're joining because you believe in their inclusion commitments, check the receipts. The team that was supposed to back those promises no longer exists.",
      icon: "🌈", confidence: "partial", paths: ["image", "workers"], act: 1,
      isRevealed: false, connectedTo: ["p3", "s3"],
      dataViz: {
        stats: [
          { label: "DEI Team", value: "0 (was 28)", color: "#FF6B6B" },
          { label: "ERG Budget", value: "Cut 70%", color: "#FF9F43" },
          { label: "Report Published", value: "Yes", color: "#63D471" },
        ],
      },
    },
    {
      id: "c3", category: "claim", title: '"AI Ethics Board" Announcement',
      takeaway: "Announced an AI Ethics Board with zero external members and zero published recommendations. It has met twice in 18 months.",
      whyItMatters: "If you're an engineer concerned about responsible AI, this board exists in name only. There's no external oversight on the tools you'd be asked to build.",
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
      id: "s1", category: "signal", title: "2,400 Layoffs During Record Profits",
      takeaway: "Cut 15% of the workforce in January 2025 — the same quarter they posted $2.1B in profit. Severance was just 4 weeks.",
      whyItMatters: "This is the single most important signal for job stability. Profitable companies that cut workers are telling you: headcount is a line item, not a commitment. Your job security here depends on the next earnings call.",
      icon: "📉", confidence: "verified", paths: ["workers", "money"], act: 1,
      isRevealed: false, connectedTo: ["c1", "r4"],
      dataViz: {
        headline: "2,400",
        headlineLabel: "WORKERS LAID OFF",
        stats: [
          { label: "% Workforce", value: "15%", color: "#FF6B6B" },
          { label: "Same-Q Profit", value: "$2.1B", color: "#63D471" },
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
      takeaway: "Three separate complaints allege NovaCorp retaliated against employees who discussed working conditions — a legally protected activity.",
      whyItMatters: "If workers can't safely talk about pay, hours, or conditions without retaliation, that tells you everything about the 'open culture' the recruiter promised. This is a red flag for anyone who values voice.",
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
      id: "s3", category: "signal", title: "Glassdoor: 2.8★ Culture Rating",
      takeaway: "Current employee reviews repeatedly cite 'performative inclusion,' 'burnout culture,' and 'leadership says the right things but does the opposite.'",
      whyItMatters: "Glassdoor isn't perfect — but when hundreds of current employees say the same thing, listen. 'Performative inclusion' means the diversity numbers are in the report but not in the room.",
      icon: "📊", confidence: "partial", paths: ["workers", "image"], act: 1,
      isRevealed: false, connectedTo: ["c2"],
      dataViz: {
        headline: "2.8",
        headlineLabel: "OUT OF 5.0 STARS",
        bars: [
          { label: "Culture", value: 2.8, color: "#FF6B6B" },
          { label: "Work-Life", value: 2.4, color: "#FF9F43" },
          { label: "Compensation", value: 3.6, color: "#63D471" },
          { label: "Leadership", value: 2.1, color: "#FF6B6B" },
          { label: "Growth Opps", value: 3.0, color: "#F2C14E" },
        ],
      },
    },

    // ── NETWORK CARDS ──
    {
      id: "n1", category: "network", title: "American Innovation Alliance",
      takeaway: "A dark-money group co-founded by NovaCorp that lobbies for AI deregulation — meaning fewer rules on the hiring algorithms that may screen you out.",
      whyItMatters: "The same company using AI to evaluate your resume is also funding efforts to make sure no one regulates those tools. That's a conflict of interest that directly affects job seekers.",
      icon: "🕸️", confidence: "partial", paths: ["money", "executives"], act: 2,
      isRevealed: false, connectedTo: ["r1", "n2"],
      dataViz: {
        stats: [
          { label: "Member Corps", value: "42", color: "#FF9F43" },
          { label: "Annual Spend", value: "$8.4M", color: "#F2C14E" },
          { label: "Disclosure", value: "None", color: "#FF6B6B" },
        ],
      },
    },
    {
      id: "n2", category: "network", title: "Defense Tech Roundtable",
      takeaway: "A closed-door group where defense contractors and rotating government officials set priorities — off the record, outside public view.",
      whyItMatters: "If the company's biggest deals happen in rooms like this, the 'meritocracy' they promise in interviews doesn't extend to how the business actually runs. Access is the product.",
      icon: "🔒", confidence: "emerging", paths: ["executives", "money"], act: 2,
      isRevealed: false, connectedTo: ["p2", "r3", "n1"],
      dataViz: {
        stats: [
          { label: "Firms", value: "12", color: "#9B7BFF" },
          { label: "Gov Advisors", value: "8", color: "#FF6B6B" },
          { label: "Public Records", value: "None", color: "#FF9F43" },
        ],
      },
    },
    {
      id: "n3", category: "network", title: "NovaCorp Foundation",
      takeaway: "The foundation donates $24M/year — but 22% goes to organizations whose board members overlap with NovaCorp's own board. It's a loop.",
      whyItMatters: "Philanthropic giving that reinforces the company's own network isn't altruism — it's brand management. If you're evaluating their 'social impact' during your job search, look deeper.",
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
    { id: "conn-1", fromId: "r1", toId: "r2", type: "solid", label: "Same PAC funds both lobbying and campaign donations", isRevealed: false },
    { id: "conn-2", fromId: "r2", toId: "c1", type: "wavy", label: "'Best Place to Work' branding contradicts anti-worker lobbying", isRevealed: false },
    { id: "conn-3", fromId: "c1", toId: "s1", type: "wavy", label: "$18M on branding, then laid off 2,400 workers", isRevealed: false },
    { id: "conn-4", fromId: "p1", toId: "r1", type: "solid", label: "CEO personally authorized PAC strategy", isRevealed: false },
    { id: "conn-5", fromId: "p2", toId: "r3", type: "dashed", label: "Board member oversaw the same agency that awarded NovaCorp contracts", isRevealed: false },
    { id: "conn-6", fromId: "r3", toId: "n2", type: "solid", label: "Defense contracts originate from this closed-door network", isRevealed: false },
    { id: "conn-7", fromId: "n1", toId: "n2", type: "dotted", label: "Overlapping members shape policy in both groups", isRevealed: false },
    { id: "conn-8", fromId: "c2", toId: "s3", type: "wavy", label: "DEI commitment dissolved — Glassdoor reviews confirm it", isRevealed: false },
    { id: "conn-9", fromId: "p3", toId: "s2", type: "dashed", label: "New CPO hired after NLRB complaints — pattern, not coincidence", isRevealed: false },
    { id: "conn-10", fromId: "c3", toId: "n3", type: "dotted", label: "Ethics board and foundation share oversight gaps", isRevealed: false },
    { id: "conn-11", fromId: "s1", toId: "r4", type: "double", label: "$8B profit + 2,400 layoffs + $0 taxes = extraction", isRevealed: false },
    { id: "conn-12", fromId: "n3", toId: "p1", type: "dotted", label: "CEO chairs the foundation he donates company money to", isRevealed: false },
  ],

  archetypes: [
    {
      id: "arch-snack", title: "The Snack Drawer Mirage", emoji: "🍿",
      verdict: "The perks are real. The investment in you isn't.",
      traits: ["High branding spend", "Low worker investment", "Performative culture", "Style over substance"],
      workerImpact: "You'll enjoy the office snacks, the slick onboarding, and the 'we're a family' energy — right up until restructuring hits your team. The ping-pong table stays. Your headcount doesn't. If stability matters to you, dig past the perks.",
      colorAccent: "#FF9F43",
    },
    {
      id: "arch-country", title: "Country Club Capitalism", emoji: "⛳",
      verdict: "The real product isn't innovation — it's access to power.",
      traits: ["Elite networks", "Revolving-door hiring", "Government dependency", "Pay ratio extremes"],
      workerImpact: "Great resume line. But your labor funds lobbying against your own protections, and the real decisions happen in rooms you'll never enter. If ethics and pay equity matter to you, this company's structure works against both.",
      colorAccent: "#9B7BFF",
    },
    {
      id: "arch-mission", title: "The Mission Trap", emoji: "🪤",
      verdict: "The mission is real. The support for the people doing the mission isn't.",
      traits: ["Strong public values", "DEI dissolution", "Burnout culture", "Values used as retention tool"],
      workerImpact: "You'll believe in the work so much you'll accept the underpay, the crunch, and the guilt when you finally leave. If belonging matters to you, ask: does this company invest in inclusion, or just talk about it?",
      colorAccent: "#39C0BA",
    },
    {
      id: "arch-shadow", title: "Shadow Channel Strategist", emoji: "🌑",
      verdict: "Influence flows through channels designed to be invisible — and your work feeds them.",
      traits: ["Dark money groups", "Foundation self-dealing", "Ethics theater", "Opacity by design"],
      workerImpact: "You'll build products whose downstream use is hidden by design. Your ethics questions get routed to a committee that never meets. If transparency matters to you, this company is structurally incapable of providing it.",
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
    { id: "art-1", name: "Empty Snack Drawer", emoji: "🗃️", description: "A souvenir from the break room they closed during restructuring. The granola bars outlasted the headcount.", rarity: "common", archetypeId: "arch-snack" },
    { id: "art-2", name: "Hunting Lodge Invite", emoji: "🦌", description: "Your name wasn't on the guest list — but now you've seen the guest list. That's worth more than the invite.", rarity: "rare", archetypeId: "arch-country" },
    { id: "art-3", name: "Wellness Candle", emoji: "🕯️", description: "Smells like lavender and unfunded mental health benefits. Light it during your next 'optional' 9pm standup.", rarity: "uncommon", archetypeId: "arch-mission" },
    { id: "art-4", name: "Redacted Memo", emoji: "📝", description: "The parts they blacked out are the parts that matter. You found them anyway. That's investigator energy.", rarity: "legendary", archetypeId: "arch-shadow" },
  ],
};
