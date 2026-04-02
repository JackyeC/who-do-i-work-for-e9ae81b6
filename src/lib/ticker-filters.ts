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
 * or is in a non-English romance/European language.
 * Fails closed: if uncertain, returns false.
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

  // Detect common Portuguese, Spanish, French, German, Italian words
  // These catch headlines like "O país da Europa que promete milhares de empregos"
  const lower = text.toLowerCase();
  const ROMANCE_MARKERS = [
    // Portuguese
    /\b(país|empregos?|brasileiros?|trabalho|governo|milhares|milhões|sobre|também|ainda|porque|segundo|durante|vistos?|semanas?|promete|saem)\b/gi,
    // Spanish
    /\b(según|porque|también|durante|gobierno|trabajo|empleos?|millones|sobre|nuevo|puede|después|mientras|están|tienen|desde)\b/gi,
    // French
    /\b(aussi|parce que|gouvernement|travail|emplois?|nouveau|peuvent|après|pendant|depuis|cette|avoir|sont|faire|comme)\b/gi,
    // German
    /\b(und|der|die|das|ein|eine|für|mit|auf|ist|von|nicht|sich|werden|haben|über|oder|aber)\b/gi,
    // Italian
    /\b(anche|perché|governo|lavoro|nuovo|possono|dopo|durante|questa|hanno|sono|fare|come|molto)\b/gi,
  ];

  // Count how many romance-language marker patterns match
  let romanceHits = 0;
  for (const pattern of ROMANCE_MARKERS) {
    const matches = lower.match(pattern);
    if (matches) romanceHits += matches.length;
  }
  // If 3+ romance-language words found, likely not English
  if (romanceHits >= 3) return false;

  // Also catch German connective-heavy text (der/die/das/und pattern)
  const germanConnectives = (lower.match(/\b(der|die|das|und|für|mit|auf|ist|von|nicht)\b/g) || []).length;
  if (germanConnectives >= 4) return false;

  return true;
}

// Non-US domains/sources to reject
const NON_US_SOURCES = new Set([
  "watoday.com.au", "ibtimes.co.uk", "hcamag.com", "colombogazette.com",
  "demokraatti.fi", "di.se", "etnews.com", "sunstar.com.ph",
  "ilonggotechblog.com", "terra.com.br", "channelnewsasia.com",
  "itnewsonline.com", "bbc.co.uk", "theguardian.com",
  "g1.globo.com", "globo.com", "uol.com.br", "folha.uol.com.br",
  "lemonde.fr", "elpais.com", "spiegel.de", "corriere.it",
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
 * Geography/topic gate: "America first + AI + true world-scale."
 * 
 * Default: US companies, US workers, US labor, US policy, US tech/markets.
 * Always in scope globally: AI stories that materially affect how people work.
 * Non-US stories allowed only if world-scale or clearly shaping US workers' reality.
 * Routine foreign lifestyle/visa/"jobs abroad" pieces are excluded.
 * If in doubt, exclude. Fewer, sharper items > noisy wire feed.
 */
export function isUSOrEmployerRelevant(
  text: string,
  companyOrSource: string | null,
  /** If true, skip keyword check — item is pre-categorized as relevant */
  preCategorized = false,
): boolean {
  if (!text) return false;

  const lower = text.toLowerCase();

  // Reject known non-US source domains
  if (companyOrSource) {
    const sourceLower = companyOrSource.toLowerCase();
    if (NON_US_SOURCES.has(sourceLower)) return false;
  }

  // Hard reject: foreign lifestyle/visa/jobs-abroad patterns (even if pre-categorized)
  const FOREIGN_LIFESTYLE = /\b(visa[s]?\s+(that|which|para|pour)|jobs?\s+abroad|work\s+abroad|move\s+to\s+(europe|portugal|spain|bali|dubai)|digital\s+nomad\s+(visa|life)|expat\s+(life|jobs)|empregos?\s+(a|em)|trabalhar\s+(no|em|na))\b/i;
  if (FOREIGN_LIFESTYLE.test(text)) return false;

  // Pre-categorized items (e.g. work_news with category already set) pass after lifestyle check
  if (preCategorized) return true;

  // Check for relevance keywords (US focus + AI/automation)
  for (const kw of RELEVANCE_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }

  // If there's a company name attached (from our dataset), it passes
  if (companyOrSource && companyOrSource.length > 2 && !NON_US_SOURCES.has(companyOrSource.toLowerCase())) {
    return true;
  }

  return false;
}