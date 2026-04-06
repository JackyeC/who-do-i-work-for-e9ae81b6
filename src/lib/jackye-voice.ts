/**
 * Jackye Voice Filter
 * Transforms AI-generated takes into Jackye Clayton's actual voice.
 * 
 * Rules from the editorial brief:
 * - Short sentences. Declarative. No hedging.
 * - Data weaponized in the reader's favor.
 * - Humor dry and knowing, at the company's expense.
 * - Never motivational. Never corporate. Never long.
 * - If it sounds like a press release, rewrite it.
 */

// Corporate filler to strip
const HEDGE_PHRASES = [
  /it (should be|is worth) (noted|mentioning|noting) that\s*/gi,
  /it('s| is) important to (note|recognize|understand|remember) that\s*/gi,
  /this (isn't just|is not just) about\s*/gi,
  /the (real|core|key|bigger|fundamental|underlying) (issue|question|problem|concern) (is|here is):?\s*/gi,
  /what this (really |actually )?means is\s*/gi,
  /this (highlights|underscores|illustrates|demonstrates|reveals|shows|signals)\s*(that\s*)?/gi,
  /while (this|it|the) (may |might )?(seem|appear|look|sound)\s*/gi,
  /at the end of the day,?\s*/gi,
  /in (today's|the current) (climate|landscape|environment|economy),?\s*/gi,
  /the bottom line (is|here):?\s*/gi,
  /moving forward,?\s*/gi,
  /it remains to be seen\s*/gi,
  /only time will tell\s*/gi,
  /the reality is\s*/gi,
  /the fact (of the matter |)is\s*/gi,
  /broadly speaking,?\s*/gi,
  /in other words,?\s*/gi,
  /essentially,?\s*/gi,
  /fundamentally,?\s*/gi,
  /interestingly,?\s*/gi,
];

// Passive/soft openers to trim
const SOFT_OPENERS = [
  /^(however|meanwhile|additionally|furthermore|moreover|notably|importantly|significantly|interestingly|consequently|ultimately|overall),?\s*/i,
  /^(that said|that being said|having said that|with that in mind),?\s*/i,
  /^(to be (fair|clear|sure)),?\s*/i,
];

export function jackyeVoice(rawTake: string): string {
  if (!rawTake || rawTake === "[FILTERED]") return "";

  let take = rawTake;

  // Strip hedge phrases
  for (const re of HEDGE_PHRASES) {
    take = take.replace(re, "");
  }

  // Strip soft openers
  for (const re of SOFT_OPENERS) {
    take = take.replace(re, "");
  }

  // Get first sentence only — that's the punch
  const firstSentence = take.split(/(?<=[.!?])\s+/)[0] || take;

  // Clean up
  let result = firstSentence
    .replace(/\s+/g, " ")
    .replace(/^["'\s]+/, "")
    .replace(/["'\s]+$/, "")
    .trim();

  // Capitalize first letter
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  // If it's still too long (>120 chars), truncate at last complete clause
  if (result.length > 120) {
    const cut = result.lastIndexOf(",", 110);
    if (cut > 40) {
      result = result.slice(0, cut) + ".";
    } else {
      result = result.slice(0, 117) + "...";
    }
  }

  // Add period if missing
  if (result.length > 0 && !/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}

/** Full take for the lightbox — strips hedging but keeps all sentences */
export function jackyeVoiceFull(rawTake: string): string {
  if (!rawTake || rawTake === "[FILTERED]") return "";

  let take = rawTake;
  for (const re of HEDGE_PHRASES) {
    take = take.replace(re, "");
  }
  for (const re of SOFT_OPENERS) {
    take = take.replace(re, "");
  }

  return take.replace(/\s+/g, " ").trim();
}
