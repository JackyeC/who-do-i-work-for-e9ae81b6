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
  { value: "structure", label: "Structure" },       // SEC, State Registries
  { value: "money", label: "Money" },                // FEC, USASpending, IRS 990
  { value: "behavior", label: "Behavior" },          // OSHA, EEOC, DOL WHD, PACER
  { value: "influence", label: "Influence" },        // LDA, OpenSecrets, FACA
  { value: "momentum", label: "Momentum" },          // WARN, Job Postings, Earnings
  { value: "context", label: "Context" },            // BLS, H1B, USPTO
  { value: "off_the_record", label: "Off the Record" }, // Reddit, Blind, Glassdoor
] as const;

export type ReceiptSortMode = "newest" | "hottest" | "drama" | null;
