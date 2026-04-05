/**
 * Decision Intelligence Content Theme
 * ════════════════════════════════════
 * Content and messaging constants for the "Application Volume vs Decision Quality"
 * theme. Used by ticker content, newsletter generation, and social outputs.
 *
 * This is a CONTENT LAYER ONLY — no UI features, no routing, no data model changes.
 */

// ── Reframe Lines ───────────────────────────────────────
// Rotated into content outputs when auto-apply dynamics are referenced.
export const DECISION_REFRAME_LINES = [
  "Better question: should you be applying to this role at all?",
  "Volume is not a strategy. Alignment is.",
  "If a bot can write your application, it is also writing everyone else's.",
  "Recruiters are not overwhelmed by talent. They are overwhelmed by noise.",
  "Sending 200 applications is not hustle. It is a signal that you do not have a signal.",
  "The job search is not a numbers game. It is a pattern-recognition problem.",
] as const;

// ── Ticker-Ready Insight Lines ──────────────────────────
// Short-form observations for intelligence ticker rotation.
export const DECISION_TICKER_INSIGHTS = [
  "Auto-apply tools increased application volume 40x. Response rates dropped.",
  "Recruiters report 70% of automated applications fail basic role-match screening.",
  "High-volume applicants are 3x more likely to accept misaligned offers.",
  "Pattern-based applications are now detectable by most ATS platforms.",
  "Application volume is up. Interview conversion is flat. The math is visible.",
  "One aligned application outperforms fifty templated ones. The data is consistent.",
] as const;

// ── Newsletter Content Blocks ───────────────────────────
// Longer-form content for editorial and newsletter sections.
export const DECISION_NEWSLETTER_BLOCKS = {
  /** Section header for newsletter integration */
  sectionTitle: "The Volume Trap",

  /** Introductory framing paragraph */
  intro:
    "Auto-apply tools promise efficiency. What they deliver is noise — for candidates and recruiters alike. " +
    "Application volume has increased dramatically. Response rates have not followed. " +
    "The question is not how many roles you can reach. It is whether you should be reaching for them at all.",

  /** Pattern observations for editorial rotation */
  patterns: [
    "Automation increases application volume but reduces signal clarity. Recruiters detect pattern-based applications. Misalignment leads to lower response rates.",
    "When everyone sends the same signal, no one stands out. Auto-apply tools commoditize your candidacy at scale.",
    "The companies that respond to volume-based applications tend to be the ones hiring at volume. That correlation is not accidental.",
    "A high application count feels productive. A low response rate tells a different story. The gap between the two is where decisions should happen.",
  ],

  /** Soft bridge to existing product — content outputs only */
  productBridge: "Run a company scan before applying.",
} as const;

// ── Social Content Templates ────────────────────────────
// Pre-structured social copy for platform sharing.
export const DECISION_SOCIAL_TEMPLATES = [
  {
    hook: "Auto-apply sent 200 applications. Got 3 responses. All misaligned.",
    body: "Volume is not a strategy. It is a symptom of not knowing what you are looking for. Before you apply anywhere, know what you are walking into.",
    cta: "Run a company scan before applying.",
  },
  {
    hook: "Recruiters can tell when a bot wrote your cover letter.",
    body: "Pattern-based applications are now detectable by most screening systems. The question is not how to automate faster. It is whether the role is worth your signal at all.",
    cta: "Decision intelligence over application volume.",
  },
  {
    hook: "The job search is not a numbers game.",
    body: "It is a pattern-recognition problem. One aligned application outperforms fifty templated ones. The data is consistent.",
    cta: "Stop applying. Start aligning.",
  },
] as const;

// ── Theme Metadata ──────────────────────────────────────
export const DECISION_INTELLIGENCE_THEME = {
  id: "application-volume-vs-decision-quality",
  label: "Application Volume vs Decision Quality",
  description:
    "Content theme exploring the systemic tradeoff between high-volume automated applications and aligned, intelligence-driven career decisions.",
  tone: ["sharp", "observational", "signal-first", "grounded-in-patterns"],
} as const;
