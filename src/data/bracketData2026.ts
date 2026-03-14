export interface BracketMatchup {
  id: string;
  seed1: number;
  seed2: number;
  brandA: { name: string; slug: string; emoji: string; tagline: string };
  brandB: { name: string; slug: string; emoji: string; tagline: string };
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
      { id: "t1", seed1: 1, seed2: 16, brandA: { name: "Microsoft", slug: "microsoft-corporation", emoji: "🪟", tagline: "AI regulation king" }, brandB: { name: "TikTok", slug: "bytedance", emoji: "📲", tagline: "Attention economy" } },
      { id: "t2", seed1: 8, seed2: 9, brandA: { name: "Google", slug: "alphabet-inc", emoji: "🔍", tagline: "Search & AI" }, brandB: { name: "AMD", slug: "amd-inc", emoji: "🔮", tagline: "Chip challenger" } },
      { id: "t3", seed1: 5, seed2: 12, brandA: { name: "Apple", slug: "apple-inc", emoji: "🍎", tagline: "Premium ecosystem" }, brandB: { name: "Spotify", slug: "spotify", emoji: "🎧", tagline: "Streaming giant" } },
      { id: "t4", seed1: 4, seed2: 13, brandA: { name: "Amazon", slug: "amazon-com-inc", emoji: "📦", tagline: "Everything store" }, brandB: { name: "Visa", slug: "visa-inc", emoji: "💳", tagline: "Payment network" } },
      { id: "t5", seed1: 6, seed2: 11, brandA: { name: "Nvidia", slug: "nvidia-corporation", emoji: "🎮", tagline: "GPU monopoly" }, brandB: { name: "Samsung", slug: "samsung-electronics", emoji: "📱", tagline: "Hardware empire" } },
      { id: "t6", seed1: 3, seed2: 14, brandA: { name: "OpenAI", slug: "openai", emoji: "🤖", tagline: "AI frontier" }, brandB: { name: "Mastercard", slug: "mastercard-inc", emoji: "💳", tagline: "Global payments" } },
      { id: "t7", seed1: 7, seed2: 10, brandA: { name: "Meta", slug: "meta-platforms", emoji: "👁️", tagline: "Social empire" }, brandB: { name: "Netflix", slug: "netflix-inc", emoji: "🎬", tagline: "Streaming king" } },
      { id: "t8", seed1: 2, seed2: 15, brandA: { name: "Tesla", slug: "tesla-inc", emoji: "⚡", tagline: "EV disruptor" }, brandB: { name: "Anthropic", slug: "anthropic", emoji: "🛡️", tagline: "Safe AI" } },
    ],
  },
  {
    id: "food",
    name: "Food & Drink",
    emoji: "🍔",
    color: "civic-red",
    matchups: [
      { id: "f1", seed1: 1, seed2: 16, brandA: { name: "McDonald's", slug: "mcdonalds-corporation", emoji: "🍟", tagline: "#1 brand value" }, brandB: { name: "Sweetgreen", slug: "sweetgreen", emoji: "🥗", tagline: "Robot kitchens" } },
      { id: "f2", seed1: 8, seed2: 9, brandA: { name: "Starbucks", slug: "starbucks-corporation", emoji: "☕", tagline: "Third place" }, brandB: { name: "Dutch Bros", slug: "dutch-bros", emoji: "🏎️", tagline: "Drive-thru king" } },
      { id: "f3", seed1: 5, seed2: 12, brandA: { name: "Chick-fil-A", slug: "chick-fil-a", emoji: "🐔", tagline: "+44% brand surge" }, brandB: { name: "Zaxby's", slug: "zaxbys", emoji: "🍗", tagline: "Southern roots" } },
      { id: "f4", seed1: 4, seed2: 13, brandA: { name: "Chipotle", slug: "chipotle-mexican-grill", emoji: "🌯", tagline: "Fast casual king" }, brandB: { name: "Domino's", slug: "dominos-pizza", emoji: "🍕", tagline: "Tech-first pizza" } },
      { id: "f5", seed1: 6, seed2: 11, brandA: { name: "H-E-B", slug: "h-e-b", emoji: "🛒", tagline: "Texas trust" }, brandB: { name: "Pizza Hut", slug: "pizza-hut-yum-brands", emoji: "🍕", tagline: "Dine-in comeback" } },
      { id: "f6", seed1: 3, seed2: 14, brandA: { name: "Popeyes", slug: "popeyes-louisiana-kitchen", emoji: "🍗", tagline: "Expansion king" }, brandB: { name: "Coca-Cola", slug: "coca-cola-company", emoji: "🥤", tagline: "Cola empire" } },
      { id: "f7", seed1: 7, seed2: 10, brandA: { name: "Raising Cane's", slug: "raising-canes", emoji: "🐔", tagline: "Fastest growing" }, brandB: { name: "KFC", slug: "kfc-yum-brands", emoji: "🍗", tagline: "Global legacy" } },
      { id: "f8", seed1: 2, seed2: 15, brandA: { name: "Walmart", slug: "walmart-inc", emoji: "🏬", tagline: "Revenue #1" }, brandB: { name: "Pepsi", slug: "pepsico-inc", emoji: "🥤", tagline: "Challenger cola" } },
    ],
  },
  {
    id: "entertainment",
    name: "Sports & Entertainment",
    emoji: "🏆",
    color: "civic-gold",
    matchups: [
      { id: "e1", seed1: 1, seed2: 16, brandA: { name: "Taylor Swift", slug: "taylor-swift", emoji: "🎵", tagline: "Ownership queen" }, brandB: { name: "Spirit Airlines", slug: "spirit-airlines", emoji: "🛫", tagline: "Ultra-low cost" } },
      { id: "e2", seed1: 8, seed2: 9, brandA: { name: "MrBeast", slug: "mrbeast", emoji: "🎥", tagline: "Creator empire" }, brandB: { name: "T-Series", slug: "t-series", emoji: "🎬", tagline: "Corporate titan" } },
      { id: "e3", seed1: 5, seed2: 12, brandA: { name: "Disney", slug: "walt-disney-company", emoji: "🏰", tagline: "IP vault" }, brandB: { name: "EA Sports", slug: "electronic-arts", emoji: "🎮", tagline: "Post-FIFA era" } },
      { id: "e4", seed1: 4, seed2: 13, brandA: { name: "Cowboys (Jones)", slug: "dallas-cowboys", emoji: "⭐", tagline: "$9B franchise" }, brandB: { name: "Panthers (Tepper)", slug: "carolina-panthers", emoji: "🐆", tagline: "Toxic signals" } },
      { id: "e5", seed1: 6, seed2: 11, brandA: { name: "Beyoncé (Parkwood)", slug: "beyonce-parkwood", emoji: "👑", tagline: "360° empire" }, brandB: { name: "DC (Warner)", slug: "warner-bros-discovery", emoji: "🦸", tagline: "Gunn reboot" } },
      { id: "e6", seed1: 3, seed2: 14, brandA: { name: "Drake (OVO)", slug: "drake-ovo", emoji: "🎤", tagline: "Streaming machine" }, brandB: { name: "2K Games", slug: "take-two-interactive", emoji: "🏀", tagline: "NBA gaming" } },
      { id: "e7", seed1: 7, seed2: 10, brandA: { name: "Clippers (Ballmer)", slug: "la-clippers", emoji: "🏀", tagline: "Tech arena" }, brandB: { name: "Lakers (Buss)", slug: "la-lakers", emoji: "🏀", tagline: "Hollywood legacy" } },
      { id: "e8", seed1: 2, seed2: 15, brandA: { name: "Kendrick (pgLang)", slug: "kendrick-lamar-pglang", emoji: "🎤", tagline: "Cultural authority" }, brandB: { name: "Twitch", slug: "amazon-com-inc", emoji: "🕹️", tagline: "Live streaming" } },
    ],
  },
  {
    id: "retail",
    name: "Retail & Style",
    emoji: "👟",
    color: "civic-green",
    matchups: [
      { id: "r1", seed1: 1, seed2: 16, brandA: { name: "Nike", slug: "nike-inc", emoji: "👟", tagline: "Swoosh empire" }, brandB: { name: "Charlotte Tilbury", slug: "charlotte-tilbury", emoji: "💅", tagline: "Luxury beauty" } },
      { id: "r2", seed1: 8, seed2: 9, brandA: { name: "Adidas", slug: "adidas-ag", emoji: "👟", tagline: "Three stripes" }, brandB: { name: "Under Armour", slug: "under-armour", emoji: "💪", tagline: "Brand reset" } },
      { id: "r3", seed1: 5, seed2: 12, brandA: { name: "Louis Vuitton", slug: "lvmh", emoji: "💎", tagline: "#1 luxury" }, brandB: { name: "Mango", slug: "mango", emoji: "👗", tagline: "U.S. expansion" } },
      { id: "r4", seed1: 4, seed2: 13, brandA: { name: "Rare Beauty", slug: "rare-beauty", emoji: "💄", tagline: "$2B+ valuation" }, brandB: { name: "Chanel", slug: "chanel", emoji: "✨", tagline: "Private empire" } },
      { id: "r5", seed1: 6, seed2: 11, brandA: { name: "Zara", slug: "inditex-sa", emoji: "👗", tagline: "Speed-to-market" }, brandB: { name: "Ford", slug: "ford-motor-company", emoji: "🚗", tagline: "Legacy EV" } },
      { id: "r6", seed1: 3, seed2: 14, brandA: { name: "Fenty Beauty", slug: "fenty-beauty", emoji: "💄", tagline: "Inclusivity pioneer" }, brandB: { name: "Lamborghini", slug: "lamborghini", emoji: "🏁", tagline: "Supercar dreams" } },
      { id: "r7", seed1: 7, seed2: 10, brandA: { name: "Gucci", slug: "kering-sa", emoji: "💎", tagline: "Creative reset" }, brandB: { name: "Rhode", slug: "rhode-skin", emoji: "💄", tagline: "Viral beauty" } },
      { id: "r8", seed1: 2, seed2: 15, brandA: { name: "BMW", slug: "bmw-ag", emoji: "🏎️", tagline: "EV design" }, brandB: { name: "Ferrari", slug: "ferrari-nv", emoji: "🏁", tagline: "Scarcity model" } },
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
