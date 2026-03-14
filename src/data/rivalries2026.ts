export interface Rivalry {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  companyA: { name: string; slug: string; logo?: string; stat: string; statLabel: string };
  companyB: { name: string; slug: string; logo?: string; stat: string; statLabel: string };
  signal2026: string;
  verdict: string;
  trustSignalA?: string;
  trustSignalB?: string;
  geoTag?: string;
}

export const RIVALRY_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "big-tech", label: "Big Tech" },
  { key: "entertainment", label: "Entertainment" },
  { key: "food", label: "Food & Restaurant" },
  { key: "style", label: "Style & Ethics" },
] as const;

export const rivalries2026: Rivalry[] = [
  // ─── Big Tech ───
  {
    id: "msft-goog",
    category: "big-tech",
    categoryIcon: "🧠",
    title: "The AI Sovereign War",
    companyA: { name: "Microsoft", slug: "microsoft-corporation", stat: "+12%", statLabel: "Lobbying spend gap Q1" },
    companyB: { name: "Google", slug: "alphabet-inc", stat: "Gemini 3.0", statLabel: "Model release 2026" },
    signal2026: "Microsoft outspent Google by 12% in Q1 2026 for AI regulation lobbying. Track which lobbyists overlap with the Commerce Committee.",
    verdict: "Microsoft is buying regulatory influence faster. Google is betting on product dominance. The winner will be whoever shapes the AI Safety Framework first.",
    trustSignalA: "BB",
    trustSignalB: "BB",
    geoTag: "DC Metro — highest lobbying density for AI policy.",
  },
  {
    id: "aapl-smsng",
    category: "big-tech",
    categoryIcon: "📱",
    title: "Premium Hardware Battle",
    companyA: { name: "Apple", slug: "apple-inc", stat: "Vision Pro 2", statLabel: "Headset dominance" },
    companyB: { name: "Samsung", slug: "samsung-electronics", stat: "68%", statLabel: "Folding market share" },
    signal2026: "Apple's Vision Pro 2 launch vs. Samsung's dominance in the folding device segment. Workforce signals show Apple hiring 2x more AR engineers.",
    verdict: "Apple owns the premium narrative; Samsung owns the volume. The 'spatial computing' category is Apple's to lose — but Samsung's folding tech is reshaping the mid-tier.",
    geoTag: "Cupertino vs. Suwon — two hardware philosophies.",
  },
  {
    id: "openai-anthropic",
    category: "big-tech",
    categoryIcon: "🤖",
    title: "Ethical AI Showdown",
    companyA: { name: "OpenAI", slug: "openai", stat: "GPT-5.2", statLabel: "Latest model" },
    companyB: { name: "Anthropic", slug: "anthropic", stat: "Claude 4", statLabel: "Safety-first release" },
    signal2026: "Audit their 'Safety Transparency' reports — who is actually releasing training data methodology? Anthropic published; OpenAI has not.",
    verdict: "Anthropic leads on transparency. OpenAI leads on adoption. For career intelligence, the question is: which company's values survive scale?",
  },

  // ─── Entertainment ───
  {
    id: "nflx-paramount",
    category: "entertainment",
    categoryIcon: "🎬",
    title: "Streaming Supremacy",
    companyA: { name: "Netflix", slug: "netflix-inc", stat: "325M", statLabel: "Global subscribers" },
    companyB: { name: "Paramount+Warner", slug: "paramount-global", stat: "210M", statLabel: "Merged subscribers" },
    signal2026: "Netflix at 325M subs vs. the newly merged Paramount+ & HBO Max at 210M. The biggest entertainment merger of 2026 reshapes content economics.",
    verdict: "Netflix retains the scale advantage. The Paramount-Warner merger creates a content library threat. Watch for workforce signals — merger layoffs are the leading indicator.",
  },
  {
    id: "marvel-dc",
    category: "entertainment",
    categoryIcon: "🦸",
    title: "Superhero Renaissance",
    companyA: { name: "Marvel (Disney)", slug: "walt-disney-company", stat: "Mutant Era", statLabel: "2026 phase" },
    companyB: { name: "DC (Warner)", slug: "warner-bros-discovery", stat: "Chapter One", statLabel: "Gunn reboot" },
    signal2026: "DC's 'Chapter One' reboot under James Gunn vs. Marvel's 'Mutant Era' pivot. Audience sentiment is shifting — DC's fresh start is generating more positive signals.",
    verdict: "DC has momentum for the first time in a decade. Marvel's brand fatigue is a real signal. For workers at either studio, the creative direction determines job stability.",
  },

  // ─── Food & Restaurant ───
  {
    id: "mcd-sbux",
    category: "food",
    categoryIcon: "🍔",
    title: "The Great Flip",
    companyA: { name: "McDonald's", slug: "mcdonalds-corporation", stat: "$42.6B", statLabel: "Brand value" },
    companyB: { name: "Starbucks", slug: "starbucks-corporation", stat: "$37B", statLabel: "Brand value (-4%)" },
    signal2026: "McDonald's is #1 ($42.6B value); Starbucks is #2 ($37B). Starbucks saw a 4% decline due to international competition and union activity signals.",
    verdict: "McDonald's dominates on value positioning. Starbucks is losing the 'third place' narrative as remote work stabilizes. Worker sentiment signals favor McDonald's restructured benefits.",
    geoTag: "Central Texas — McDonald's dominates foot traffic 3:1.",
  },
  {
    id: "cfa-pop",
    category: "food",
    categoryIcon: "🍗",
    title: "Fast-Growth Battle",
    companyA: { name: "Chick-fil-A", slug: "chick-fil-a", stat: "+44%", statLabel: "Brand value surge" },
    companyB: { name: "Popeyes", slug: "popeyes-louisiana-kitchen", stat: "+28%", statLabel: "Store expansion rate" },
    signal2026: "Chick-fil-A's brand value surged 44% this year. Popeyes is expanding faster but with lower per-store economics. The chicken war is a proxy for franchise model quality.",
    verdict: "Chick-fil-A wins on unit economics and employee satisfaction. Popeyes wins on accessibility. For candidates, Chick-fil-A's closed-Sundays policy is either a green flag or a values question.",
  },
  {
    id: "heb-wmt",
    category: "food",
    categoryIcon: "🛒",
    title: "Regional Trust Battle",
    companyA: { name: "H-E-B", slug: "h-e-b", stat: "#1", statLabel: "Customer satisfaction" },
    companyB: { name: "Walmart", slug: "walmart-inc", stat: "#1", statLabel: "Revenue globally" },
    signal2026: "H-E-B consistently ranks as the #1 most 'Satisfying' grocer in the U.S. south. Walmart leads on revenue but trails on worker sentiment in every BLS metric.",
    verdict: "H-E-B proves that regional trust outperforms global scale in employer brand. For Texas-based candidates, H-E-B's workforce signals are significantly stronger.",
    geoTag: "Texas — H-E-B's home turf advantage is measurable.",
  },

  // ─── Style & Ethics ───
  {
    id: "nike-adidas",
    category: "style",
    categoryIcon: "👟",
    title: "Sustainability Scrutiny",
    companyA: { name: "Nike", slug: "nike-inc", stat: "3,300", statLabel: "Workers compensated Jan 2026" },
    companyB: { name: "Adidas", slug: "adidas-ag", stat: "Higher", statLabel: "Animal welfare score" },
    signal2026: "Nike's January 2026 worker compensation deal (3,300 workers) vs. Adidas's slightly higher 'Animal Welfare' score. Both face supply chain transparency pressure.",
    verdict: "Nike is spending to fix labor signals. Adidas is winning on niche ethics metrics. Neither has solved supply chain transparency. For candidates, check which signals matter to your values.",
  },
  {
    id: "zara-hm",
    category: "style",
    categoryIcon: "👗",
    title: "Fast Fashion Expansion",
    companyA: { name: "Zara (Inditex)", slug: "inditex-sa", stat: "Fluctuating", statLabel: "Transparency Index" },
    companyB: { name: "Mango", slug: "mango", stat: "U.S. Launch", statLabel: "2026 expansion" },
    signal2026: "Mango's aggressive 2026 U.S. expansion vs. Zara's supply chain 'Transparency Index' fluctuations. H&M sits between them on disclosure quality.",
    verdict: "Zara leads on speed-to-market. Mango is the expansion story. For candidates entering fashion retail, Mango's growth phase means more upward mobility — but less stability.",
    geoTag: "Major U.S. metros — Mango targeting NYC, LA, Miami first.",
  },
];
