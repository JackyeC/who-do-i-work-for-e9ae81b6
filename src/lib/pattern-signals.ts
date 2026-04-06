/**
 * Pattern Signal Detection — lightweight layer
 * ═══════════════════════════════════════════════
 * Identifies when a company-level signal reflects a broader
 * cross-company or policy-level trend. Uses ONLY existing data.
 *
 * Rules:
 *  - 1 short sentence max per pattern
 *  - observational, grounded, no speculation
 *  - only surface when it changes interpretation
 */

/* ── Known policy/industry trend patterns ── */

const TREND_PATTERNS: {
  match: (cat: string, type: string) => boolean;
  minCompanies: number;
  template: (count: number) => string;
}[] = [
  {
    match: (cat, type) =>
      ["conduct_culture", "workplace_discrimination", "retaliation"].includes(type) ||
      cat === "conduct_culture",
    minCompanies: 2,
    template: (n) =>
      `This conduct pattern is appearing across ${n} companies in your watchlist — worth monitoring as a sector trend.`,
  },
  {
    match: (_cat, type) =>
      ["brand_conflict", "narrative_gap"].includes(type),
    minCompanies: 2,
    template: (n) =>
      `Narrative gaps are surfacing across ${n} tracked employers — a pattern often tied to shifting public commitments.`,
  },
  {
    match: (cat, type) =>
      ["lobbying_network", "political_tie", "power_influence"].includes(type) ||
      cat === "power_influence",
    minCompanies: 2,
    template: (n) =>
      `Political spending patterns are clustering across ${n} companies you're watching.`,
  },
  {
    match: (_cat, type) =>
      ["regulatory_action", "workplace_safety"].includes(type),
    minCompanies: 2,
    template: (n) =>
      `Enforcement actions are hitting ${n} companies in your list — a signal that regulatory pressure is broadening.`,
  },
];

/* ── Alert-level pattern (news/receipt category trends) ── */

const ALERT_CATEGORY_PATTERNS: Record<string, string> = {
  layoffs:
    "This layoff signal aligns with a broader wave across the sector.",
  regulation:
    "This regulatory shift is part of a wider enforcement trend affecting multiple employers.",
  labor_organizing:
    "Labor organizing activity is accelerating across this industry segment.",
  ai_workplace:
    "AI workforce changes are appearing across federal contractors and large employers.",
};

/* ══════════════════════════════════════════
   PUBLIC API
   ══════════════════════════════════════════ */

export interface PatternInsight {
  text: string;
  /** Source pattern ID for dedup */
  key: string;
}

/**
 * Detect patterns in "What Stands Out" from tracked company signals.
 * @param signals Array of { company_id, signal_category, signal_type }
 */
export function detectStandoutPatterns(
  signals: { company_id: string; signal_category: string; signal_type: string }[]
): PatternInsight[] {
  if (!signals || signals.length < 2) return [];

  const results: PatternInsight[] = [];

  for (const pattern of TREND_PATTERNS) {
    const matching = signals.filter((s) =>
      pattern.match(s.signal_category, s.signal_type)
    );
    const uniqueCompanies = new Set(matching.map((s) => s.company_id));
    if (uniqueCompanies.size >= pattern.minCompanies) {
      results.push({
        text: pattern.template(uniqueCompanies.size),
        key: `trend-${matching[0]?.signal_type}`,
      });
    }
  }

  // Deduplicate — max 2 pattern insights to keep it lightweight
  const seen = new Set<string>();
  return results
    .filter((r) => {
      if (seen.has(r.key)) return false;
      seen.add(r.key);
      return true;
    })
    .slice(0, 2);
}

/**
 * Attach a pattern line to a "What Changed" alert if applicable.
 * Returns null if no pattern applies.
 */
export function detectAlertPattern(
  alert: {
    signal_category: string | null;
    change_description: string | null;
    company_id: string | null;
  },
  allAlerts: {
    signal_category: string | null;
    company_id: string | null;
  }[]
): string | null {
  const cat = (alert.signal_category || "").toLowerCase();

  // Check if the same signal_category appears across 2+ different companies
  const sameCategory = allAlerts.filter(
    (a) =>
      (a.signal_category || "").toLowerCase() === cat &&
      a.company_id !== alert.company_id
  );
  const uniqueOtherCompanies = new Set(
    sameCategory.map((a) => a.company_id).filter(Boolean)
  );

  if (uniqueOtherCompanies.size >= 1) {
    // Check for known category-level trend
    for (const [key, msg] of Object.entries(ALERT_CATEGORY_PATTERNS)) {
      if (cat.includes(key)) return msg;
    }
    // Generic cross-company pattern
    return `Similar signals are appearing at ${uniqueOtherCompanies.size + 1} companies you track.`;
  }

  return null;
}
