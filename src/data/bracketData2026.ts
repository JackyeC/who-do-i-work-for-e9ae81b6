export interface BracketTension {
  left: string;
  right: string;
  label: string;
}

export interface BracketMatchup {
  id: string;
  seed1: number;
  seed2: number;
  brandA: { name: string; slug: string; emoji: string; tagline: string };
  brandB: { name: string; slug: string; emoji: string; tagline: string };
  tension?: BracketTension;
  postVoteInsight?: string;
  operatingContext?: {
    leaning: string;
    tradeoff: string;
    questionToAsk: string;
  };
}

export interface BracketRegion {
  id: string;
  name: string;
  emoji: string;
  color: string;
  matchups: BracketMatchup[];
}

export const BRACKET_REGIONS: BracketRegion[] = [
  {
    id: "tech",
    name: "Tech",
    emoji: "🧠",
    color: "civic-blue",
    matchups: [
      {
        id: "t1", seed1: 1, seed2: 16,
        brandA: { name: "Microsoft", slug: "microsoft-corporation", emoji: "🪟", tagline: "AI regulation king" },
        brandB: { name: "TikTok", slug: "bytedance", emoji: "📲", tagline: "Attention economy" },
        tension: { left: "Control", right: "Adaptability", label: "Control ↔ Adaptability" },
        postVoteInsight: "One builds ecosystems you can't leave. The other rides every wave. Constraints can create clarity—or friction.",
        operatingContext: { leaning: "Platform lock-in vs. cultural agility", tradeoff: "Stability vs. speed of reinvention", questionToAsk: "How does the company respond when the market shifts overnight?" },
      },
      {
        id: "t2", seed1: 8, seed2: 9,
        brandA: { name: "Google", slug: "alphabet-inc", emoji: "🔍", tagline: "Search & AI" },
        brandB: { name: "AMD", slug: "amd-inc", emoji: "🔮", tagline: "Chip challenger" },
        tension: { left: "Exploration", right: "Optimization", label: "Exploration ↔ Optimization" },
        postVoteInsight: "Curiosity or control? One launches moonshots. The other perfects silicon. Where does your work actually fit?",
        operatingContext: { leaning: "Broad R&D vs. focused engineering", tradeoff: "Innovation breadth vs. execution depth", questionToAsk: "How are projects prioritized when resources are tight?" },
      },
      {
        id: "t3", seed1: 5, seed2: 12,
        brandA: { name: "Apple", slug: "apple-inc", emoji: "🍎", tagline: "Premium ecosystem" },
        brandB: { name: "Spotify", slug: "spotify", emoji: "🎧", tagline: "Streaming giant" },
        tension: { left: "Control", right: "Openness", label: "Control ↔ Openness" },
        postVoteInsight: "Tight ecosystem or open flexibility? Apple controls the stack. Spotify plays everywhere. Both create loyalty differently.",
        operatingContext: { leaning: "Vertical integration vs. platform neutrality", tradeoff: "Premium margins vs. universal access", questionToAsk: "How much autonomy do teams have over their product decisions?" },
      },
      {
        id: "t4", seed1: 4, seed2: 13,
        brandA: { name: "Amazon", slug: "amazon-com-inc", emoji: "📦", tagline: "Everything store" },
        brandB: { name: "Visa", slug: "visa-inc", emoji: "💳", tagline: "Payment network" },
        tension: { left: "Ruthlessness", right: "Compassion", label: "Ruthlessness ↔ Compassion" },
        postVoteInsight: "Speed vs. sustainability. One optimizes output relentlessly. The other invests in network reliability. Both define 'performance' differently.",
        operatingContext: { leaning: "Performance-first culture", tradeoff: "Speed over flexibility", questionToAsk: "How do you support team sustainability during high-pressure periods?" },
      },
      {
        id: "t5", seed1: 6, seed2: 11,
        brandA: { name: "Nvidia", slug: "nvidia-corporation", emoji: "🎮", tagline: "GPU monopoly" },
        brandB: { name: "Samsung", slug: "samsung-electronics", emoji: "📱", tagline: "Hardware empire" },
        tension: { left: "Specialization", right: "Diversification", label: "Specialization ↔ Diversification" },
        postVoteInsight: "Bet everything on one thing or spread across many? Focus creates dominance—diversification creates resilience.",
        operatingContext: { leaning: "Deep focus vs. broad portfolio", tradeoff: "Market dominance vs. risk hedging", questionToAsk: "How does the company decide where to invest next?" },
      },
      {
        id: "t6", seed1: 3, seed2: 14,
        brandA: { name: "OpenAI", slug: "openai", emoji: "🤖", tagline: "AI frontier" },
        brandB: { name: "Mastercard", slug: "mastercard-inc", emoji: "💳", tagline: "Global payments" },
        tension: { left: "Transparency", right: "Strategic Opacity", label: "Transparency ↔ Strategic Opacity" },
        postVoteInsight: "How much should you really know? Some companies share the roadmap. Some protect the plan. Both have reasons.",
        operatingContext: { leaning: "Mission-driven openness vs. institutional discretion", tradeoff: "Public trust vs. competitive advantage", questionToAsk: "How transparent is leadership about company direction and challenges?" },
      },
      {
        id: "t7", seed1: 7, seed2: 10,
        brandA: { name: "Meta", slug: "meta-platforms", emoji: "👁️", tagline: "Social empire" },
        brandB: { name: "Netflix", slug: "netflix-inc", emoji: "🎬", tagline: "Streaming king" },
        tension: { left: "Decisiveness", right: "Collaboration", label: "Decisiveness ↔ Collaboration" },
        postVoteInsight: "Freedom or structure? Netflix's 'keeper test' vs. Meta's top-down pivots. Autonomy sounds great—until it's not.",
        operatingContext: { leaning: "High autonomy with high accountability", tradeoff: "Individual freedom vs. organizational alignment", questionToAsk: "How are major strategic decisions made—top-down or consensus?" },
      },
      {
        id: "t8", seed1: 2, seed2: 15,
        brandA: { name: "Tesla", slug: "tesla-inc", emoji: "⚡", tagline: "EV disruptor" },
        brandB: { name: "Anthropic", slug: "anthropic", emoji: "🛡️", tagline: "Safe AI" },
        tension: { left: "Courage", right: "Calculated Risk", label: "Courage ↔ Calculated Risk" },
        postVoteInsight: "Move fast and break things—or move carefully and build trust? Failure tolerance defines culture.",
        operatingContext: { leaning: "Bold bets vs. methodical safety", tradeoff: "Speed of disruption vs. responsible development", questionToAsk: "How does the company handle failures or missed targets?" },
      },
    ],
  },
  {
    id: "food",
    name: "Food & Drink",
    emoji: "🍔",
    color: "civic-red",
    matchups: [
      {
        id: "f1", seed1: 1, seed2: 16,
        brandA: { name: "McDonald's", slug: "mcdonalds-corporation", emoji: "🍟", tagline: "#1 brand value" },
        brandB: { name: "Sweetgreen", slug: "sweetgreen", emoji: "🥗", tagline: "Robot kitchens" },
        tension: { left: "Efficiency", right: "Experience", label: "Efficiency ↔ Experience" },
        postVoteInsight: "Cheap and fast… or curated and calm? What matters more to you day-to-day?",
        operatingContext: { leaning: "Scale-first vs. quality-first", tradeoff: "Volume over curation", questionToAsk: "How does the company balance growth targets with product quality?" },
      },
      {
        id: "f2", seed1: 8, seed2: 9,
        brandA: { name: "Starbucks", slug: "starbucks-corporation", emoji: "☕", tagline: "Third place" },
        brandB: { name: "Dutch Bros", slug: "dutch-bros", emoji: "🏎️", tagline: "Drive-thru king" },
        tension: { left: "Standardization", right: "Flexibility", label: "Standardization ↔ Flexibility" },
        postVoteInsight: "One perfected the formula. The other rewrites it at every window. Consistency is comfort—for some.",
        operatingContext: { leaning: "Brand consistency vs. local energy", tradeoff: "Predictability vs. personality", questionToAsk: "How much freedom do local teams have to adapt?" },
      },
      {
        id: "f3", seed1: 5, seed2: 12,
        brandA: { name: "Chick-fil-A", slug: "chick-fil-a", emoji: "🐔", tagline: "+44% brand surge" },
        brandB: { name: "Zaxby's", slug: "zaxbys", emoji: "🍗", tagline: "Southern roots" },
        tension: { left: "Conviction", right: "Neutrality", label: "Conviction ↔ Neutrality" },
        postVoteInsight: "Stand loudly for something—or stay out of it? Both are strategies. Neither is neutral.",
        operatingContext: { leaning: "Values-led operations vs. market-led operations", tradeoff: "Brand loyalty vs. broad appeal", questionToAsk: "How does the company's public values stance affect day-to-day work?" },
      },
      {
        id: "f4", seed1: 4, seed2: 13,
        brandA: { name: "Chipotle", slug: "chipotle-mexican-grill", emoji: "🌯", tagline: "Fast casual king" },
        brandB: { name: "Domino's", slug: "dominos-pizza", emoji: "🍕", tagline: "Tech-first pizza" },
        tension: { left: "Authenticity", right: "Automation", label: "Authenticity ↔ Automation" },
        postVoteInsight: "Handcrafted or algorithm-delivered? One bets on ingredients. The other bets on logistics.",
        operatingContext: { leaning: "Human touch vs. tech optimization", tradeoff: "Quality perception vs. delivery speed", questionToAsk: "Where does the company invest more—people or systems?" },
      },
      {
        id: "f5", seed1: 6, seed2: 11,
        brandA: { name: "H-E-B", slug: "h-e-b", emoji: "🛒", tagline: "Texas trust" },
        brandB: { name: "Pizza Hut", slug: "pizza-hut-yum-brands", emoji: "🍕", tagline: "Dine-in comeback" },
        tension: { left: "Community", right: "Corporate", label: "Community ↔ Corporate" },
        postVoteInsight: "Regional devotion vs. global playbook. One earns trust locally. The other deploys brand at scale.",
        operatingContext: { leaning: "Community-rooted vs. franchise-driven", tradeoff: "Deep local trust vs. scalable systems", questionToAsk: "How connected is leadership to frontline employees?" },
      },
      {
        id: "f6", seed1: 3, seed2: 14,
        brandA: { name: "Popeyes", slug: "popeyes-louisiana-kitchen", emoji: "🍗", tagline: "Expansion king" },
        brandB: { name: "Coca-Cola", slug: "coca-cola-company", emoji: "🥤", tagline: "Cola empire" },
        tension: { left: "Disruption", right: "Consistency", label: "Disruption ↔ Consistency" },
        postVoteInsight: "Reinvent… or deliver reliably? Chaos creates growth—and burnout. Consistency creates comfort—and stagnation.",
        operatingContext: { leaning: "Viral growth vs. steady dominance", tradeoff: "Cultural relevance vs. institutional stability", questionToAsk: "How does the company handle rapid growth pressure?" },
      },
      {
        id: "f7", seed1: 7, seed2: 10,
        brandA: { name: "Raising Cane's", slug: "raising-canes", emoji: "🐔", tagline: "Fastest growing" },
        brandB: { name: "KFC", slug: "kfc-yum-brands", emoji: "🍗", tagline: "Global legacy" },
        tension: { left: "Focus", right: "Expansion", label: "Focus ↔ Expansion" },
        postVoteInsight: "One thing done perfectly—or everything everywhere? Focus creates cult followings. Expansion creates empires.",
        operatingContext: { leaning: "Single-product mastery vs. diversified portfolio", tradeoff: "Brand clarity vs. market coverage", questionToAsk: "Does the company prioritize depth or breadth in its strategy?" },
      },
      {
        id: "f8", seed1: 2, seed2: 15,
        brandA: { name: "Walmart", slug: "walmart-inc", emoji: "🏬", tagline: "Revenue #1" },
        brandB: { name: "Pepsi", slug: "pepsico-inc", emoji: "🥤", tagline: "Challenger cola" },
        tension: { left: "Authority", right: "Accessibility", label: "Authority ↔ Accessibility" },
        postVoteInsight: "Prestige or possibility? Legacy power vs. modern access. Both define success differently.",
        operatingContext: { leaning: "Market dominance vs. challenger positioning", tradeoff: "Scale leverage vs. brand agility", questionToAsk: "How does the company treat competition—crush or coexist?" },
      },
    ],
  },
  {
    id: "entertainment",
    name: "Sports & Entertainment",
    emoji: "🏆",
    color: "civic-gold",
    matchups: [
      {
        id: "e1", seed1: 1, seed2: 16,
        brandA: { name: "Taylor Swift", slug: "taylor-swift", emoji: "🎵", tagline: "Ownership queen" },
        brandB: { name: "Spirit Airlines", slug: "spirit-airlines", emoji: "🛫", tagline: "Ultra-low cost" },
        tension: { left: "Ownership", right: "Dependency", label: "Ownership ↔ Dependency" },
        postVoteInsight: "Build your own… or plug into power? Independence comes with pressure. Platforms come with strings.",
        operatingContext: { leaning: "Creator ownership vs. platform dependency", tradeoff: "Control vs. convenience", questionToAsk: "Who owns the output of your work here?" },
      },
      {
        id: "e2", seed1: 8, seed2: 9,
        brandA: { name: "MrBeast", slug: "mrbeast", emoji: "🎥", tagline: "Creator empire" },
        brandB: { name: "T-Series", slug: "t-series", emoji: "🎬", tagline: "Corporate titan" },
        tension: { left: "Attention", right: "Intention", label: "Attention ↔ Intention" },
        postVoteInsight: "Are you building… or performing? Different games, different outcomes. Volume vs. craft.",
        operatingContext: { leaning: "Virality-driven vs. catalog-driven", tradeoff: "Audience capture vs. content depth", questionToAsk: "What does success look like beyond the numbers?" },
      },
      {
        id: "e3", seed1: 5, seed2: 12,
        brandA: { name: "Disney", slug: "walt-disney-company", emoji: "🏰", tagline: "IP vault" },
        brandB: { name: "EA Sports", slug: "electronic-arts", emoji: "🎮", tagline: "Post-FIFA era" },
        tension: { left: "Legacy", right: "Reinvention", label: "Legacy ↔ Reinvention" },
        postVoteInsight: "Protect the vault or rebuild from scratch? Legacy creates trust. Reinvention creates relevance.",
        operatingContext: { leaning: "IP protection vs. franchise evolution", tradeoff: "Brand safety vs. creative risk", questionToAsk: "How does the company balance tradition with innovation?" },
      },
      {
        id: "e4", seed1: 4, seed2: 13,
        brandA: { name: "Cowboys (Jones)", slug: "dallas-cowboys", emoji: "⭐", tagline: "$9B franchise" },
        brandB: { name: "Panthers (Tepper)", slug: "carolina-panthers", emoji: "🐆", tagline: "Toxic signals" },
        tension: { left: "Ego", right: "Humility", label: "Ego ↔ Humility" },
        postVoteInsight: "Owner-driven empires. One thrives on spectacle. The other struggles with it. Leadership ego shapes everything below it.",
        operatingContext: { leaning: "Personality-driven leadership", tradeoff: "Brand visibility vs. organizational health", questionToAsk: "How does leadership's public persona affect internal culture?" },
      },
      {
        id: "e5", seed1: 6, seed2: 11,
        brandA: { name: "Beyoncé (Parkwood)", slug: "beyonce-parkwood", emoji: "👑", tagline: "360° empire" },
        brandB: { name: "DC (Warner)", slug: "warner-bros-discovery", emoji: "🦸", tagline: "Gunn reboot" },
        tension: { left: "Performance", right: "Purpose", label: "Performance ↔ Purpose" },
        postVoteInsight: "Win… or stand for something? Both matter. Few balance both. Where does your energy go?",
        operatingContext: { leaning: "Excellence-driven vs. mission-driven", tradeoff: "Results vs. meaning", questionToAsk: "What does the company celebrate more—output or impact?" },
      },
      {
        id: "e6", seed1: 3, seed2: 14,
        brandA: { name: "Drake (OVO)", slug: "drake-ovo", emoji: "🎤", tagline: "Streaming machine" },
        brandB: { name: "2K Games", slug: "take-two-interactive", emoji: "🏀", tagline: "NBA gaming" },
        tension: { left: "Volume", right: "Craft", label: "Volume ↔ Craft" },
        postVoteInsight: "Flood the market or perfect the product? Output velocity vs. quality obsession.",
        operatingContext: { leaning: "High-output vs. high-polish", tradeoff: "Market presence vs. product depth", questionToAsk: "How does the company define 'done' on a project?" },
      },
      {
        id: "e7", seed1: 7, seed2: 10,
        brandA: { name: "Clippers (Ballmer)", slug: "la-clippers", emoji: "🏀", tagline: "Tech arena" },
        brandB: { name: "Lakers (Buss)", slug: "la-lakers", emoji: "🏀", tagline: "Hollywood legacy" },
        tension: { left: "Innovation", right: "Tradition", label: "Innovation ↔ Tradition" },
        postVoteInsight: "Build the future or honor the past? Tech money vs. legacy power. Both attract talent differently.",
        operatingContext: { leaning: "Investment-driven transformation vs. legacy stewardship", tradeoff: "New systems vs. proven culture", questionToAsk: "Is the company building something new or maintaining something established?" },
      },
      {
        id: "e8", seed1: 2, seed2: 15,
        brandA: { name: "Kendrick (pgLang)", slug: "kendrick-lamar-pglang", emoji: "🎤", tagline: "Cultural authority" },
        brandB: { name: "Twitch", slug: "amazon-com-inc", emoji: "🕹️", tagline: "Live streaming" },
        tension: { left: "Prestige", right: "Simplicity", label: "Prestige ↔ Simplicity" },
        postVoteInsight: "Climb… or breathe? Not all success feels the same. Some chase authority. Some chase autonomy.",
        operatingContext: { leaning: "Cultural capital vs. platform scale", tradeoff: "Artistic control vs. mass distribution", questionToAsk: "What does career growth look like here—titles or impact?" },
      },
    ],
  },
  {
    id: "retail",
    name: "Retail & Style",
    emoji: "👟",
    color: "civic-green",
    matchups: [
      {
        id: "r1", seed1: 1, seed2: 16,
        brandA: { name: "Nike", slug: "nike-inc", emoji: "👟", tagline: "Swoosh empire" },
        brandB: { name: "Charlotte Tilbury", slug: "charlotte-tilbury", emoji: "💅", tagline: "Luxury beauty" },
        tension: { left: "Performance", right: "Purpose", label: "Performance ↔ Purpose" },
        postVoteInsight: "Win… or stand for something? Nike optimizes for athletes. Charlotte Tilbury optimizes for aspiration. Both create identity.",
        operatingContext: { leaning: "Athlete performance vs. beauty aspiration", tradeoff: "Results-driven vs. emotion-driven", questionToAsk: "How does the company measure the impact of its brand?" },
      },
      {
        id: "r2", seed1: 8, seed2: 9,
        brandA: { name: "Adidas", slug: "adidas-ag", emoji: "👟", tagline: "Three stripes" },
        brandB: { name: "Under Armour", slug: "under-armour", emoji: "💪", tagline: "Brand reset" },
        tension: { left: "Heritage", right: "Reinvention", label: "Heritage ↔ Reinvention" },
        postVoteInsight: "Lean on legacy or start over? Heritage earns trust. Reinvention earns attention. Both cost something.",
        operatingContext: { leaning: "Brand heritage leverage vs. strategic reset", tradeoff: "Proven identity vs. fresh positioning", questionToAsk: "How does the company handle underperformance—double down or pivot?" },
      },
      {
        id: "r3", seed1: 5, seed2: 12,
        brandA: { name: "Louis Vuitton", slug: "lvmh", emoji: "💎", tagline: "#1 luxury" },
        brandB: { name: "Mango", slug: "mango", emoji: "👗", tagline: "U.S. expansion" },
        tension: { left: "Exclusivity", right: "Accessibility", label: "Exclusivity ↔ Accessibility" },
        postVoteInsight: "Scarcity or scale? Luxury limits access on purpose. Fast fashion democratizes it. Different values, different customers.",
        operatingContext: { leaning: "Scarcity model vs. volume model", tradeoff: "Brand cachet vs. market share", questionToAsk: "How does the company define its ideal customer?" },
      },
      {
        id: "r4", seed1: 4, seed2: 13,
        brandA: { name: "Rare Beauty", slug: "rare-beauty", emoji: "💄", tagline: "$2B+ valuation" },
        brandB: { name: "Chanel", slug: "chanel", emoji: "✨", tagline: "Private empire" },
        tension: { left: "Vulnerability", right: "Mystique", label: "Vulnerability ↔ Mystique" },
        postVoteInsight: "Show everything or reveal nothing? Rare Beauty builds through openness. Chanel builds through mystery. Both create desire.",
        operatingContext: { leaning: "Founder transparency vs. institutional privacy", tradeoff: "Relatability vs. aspiration", questionToAsk: "How does leadership communicate with the public and employees?" },
      },
      {
        id: "r5", seed1: 6, seed2: 11,
        brandA: { name: "Zara", slug: "inditex-sa", emoji: "👗", tagline: "Speed-to-market" },
        brandB: { name: "Ford", slug: "ford-motor-company", emoji: "🚗", tagline: "Legacy EV" },
        tension: { left: "Speed", right: "Durability", label: "Speed ↔ Durability" },
        postVoteInsight: "Ship fast or build to last? Zara reinvents weekly. Ford builds for decades. Tempo shapes culture.",
        operatingContext: { leaning: "Rapid iteration vs. long-term engineering", tradeoff: "Trend responsiveness vs. product longevity", questionToAsk: "What's the typical timeline from idea to launch here?" },
      },
      {
        id: "r6", seed1: 3, seed2: 14,
        brandA: { name: "Fenty Beauty", slug: "fenty-beauty", emoji: "💄", tagline: "Inclusivity pioneer" },
        brandB: { name: "Lamborghini", slug: "lamborghini", emoji: "🏁", tagline: "Supercar dreams" },
        tension: { left: "Inclusivity", right: "Exclusivity", label: "Inclusivity ↔ Exclusivity" },
        postVoteInsight: "Everyone or someone? Fenty opened doors. Lamborghini keeps them narrow. Both are intentional.",
        operatingContext: { leaning: "Mass inclusivity vs. aspirational scarcity", tradeoff: "Market expansion vs. brand protection", questionToAsk: "Who does the company design for—and who does it leave out?" },
      },
      {
        id: "r7", seed1: 7, seed2: 10,
        brandA: { name: "Gucci", slug: "kering-sa", emoji: "💎", tagline: "Creative reset" },
        brandB: { name: "Rhode", slug: "rhode-skin", emoji: "💄", tagline: "Viral beauty" },
        tension: { left: "Prestige", right: "Authenticity", label: "Prestige ↔ Authenticity" },
        postVoteInsight: "Earned status or earned trust? Gucci trades on history. Rhode trades on relatability. Gen Z is choosing.",
        operatingContext: { leaning: "Institutional prestige vs. founder authenticity", tradeoff: "Fashion authority vs. social proof", questionToAsk: "How does the company build customer loyalty—through status or connection?" },
      },
      {
        id: "r8", seed1: 2, seed2: 15,
        brandA: { name: "BMW", slug: "bmw-ag", emoji: "🏎️", tagline: "EV design" },
        brandB: { name: "Ferrari", slug: "ferrari-nv", emoji: "🏁", tagline: "Scarcity model" },
        tension: { left: "Risk", right: "Stability", label: "Risk ↔ Stability" },
        postVoteInsight: "Break things… or never break anything? BMW bets on EV transformation. Ferrari protects the brand at all costs.",
        operatingContext: { leaning: "Transformation risk vs. brand preservation", tradeoff: "Market adaptation vs. heritage protection", questionToAsk: "How does the company approach major industry shifts?" },
      },
    ],
  },
];

export const BRACKET_ROUND_NAMES = [
  "Round of 64",
  "Round of 32",
  "Sweet 16",
  "Elite Eight",
  "Final Four",
  "Championship",
] as const;

// Rounds that require authentication to view results
export const GATED_ROUNDS = [3, 4, 5, 6]; // Elite Eight and beyond
