// Locked heat label system — do not improvise
export const HEAT_LABELS: Record<number, { full: string; mobile: string; color: string; bg: string }> = {
  1: {
    full: "Footnote",
    mobile: "Footnote",
    color: "text-muted-foreground",
    bg: "bg-muted/60 border-border text-muted-foreground",
  },
  2: {
    full: "Side-Eye",
    mobile: "Side-Eye",
    color: "text-[hsl(var(--civic-gold))]",
    bg: "bg-[hsl(var(--civic-gold))]/10 border-[hsl(var(--civic-gold))]/30 text-[hsl(var(--civic-gold))]",
  },
  3: {
    full: "Screenshot This",
    mobile: "Screenshot",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  },
  4: {
    full: "This Affects Your Job",
    mobile: "Job Risk",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30 text-destructive",
  },
  5: {
    full: "They Thought We Wouldn't Find Out",
    mobile: "Exposed",
    color: "text-[hsl(348,90%,55%)]",
    bg: "bg-[hsl(348,90%,55%)]/15 border-[hsl(348,90%,55%)]/40 text-[hsl(348,90%,55%)]",
  },
};

export const RECEIPT_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "ai_workplace", label: "AI" },
  { value: "future_of_work", label: "Work" },
  { value: "labor_organizing", label: "Labor" },
  { value: "worker_rights", label: "DEI" },
  { value: "regulation", label: "Policy" },
  { value: "layoffs", label: "Layoffs" },
  { value: "pay_equity", label: "Money" },
  { value: "legislation", label: "Hiring" },
] as const;

export type ReceiptSortMode = "newest" | "hottest" | "drama" | null;
