/**
 * The Work Signal — Schema & Display Constants
 * Single source of truth for all Work Signal content types.
 */

// ── Signal Story ────────────────────────────────────────

export type SignalCategory = "c_suite" | "tech_stack" | "paycheck" | "fine_print" | "daily_grind";
export type SignalType = "breaking" | "developing" | "overnight";
export type HeatLevel = "low" | "medium" | "high";
export type ContentStatus = "draft" | "scheduled" | "live";

export interface SignalStory {
  id: string;
  company_name: string | null;
  category: SignalCategory;
  signal_type: SignalType;
  headline: string;
  heat_level: HeatLevel;
  source_name: string | null;
  source_url: string | null;
  receipt: string | null;
  jrc_take: string | null;
  why_it_matters_applicants: string | null;
  why_it_matters_employees: string | null;
  why_it_matters_execs: string | null;
  before_you_say_yes: string | null;
  published_at: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyWrap {
  id: string;
  wrap_date: string;
  title: string;
  intro: string | null;
  top_signal_story_ids: string[];
  summary_take: string | null;
  published_at: string;
  status: ContentStatus;
}

export interface WeeklyIssue {
  id: string;
  issue_date: string;
  subject_line_primary: string;
  subject_line_alternates: string[];
  intro: string | null;
  pattern_of_week: string | null;
  signal_story_ids: string[];
  lead_circle_cta_title: string | null;
  lead_circle_cta_body: string | null;
  signoff: string | null;
  published_at: string;
  status: ContentStatus;
}

// ── Display constants ───────────────────────────────────

export const CATEGORY_DISPLAY: Record<SignalCategory, string> = {
  c_suite: "The C-Suite",
  tech_stack: "The Tech Stack",
  paycheck: "The Paycheck",
  fine_print: "The Fine Print",
  daily_grind: "The Daily Grind",
};

export const CATEGORY_COLORS: Record<SignalCategory, string> = {
  c_suite: "hsl(38, 92%, 50%)",
  tech_stack: "hsl(217, 91%, 60%)",
  paycheck: "hsl(160, 64%, 55%)",
  fine_print: "hsl(0, 84%, 60%)",
  daily_grind: "hsl(215, 16%, 47%)",
};

export const SIGNAL_TYPE_DISPLAY: Record<SignalType, { label: string; color: string }> = {
  breaking: { label: "BREAKING WORK SIGNAL", color: "hsl(0, 84%, 60%)" },
  developing: { label: "DEVELOPING", color: "hsl(38, 92%, 50%)" },
  overnight: { label: "OVERNIGHT", color: "hsl(215, 16%, 60%)" },
};

export const HEAT_DISPLAY: Record<HeatLevel, { label: string; color: string; bg: string }> = {
  low: { label: "Low Heat", color: "hsl(215, 16%, 47%)", bg: "hsl(215, 16%, 47% / 0.12)" },
  medium: { label: "Medium Heat", color: "hsl(38, 92%, 50%)", bg: "hsl(38, 92%, 50% / 0.12)" },
  high: { label: "High Heat", color: "hsl(0, 84%, 60%)", bg: "hsl(0, 84%, 60% / 0.12)" },
};
