/**
 * Signal Text Sanitizer & Taxonomy Engine
 * 
 * Structured, consistent signal system for all company intelligence.
 * Every signal displayed must be clean, readable, and mapped to a
 * controlled 7-category taxonomy.
 */

// ═══════════════════════════════════════════════════════
// 1. THE 7 CANONICAL SIGNAL CATEGORIES
// ═══════════════════════════════════════════════════════

export type SignalCategoryKey =
  | "hiring_behavior"
  | "workforce_stability"
  | "compensation_transparency"
  | "employee_sentiment"
  | "policy_influence"
  | "leadership_governance"
  | "risk_signals";

export interface SignalCategoryMeta {
  key: SignalCategoryKey;
  label: string;
  description: string;
}

export const SIGNAL_TAXONOMY: SignalCategoryMeta[] = [
  { key: "hiring_behavior",            label: "Hiring Behavior",            description: "Patterns in job postings, ATS usage, and recruitment activity" },
  { key: "workforce_stability",        label: "Workforce Stability",        description: "Layoffs, WARN notices, turnover, and retention signals" },
  { key: "compensation_transparency",  label: "Compensation Transparency",  description: "Pay equity, salary disclosure, and benefits data" },
  { key: "employee_sentiment",         label: "Employee Sentiment",         description: "Worker reviews, culture signals, and satisfaction indicators" },
  { key: "policy_influence",           label: "Policy & Influence",         description: "PAC spending, lobbying, dark money, and political ties" },
  { key: "leadership_governance",      label: "Leadership & Governance",    description: "Executive changes, board composition, and governance practices" },
  { key: "risk_signals",               label: "Risk Signals",               description: "Regulatory actions, lawsuits, and compliance concerns" },
];

export const TAXONOMY_MAP: Record<SignalCategoryKey, string> = Object.fromEntries(
  SIGNAL_TAXONOMY.map(t => [t.key, t.label])
) as Record<SignalCategoryKey, string>;

// ═══════════════════════════════════════════════════════
// 2. RAW → TAXONOMY MAPPING
// ═══════════════════════════════════════════════════════

// Maps legacy/raw category keys to the canonical 7
const CATEGORY_REMAP: Record<string, SignalCategoryKey> = {
  // Hiring Behavior
  hiring_activity: "hiring_behavior",
  ai_hiring: "hiring_behavior",
  ai_in_hiring: "hiring_behavior",
  ghost_jobs: "hiring_behavior",
  recruitment: "hiring_behavior",
  talent_acquisition: "hiring_behavior",

  // Workforce Stability
  workforce_stability: "workforce_stability",
  layoffs: "workforce_stability",
  retention_risk: "workforce_stability",
  restructuring: "workforce_stability",
  organizational_transformation: "workforce_stability",
  warn_notices: "workforce_stability",

  // Compensation Transparency
  compensation_transparency: "compensation_transparency",
  pay_reporting: "compensation_transparency",
  pay_equity: "compensation_transparency",
  benefits: "compensation_transparency",
  salary: "compensation_transparency",

  // Employee Sentiment
  public_sentiment: "employee_sentiment",
  employee_sentiment: "employee_sentiment",
  culture: "employee_sentiment",
  sentiment: "employee_sentiment",
  workplace: "employee_sentiment",
  diversity: "employee_sentiment",

  // Policy & Influence
  political_spending: "policy_influence",
  lobbying: "policy_influence",
  dark_money: "policy_influence",
  policy_influence: "policy_influence",
  company_behavior: "policy_influence",

  // Leadership & Governance
  leadership: "leadership_governance",
  governance: "leadership_governance",
  leadership_governance: "leadership_governance",
  executive: "leadership_governance",
  board: "leadership_governance",

  // Risk Signals
  risk_signals: "risk_signals",
  regulatory: "risk_signals",
  compliance: "risk_signals",
  litigation: "risk_signals",
  innovation: "risk_signals",
  innovation_activity: "risk_signals",
};

// Fuzzy keyword patterns → canonical category
const KEYWORD_CATEGORY_MAP: [RegExp, SignalCategoryKey][] = [
  [/hiring|recruit|talent.?acqui|job.?post|ats|ghost.?job|applicat/i, "hiring_behavior"],
  [/layoff|warn|rif|downsiz|turnover|attrition|churn|restructur|reorg|stability/i, "workforce_stability"],
  [/compensat|salary|pay|wage|benefit|401k|pto|leave|bonus|equity.?comp/i, "compensation_transparency"],
  [/sentiment|glassdoor|indeed|review|culture|workplace|satisfact|morale|divers|inclus|dei/i, "employee_sentiment"],
  [/politic|pac|donat|campaign|lobby|dark.?money|501c|trade.?assoc|influence|spending/i, "policy_influence"],
  [/leader|executive|c-suite|ceo|cfo|board|govern|fiduciar|appoint/i, "leadership_governance"],
  [/regulat|complian|enforcement|osha|eeoc|lawsuit|litigation|violat|fine|penalt|risk|patent|innovat/i, "risk_signals"],
];

// ═══════════════════════════════════════════════════════
// 3. CURATED SIGNAL LABELS (4–6 words, plain English)
// ═══════════════════════════════════════════════════════

// Maps raw signal_type strings to clean 4-6 word labels
const SIGNAL_LABEL_MAP: Record<string, string> = {
  // Hiring Behavior
  ghost_job: "Role posted but not filling",
  reposted_role: "Role reposted multiple times",
  ai_screening: "AI screening tools detected",
  aedt_detected: "Automated hiring tool in use",
  high_volume_posting: "High volume of job posts",
  low_posting_activity: "Limited hiring activity detected",
  ats_redirect: "Application redirects to external ATS",
  no_active_jobs: "No active jobs detected",

  // Workforce Stability
  warn_notice: "WARN layoff notice filed",
  mass_layoff: "Mass layoff event reported",
  executive_departure: "Senior executive recently departed",
  restructuring: "Organizational restructuring underway",
  hiring_freeze: "Hiring freeze signals detected",
  high_turnover: "Above-average employee turnover rate",
  stable_workforce: "Stable workforce signals observed",

  // Compensation Transparency
  salary_not_disclosed: "Compensation not publicly listed",
  salary_disclosed: "Salary ranges publicly posted",
  pay_equity_gap: "Pay equity gaps detected",
  benefits_indexed: "Benefits data publicly available",
  no_comp_data: "No compensation data found",
  below_market: "Below market rate detected",
  above_market: "Above market compensation observed",

  // Employee Sentiment
  negative_reviews: "Negative employee reviews trending",
  positive_culture: "Positive culture signals present",
  diversity_concerns: "Diversity commitment questioned",
  messaging_gap: "Messaging doesn't match experience",
  culture_shift: "Workplace culture shift detected",

  // Policy & Influence
  pac_spending: "Corporate PAC spending detected",
  lobbying_activity: "Active lobbying spend recorded",
  dark_money_link: "Dark money connections identified",
  political_donations: "Political donation patterns detected",
  revolving_door: "Government-to-corporate pipeline found",

  // Leadership & Governance
  ceo_change: "CEO change recently announced",
  board_turnover: "Board membership recently changed",
  leadership_stable: "Leadership team appears stable",
  independent_board: "Majority independent board members",

  // Risk Signals
  regulatory_action: "Regulatory enforcement action taken",
  lawsuit_filed: "Active litigation case detected",
  osha_violation: "Workplace safety violations found",
  eeoc_complaint: "EEOC complaint on record",
  patent_activity: "Patent filing activity detected",
};

// ═══════════════════════════════════════════════════════
// 4. TEXT CLEANING (non-English, encoding, garbage)
// ═══════════════════════════════════════════════════════

const NON_LATIN_RE = /[\u0400-\u04FF\u0600-\u06FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;
const GARBAGE_RE = /[\x00-\x08\x0E-\x1F\uFFFD\uFEFF]|â€|Ã|Â|ï¼/;

function stripNonLatinTokens(text: string): string {
  return text
    .split(/\s+/)
    .filter(token => !NON_LATIN_RE.test(token))
    .join(" ")
    .trim();
}

function cleanEncodingArtifacts(text: string): string {
  return text
    .replace(/â€[™"œ"˜]/g, "'")
    .replace(/Ã©/g, "é")
    .replace(/Ã¡/g, "á")
    .replace(/ï¼/g, "")
    .replace(/[\uFFFD\uFEFF]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Sanitize any signal text string.
 * Returns cleaned English text, or null if unsalvageable.
 */
export function sanitizeSignalText(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") return null;

  let cleaned = cleanEncodingArtifacts(text.trim());

  if (NON_LATIN_RE.test(cleaned)) {
    cleaned = stripNonLatinTokens(cleaned);
  }

  if (GARBAGE_RE.test(cleaned)) {
    cleaned = cleaned.replace(GARBAGE_RE, "").trim();
  }

  if (!cleaned || cleaned.length < 2) return null;

  const asciiRatio = (cleaned.match(/[\x20-\x7E]/g) || []).length / cleaned.length;
  if (asciiRatio < 0.7) return null;

  return cleaned;
}

// ═══════════════════════════════════════════════════════
// 5. PUBLIC API
// ═══════════════════════════════════════════════════════

/**
 * Map a raw category string to the canonical 7-category taxonomy.
 * Returns the SignalCategoryKey.
 */
export function mapToCategory(rawCategory: string | null | undefined): SignalCategoryKey {
  if (!rawCategory) return "risk_signals";

  const cleaned = sanitizeSignalText(rawCategory);
  if (!cleaned) return "risk_signals";

  const key = cleaned.toLowerCase().replace(/[\s-]+/g, "_");

  // Direct remap
  if (CATEGORY_REMAP[key]) return CATEGORY_REMAP[key];

  // Fuzzy keyword match
  for (const [pattern, category] of KEYWORD_CATEGORY_MAP) {
    if (pattern.test(cleaned)) return category;
  }

  return "risk_signals";
}

/**
 * Get the human-readable label for a canonical category.
 */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "Risk Signals";

  const mapped = mapToCategory(category);
  return TAXONOMY_MAP[mapped] || "Risk Signals";
}

/**
 * Normalize a signal_type to a clean 4-6 word label.
 * First checks the curated map, then cleans and title-cases.
 */
export function normalizeSignalType(signalType: string | null | undefined): string | null {
  if (!signalType) return null;

  const cleaned = sanitizeSignalText(signalType);
  if (!cleaned) return null;

  const key = cleaned.toLowerCase().replace(/[\s-]+/g, "_");

  // Curated label match
  if (SIGNAL_LABEL_MAP[key]) return SIGNAL_LABEL_MAP[key];

  // Fuzzy match on curated labels
  for (const [mapKey, label] of Object.entries(SIGNAL_LABEL_MAP)) {
    if (key.includes(mapKey) || mapKey.includes(key)) return label;
  }

  // Fallback: clean title-case, enforce 6-word max
  const words = cleaned
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .split(" ");

  return words.slice(0, 6).join(" ");
}

/**
 * Safe display text — returns sanitized text or a contextual fallback.
 * The last line of defense before rendering.
 */
export function safeSignalLabel(
  text: string | null | undefined,
  fallback: string = "Signal detected"
): string {
  if (!text) return fallback;

  // Try curated label first
  const normalized = normalizeSignalType(text);
  if (normalized) return normalized;

  // Try basic sanitize
  const cleaned = sanitizeSignalText(text);
  if (cleaned) {
    // Enforce 6-word max
    const words = cleaned.split(" ");
    if (words.length > 6) return words.slice(0, 6).join(" ") + "…";
    return cleaned;
  }

  return fallback;
}

/**
 * Sanitize a full signal summary (longer text, not a label).
 * Allows longer text but still strips garbage.
 */
export function safeSignalSummary(
  text: string | null | undefined,
  fallback: string = "Signal data available — details pending verification."
): string {
  const cleaned = sanitizeSignalText(text);
  return cleaned || fallback;
}
