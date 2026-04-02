/**
 * JRC EDIT — Story Schema & Shared Constants
 * ════════════════════════════════════════════
 * Single source of truth for the 4-layer story object.
 * Every front-end surface imports from here.
 */

// ── Core types ──────────────────────────────────────────

export interface CompanyRef {
  id: string;
  slug: string;
  name: string;
}

export interface PersonRef {
  id: string;
  slug: string;
  name: string;
  title?: string;
}

export interface ReceiptItem {
  id: string;
  type: "link" | "quote" | "doc" | "screenshot";
  label: string;
  url?: string;
  quote_text?: string;
  source_attribution?: string;
  timestamp?: string;
}

export type StoryCategory =
  | "c_suite"
  | "tech_stack"
  | "paycheck"
  | "fine_print"
  | "daily_grind";

export type HeatLevel =
  | "footnote"
  | "side_eye"
  | "screenshot"
  | "job_risk"
  | "exposed";

export type BiasSource =
  | "corporate_optimism"
  | "workforce_sentiment"
  | "regulator_angle"
  | "investor_angle"
  | "unclear";

export type BiasJrc =
  | "executive_standard"
  | "brand_integrity"
  | "worker_impact"
  | "risk_management";

export type BiasConfidence = "low" | "medium" | "high";

export interface JrcStory {
  id: string;
  slug: string;
  headline_poster: string;
  headline_deck: string | null;
  summary_rich: string;
  category: StoryCategory;
  heat_level: HeatLevel;
  bias_source: BiasSource;
  bias_jrc: BiasJrc;
  bias_confidence: BiasConfidence;
  companies: CompanyRef[];
  people: PersonRef[];
  primary_source_url: string;
  source_label: string;
  receipt_items: ReceiptItem[];
  work_news_id: string | null;
  language: string;
  published_at: string;
  created_at: string;
  updated_at: string;
}

// ── Display constants ───────────────────────────────────

export const CATEGORY_DISPLAY: Record<StoryCategory, string> = {
  c_suite: "The C-Suite",
  tech_stack: "The Tech Stack",
  paycheck: "The Paycheck",
  fine_print: "The Fine Print",
  daily_grind: "The Daily Grind",
};

export const CATEGORY_COLORS: Record<StoryCategory, string> = {
  c_suite: "hsl(38, 92%, 50%)",
  tech_stack: "hsl(217, 91%, 60%)",
  paycheck: "hsl(160, 64%, 55%)",
  fine_print: "hsl(0, 84%, 60%)",
  daily_grind: "hsl(215, 16%, 47%)",
};

export const HEAT_DISPLAY: Record<HeatLevel, { label: string; short: string; color: string }> = {
  footnote: { label: "Footnote", short: "Footnote", color: "hsl(215, 16%, 47%)" },
  side_eye: { label: "Side-Eye", short: "Side-Eye", color: "hsl(143, 30%, 50%)" },
  screenshot: { label: "Screenshot This", short: "Screenshot", color: "hsl(217, 91%, 60%)" },
  job_risk: { label: "This Affects Your Job", short: "Job Risk", color: "hsl(38, 92%, 50%)" },
  exposed: { label: "They Thought We Wouldn't Find Out", short: "Exposed", color: "hsl(0, 84%, 60%)" },
};

export const BIAS_SOURCE_DISPLAY: Record<BiasSource, string> = {
  corporate_optimism: "Corporate optimism",
  workforce_sentiment: "Workforce sentiment",
  regulator_angle: "Regulator angle",
  investor_angle: "Investor angle",
  unclear: "Unclear framing",
};

export const BIAS_JRC_DISPLAY: Record<BiasJrc, string> = {
  executive_standard: "Executive standards",
  brand_integrity: "Brand integrity",
  worker_impact: "Worker impact",
  risk_management: "Risk management",
};

export const BIAS_CONFIDENCE_COLOR: Record<BiasConfidence, { dot: string; label: string }> = {
  high: { dot: "hsl(160, 64%, 55%)", label: "Strong receipts" },
  medium: { dot: "hsl(38, 92%, 50%)", label: "Mixed framing" },
  low: { dot: "hsl(215, 16%, 47%)", label: "Insufficient evidence" },
};