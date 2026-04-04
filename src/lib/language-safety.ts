/**
 * Language Safety Filter
 * 
 * Ensures all user-facing text is free of violent, aggressive,
 * or militarized language. Replaces flagged terms with neutral alternatives.
 */

const BANNED_PATTERNS: [RegExp, string][] = [
  // Weapons
  [/\bweapons?\b/gi, "tools"],
  [/\barsenal\b/gi, "toolkit"],
  [/\bammunition\b/gi, "resources"],
  [/\bammo\b/gi, "resources"],
  [/\bbullets?\b/gi, "points"],
  // Combat / warfare
  [/\bbattle\b/gi, "challenge"],
  [/\battack\b/gi, "approach"],
  [/\bstrike\b/gi, "action"],
  [/\bcombat\b/gi, "address"],
  [/\bwarfare\b/gi, "competition"],
  [/\barm yourself\b/gi, "prepare yourself"],
  [/\block and load\b/gi, "get started"],
  [/\bdeploy\b/gi, "launch"],
  // Violence / harm
  [/\bkill(ing|ed|s)?\b/gi, "remove"],
  [/\bdestroy(ing|ed|s)?\b/gi, "remove"],
  [/\beliminate(d|s)?\b/gi, "remove"],
  [/\bnuke(d|s)?\b/gi, "clear"],
  [/\bblast(ing|ed|s)?\b/gi, "send"],
  // Hunting (in non-policy context)
  [/\bhunting\b/gi, "searching"],
  [/\bbounty\b/gi, "goal"],
];

/**
 * Sanitize a string by replacing banned language with safe alternatives.
 * Returns the cleaned string.
 */
export function sanitizeText(text: string): string {
  if (!text) return text;
  let result = text;
  for (const [pattern, replacement] of BANNED_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Check if text contains any banned language.
 * Returns an array of matched terms (empty if clean).
 */
export function detectBannedLanguage(text: string): string[] {
  if (!text) return [];
  const violations: string[] = [];
  for (const [pattern] of BANNED_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      violations.push(...matches);
    }
  }
  return violations;
}
