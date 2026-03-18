/**
 * Signal Text Sanitizer
 * 
 * Ensures all displayed signal labels are clean, readable, English-only,
 * and mapped to a controlled vocabulary when possible.
 */

// Controlled vocabulary — canonical signal category labels
const CANONICAL_CATEGORIES: Record<string, string> = {
  // Direct matches
  compensation_transparency: "Compensation Transparency",
  hiring_activity: "Hiring Activity",
  workforce_stability: "Workforce Stability",
  company_behavior: "Company Behavior",
  innovation_activity: "Innovation Activity",
  public_sentiment: "Public Sentiment",
  organizational_transformation: "Organizational Transformation",
  leadership: "Leadership",
  restructuring: "Restructuring",
  innovation: "Innovation",
  regulatory: "Regulatory",
  layoffs: "Layoffs",
  retention_risk: "Retention Risk",
  pay_reporting: "Pay Reporting",
  pay_equity: "Pay Equity",
  benefits: "Benefits",
  ai_hiring: "AI in Hiring",
  culture: "Culture",
  compliance: "Compliance",
  governance: "Governance",
  diversity: "Diversity",
  transparency: "Transparency",
  political_spending: "Political Spending",
  lobbying: "Lobbying",
  labor: "Labor",
  climate: "Climate",
  immigration: "Immigration",
  civil_rights: "Civil Rights",
  healthcare: "Healthcare",
  consumer_protection: "Consumer Protection",
  gun_policy: "Gun Policy",
};

// Fuzzy keyword → canonical mapping for partial matches
const KEYWORD_MAP: [RegExp, string][] = [
  [/compensat|salary|pay|wage/i, "Compensation Transparency"],
  [/hiring|recruit|talent.?acqui/i, "Hiring Activity"],
  [/workforce|stability|turnover|attrition|churn/i, "Workforce Stability"],
  [/innovat|patent|r.?&.?d|research/i, "Innovation Activity"],
  [/sentiment|glassdoor|indeed|review/i, "Public Sentiment"],
  [/transform|restructur|reorg/i, "Organizational Transformation"],
  [/leader|executive|c-suite|ceo|cfo/i, "Leadership"],
  [/layoff|warn|rif|downsiz/i, "Layoffs"],
  [/retention|exit|flight.?risk/i, "Retention Risk"],
  [/benefit|insurance|401k|pto|leave/i, "Benefits"],
  [/ai.?hir|automat.?screen|aedt/i, "AI in Hiring"],
  [/cultur|values|workplace/i, "Culture"],
  [/complian|regulat|enforcement|osha|eeoc/i, "Compliance"],
  [/govern|board|fiduciar/i, "Governance"],
  [/divers|equit|inclus|dei|eeo/i, "Diversity"],
  [/transparen|disclos/i, "Transparency"],
  [/politic|pac|donat|campaign/i, "Political Spending"],
  [/lobby/i, "Lobbying"],
  [/labor|union|nlrb|worker.?right/i, "Labor"],
  [/climate|emission|carbon|esg/i, "Climate"],
  [/immigrat|visa|h-?1b/i, "Immigration"],
  [/civil.?right|discriminat|hrc/i, "Civil Rights"],
  [/health|pharma|drug|medical/i, "Healthcare"],
  [/consumer|product.?safe|ftc|recall/i, "Consumer Protection"],
  [/gun|firearm|nra|second.?amend/i, "Gun Policy"],
];

/**
 * Detect non-Latin / non-English characters (CJK, Cyrillic, Arabic, etc.)
 */
const NON_LATIN_RE = /[\u0400-\u04FF\u0600-\u06FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/;

/**
 * Detect control characters, unusual whitespace, or broken encoding
 */
const GARBAGE_RE = /[\x00-\x08\x0E-\x1F\uFFFD\uFEFF]|â€|Ã|Â|ï¼/;

/**
 * Strip non-Latin tokens from a string while preserving English words
 */
function stripNonLatinTokens(text: string): string {
  return text
    .split(/\s+/)
    .filter(token => !NON_LATIN_RE.test(token))
    .join(" ")
    .trim();
}

/**
 * Clean broken encoding artifacts
 */
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
 * Sanitize a signal text string.
 * Returns cleaned English text, or null if the text is unsalvageable.
 */
export function sanitizeSignalText(text: string | null | undefined): string | null {
  if (!text || typeof text !== "string") return null;

  let cleaned = cleanEncodingArtifacts(text.trim());

  // Strip non-Latin tokens
  if (NON_LATIN_RE.test(cleaned)) {
    cleaned = stripNonLatinTokens(cleaned);
  }

  // Remove any remaining garbage
  if (GARBAGE_RE.test(cleaned)) {
    cleaned = cleaned.replace(GARBAGE_RE, "").trim();
  }

  // If nothing useful remains, return null
  if (!cleaned || cleaned.length < 2) return null;

  // If mostly non-ASCII after cleaning, reject
  const asciiRatio = (cleaned.match(/[\x20-\x7E]/g) || []).length / cleaned.length;
  if (asciiRatio < 0.7) return null;

  return cleaned;
}

/**
 * Normalize a signal category key to a human-readable canonical label.
 * Falls back to title-casing the input if no match found.
 */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category) return "General";

  // Clean first
  const cleaned = sanitizeSignalText(category);
  if (!cleaned) return "General";

  const key = cleaned.toLowerCase().replace(/[\s-]+/g, "_");

  // Direct match
  if (CANONICAL_CATEGORIES[key]) return CANONICAL_CATEGORIES[key];

  // Fuzzy keyword match
  for (const [pattern, label] of KEYWORD_MAP) {
    if (pattern.test(cleaned)) return label;
  }

  // Fallback: title-case the cleaned input
  return cleaned
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Normalize a signal type string for display.
 * Converts snake_case to readable text, cleans artifacts.
 */
export function normalizeSignalType(signalType: string | null | undefined): string | null {
  if (!signalType) return null;

  const cleaned = sanitizeSignalText(signalType);
  if (!cleaned) return null;

  return cleaned
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Safe display text — returns the sanitized text or a fallback.
 * Use this as the final rendering helper.
 */
export function safeSignalLabel(
  text: string | null | undefined,
  fallback: string = "Signal Detected"
): string {
  const result = sanitizeSignalText(text);
  return result || fallback;
}
