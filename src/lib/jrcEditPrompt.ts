/**
 * JRC EDIT — Client-Side Reference
 * ═════════════════════════════════
 * Categories, heat levels, labels, and mappings for UI components.
 * The full system prompts live in supabase/functions/_shared/jrc-edit-prompt.ts
 */

// ── Categories ──────────────────────────────────────────
export const JRC_CATEGORIES = [
  "The C-Suite",
  "The Tech Stack",
  "The Paycheck",
  "The Fine Print",
  "The Daily Grind",
] as const;

export type JrcCategory = (typeof JRC_CATEGORIES)[number];

// ── Heat Levels ─────────────────────────────────────────
export const JRC_HEAT_LEVELS = [
  "Footnote",
  "Side-Eye",
  "Screenshot",
  "Job Risk",
  "Exposed",
] as const;

export type JrcHeatLevel = (typeof JRC_HEAT_LEVELS)[number];

// ── Stargaze Score labels (Set A — Gossip Column Energy) ──
export const STARGAZE_LABELS: Record<number, string> = {
  1: "Worth a glance",
  2: "Mild drama",
  3: "Screenshot this",
  4: "Group chat material",
  5: "Career-defining receipt",
};

// ── Backend → editorial category mapping ────────────────
export const CATEGORY_MAP: Record<string, string> = {
  structure: "THE FINE PRINT",
  money: "THE PAYCHECK",
  behavior: "THE DAILY GRIND",
  influence: "THE C-SUITE",
  momentum: "THE DAILY GRIND",
  context: "THE TECH STACK",
  off_the_record: "THE DAILY GRIND",
};

// ── Voice constraints (for client-side validation) ──────
export const BANNED_WORDS = [
  "chile", "honey", "baby", "mm-mm", "lord", "girl", "sis", "bestie", "boo",
];

// ── Jackye Voice Summary (client-side reference) ────────
export const JACKYE_VOICE_SUMMARY = {
  identity: "Career intelligence strategist, truth-teller, in the room not on a slide.",
  tone: "Direct, conversational, controlled urgency. Short scannable blocks.",
  thinkingLoop: ["what's happening", "what it means", "what people miss", "what we do next"],
  signatureMoves: ["The Call", "The Reframe", "The Pattern Drop", "Insider Translation", "Decision Close"],
  vocabulary: ["receipts", "signals", "leverage", "audit", "risk", "pattern", "follow the money", "know before you go"],
  hardNo: ["em dashes", "thought-leadership voice", "over-polished phrasing", "exclamation points", "corporate jargon"],
  close: "Every response ends with a clear next move.",
} as const;
