// Locked heat label system — JRC EDIT spec colors
export const HEAT_LABELS: Record<number, { full: string; mobile: string; color: string; bg: string; hex: string; tooltip: string }> = {
  1: {
    full: "Footnote",
    mobile: "Footnote",
    color: "text-[hsl(215,16%,47%)]",
    bg: "bg-[hsl(215,16%,47%)]/10 border-[hsl(215,16%,47%)]/30 text-[hsl(215,16%,47%)]",
    hex: "#64748B",
    tooltip: "Filed under: things they hoped you'd skip.",
  },
  2: {
    full: "Side-Eye",
    mobile: "Side-Eye",
    color: "text-[hsl(215,20%,65%)]",
    bg: "bg-[hsl(215,20%,65%)]/10 border-[hsl(215,20%,65%)]/30 text-[hsl(215,20%,65%)]",
    hex: "#94A3B8",
    tooltip: "We see you, HR. We see you.",
  },
  3: {
    full: "Screenshot This",
    mobile: "Screenshot",
    color: "text-[hsl(217,91%,60%)]",
    bg: "bg-[hsl(217,91%,60%)]/10 border-[hsl(217,91%,60%)]/30 text-[hsl(217,91%,60%)]",
    hex: "#3B82F6",
    tooltip: "Save this before they delete it.",
  },
  4: {
    full: "This Affects Your Job",
    mobile: "Job Risk",
    color: "text-[hsl(38,92%,50%)]",
    bg: "bg-[hsl(38,92%,50%)]/10 border-[hsl(38,92%,50%)]/30 text-[hsl(38,92%,50%)]",
    hex: "#F59E0B",
    tooltip: "Your LinkedIn is about to get busy.",
  },
  5: {
    full: "They Thought We Wouldn't Find Out",
    mobile: "Exposed",
    color: "text-[hsl(0,84%,60%)]",
    bg: "bg-[hsl(0,84%,60%)]/15 border-[hsl(0,84%,60%)]/40 text-[hsl(0,84%,60%)]",
    hex: "#EF4444",
    tooltip: "Narrator: They found out.",
  },
};

// Editorial category mapping (data categories → display labels)
export const EDITORIAL_CATEGORIES: Record<string, string> = {
  structure: "THE FINE PRINT",
  money: "THE PAYCHECK",
  behavior: "THE DAILY GRIND",
  influence: "THE C-SUITE",
  momentum: "THE DAILY GRIND",
  context: "THE TECH STACK",
  off_the_record: "THE DAILY GRIND",
  // Legacy mappings
  ai_workplace: "THE TECH STACK",
  future_of_work: "THE DAILY GRIND",
  labor_organizing: "THE DAILY GRIND",
  worker_rights: "THE FINE PRINT",
  regulation: "THE FINE PRINT",
  layoffs: "THE DAILY GRIND",
  pay_equity: "THE PAYCHECK",
  legislation: "THE C-SUITE",
  general: "THE DAILY GRIND",
};

export const EDITORIAL_CAT_COLORS: Record<string, string> = {
  "THE DAILY GRIND": "#94A3B8",
  "THE C-SUITE": "#F59E0B",
  "THE TECH STACK": "#3B82F6",
  "THE PAYCHECK": "#34D399",
  "THE FINE PRINT": "#EF4444",
};

// "Use This" CTA mapping per editorial category
export const USE_THIS_CTA: Record<string, { label: string; link: string }> = {
  "THE TECH STACK": { label: "Audit My Stack →", link: "/advisory" },
  "THE C-SUITE": { label: "Severance Checklist →", link: "/search" },
  "THE FINE PRINT": { label: "Script to Ask Your Boss →", link: "/search" },
  "THE PAYCHECK": { label: "Compensation Benchmark →", link: "/search" },
  "THE DAILY GRIND": { label: "Career Audit →", link: "/search" },
};

export const RECEIPT_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "behavior", label: "The Daily Grind" },
  { value: "influence", label: "The C-Suite" },
  { value: "context", label: "The Tech Stack" },
  { value: "money", label: "The Paycheck" },
  { value: "structure", label: "The Fine Print" },
  { value: "off_the_record", label: "Off the Record" },
] as const;

export type ReceiptSortMode = "newest" | "hottest" | "drama" | null;
