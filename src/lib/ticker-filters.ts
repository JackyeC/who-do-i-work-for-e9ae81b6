/**
 * Ticker item filtering and sanitization utilities.
 * Ensures only English, US/employer-relevant items appear,
 * and all Unicode escape sequences are properly decoded.
 */

/** Decode \uXXXX escape sequences that survive JSON parsing */
export function decodeEscapes(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\u([\da-fA-F]{4})/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Heuristic: reject text that contains significant non-ASCII-Latin characters
 * (CJK, Cyrillic, Arabic, Devanagari, Thai, Finnish/Swedish diacritics in bulk, etc.)
 */
export function isLikelyEnglish(text: string): boolean {
  if (!text || text.trim().length < 3) return false;

  // Reject if it contains CJK, Hangul, Arabic, Devanagari, Thai, Cyrillic, Georgian, Armenian, Hebrew, etc.
  const nonLatinBlock = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u10A0-\u10FF\u0530-\u058F\u1200-\u137F]/;
  if (nonLatinBlock.test(text)) return false;

  // Reject Polish/Czech/Romanian heavy diacritics: ł, ą, ę, ś, ź, ż, ć, ń, ř, ů, ț, ș
  const slavicDiacritics = text.match(/[łąęśźżćńřůțșđ]/gi);
  if (slavicDiacritics && slavicDiacritics.length >= 2) return false;

  // Count extended-Latin characters (ä, ö, ü, å, ø, etc.) — if >6% of text, likely not English
  const extendedLatin = text.match(/[\u00C0-\u024F]/g);
  if (extendedLatin && extendedLatin.length / text.length > 0.06) return false;

  // Basic ASCII ratio: if less than 75% of chars are basic ASCII letters/digits/punctuation, reject (fail closed)
  const asciiChars = text.match(/[\x20-\x7E]/g);
  if (!asciiChars || asciiChars.length / text.length < 0.75) return false;

  return true;
}

// Non-US domains/sources to reject
const NON_US_SOURCES = new Set([
  "watoday.com.au", "ibtimes.co.uk", "hcamag.com", "colombogazette.com",
  "demokraatti.fi", "di.se", "etnews.com", "sunstar.com.ph",
  "ilonggotechblog.com", "terra.com.br", "channelnewsasia.com",
  "itnewsonline.com", "bbc.co.uk", "theguardian.com",
]);

// Keywords that indicate US or employer relevance
const RELEVANCE_KEYWORDS = [
  // Enforcement & regulatory
  "eeoc", "osha", "nlrb", "sec ", "ftc", "doj", "dol ", "epa ",
  "enforcement", "settlement", "violation", "compliance", "lawsuit",
  "investigation", "penalty", "fine", "indictment",
  // Labor & workforce
  "layoff", "lay off", "laid off", "rif ", "restructur", "downsize",
  "furlough", "warn act", "warn notice", "severance",
  "union", "organiz", "strike", "walkout", "picket", "collective bargaining",
  "minimum wage", "overtime", "wage theft", "pay equity", "pay gap",
  "worker", "workers", "workforce", "employee", "employees", "employer",
  "hiring", "fired", "termination", "job cuts", "job loss",
  // Political spending & lobbying
  "pac ", "lobby", "campaign contribut", "political spending", "dark money",
  "super pac", "fec ", "disclosure",
  // Workplace
  "discriminat", "harass", "retaliat", "whistleblow", "wrongful termination",
  "class action", "dei ", "diversity", "equity", "inclusion",
  "workplace", "labor", "labour",
  // AI & hiring
  "ai hiring", "algorithmic", "automated decision", "bias audit",
  "ai tool", "artificial intelligence",
  // US geographic / institutional
  "congress", "senate", "white house", "federal", "state legislature",
  "supreme court", "circuit court", "district court",
  "u.s.", "united states", "american",
  // Regulation & policy
  "regulation", "deregulat", "executive order", "bill ", "legislation",
  "antitrust", "merger", "acquisition",
];

/**
 * Returns true if the item is US-focused or employer-relevant.
 * Items with a company_name from our dataset pass automatically.
 */
export function isUSOrEmployerRelevant(
  text: string,
  companyOrSource: string | null,
  /** If true, skip keyword check — item is pre-categorized as relevant */
  preCategorized = false,
): boolean {
  if (!text) return false;

  // Reject known non-US source domains
  if (companyOrSource) {
    const sourceLower = companyOrSource.toLowerCase();
    if (NON_US_SOURCES.has(sourceLower)) return false;
  }

  // Pre-categorized items (e.g. work_news with category already set) pass
  if (preCategorized) return true;

  const lower = text.toLowerCase();

  // Check for relevance keywords
  for (const kw of RELEVANCE_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }

  // If there's a company name attached (from our dataset), it passes
  if (companyOrSource && companyOrSource.length > 2 && !NON_US_SOURCES.has(companyOrSource.toLowerCase())) {
    return true;
  }

  return false;
}