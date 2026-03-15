/**
 * Inclusive Vibe Score™ — 0–100
 *
 * A weighted composite index measuring whether inclusive leadership
 * actually translates to equitable employee experience.
 *
 * Three pillars:
 *   L — Leadership Equity       (40%)  Board + Exec diversity vs benchmarks
 *   E — Employee Experience     (35%)  Retention, promotion velocity, sentiment
 *   S — Social Commitment       (25%)  Pay audits, pledges, disclosure transparency
 *
 * Formula: VibeScore = 0.40 × L + 0.35 × E + 0.25 × S
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VibeScoreInput {
  /** Leadership Equity sub-score (0-100) */
  leadershipEquity: number;
  /** Employee Experience sub-score (0-100) */
  employeeExperience: number;
  /** Social Commitment sub-score (0-100) */
  socialCommitment: number;
}

export type VibeBand =
  | "thriving_culture"
  | "strong_signals"
  | "mixed_signals"
  | "surface_level"
  | "vibe_check_failed";

export interface VibeScoreResult {
  score: number;
  label: string;
  band: VibeBand;
  confidence: "High" | "Medium" | "Low";
  breakdown: { pillar: string; weight: number; raw: number; weighted: number }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const WEIGHTS = {
  leadershipEquity: 0.40,
  employeeExperience: 0.35,
  socialCommitment: 0.25,
} as const;

const PILLAR_LABELS: Record<keyof typeof WEIGHTS, string> = {
  leadershipEquity: "Leadership Equity",
  employeeExperience: "Employee Experience",
  socialCommitment: "Social Commitment",
};

// Industry benchmarks (Fortune 500, 2024-2025)
const BENCHMARKS = {
  exec_female_pct: 31,
  exec_poc_pct: 22,
  board_female_pct: 33,
  board_poc_pct: 24,
  /** "Gold standard" diversity target */
  diversity_target: 0.30,
};

// ─── Band Logic ─────────────────────────────────────────────────────────────

function getBand(score: number): VibeBand {
  if (score >= 82) return "thriving_culture";
  if (score >= 65) return "strong_signals";
  if (score >= 48) return "mixed_signals";
  if (score >= 30) return "surface_level";
  return "vibe_check_failed";
}

const BAND_LABELS: Record<VibeBand, string> = {
  thriving_culture: "Thriving Culture",
  strong_signals: "Strong Signals",
  mixed_signals: "Mixed Signals",
  surface_level: "Surface-Level",
  vibe_check_failed: "Vibe Check Failed",
};

// ─── Confidence ─────────────────────────────────────────────────────────────

export function computeVibeConfidence(
  hasLeadershipData: boolean,
  hasRetentionData: boolean,
  hasSentimentData: boolean,
  signalCount: number,
): VibeScoreResult["confidence"] {
  let pts = 0;
  if (hasLeadershipData) pts += 2;
  if (hasRetentionData) pts += 2;
  if (hasSentimentData) pts += 1;
  if (signalCount >= 8) pts += 2;
  else if (signalCount >= 4) pts += 1;

  if (pts >= 5) return "High";
  if (pts >= 3) return "Medium";
  return "Low";
}

// ─── Sub-Score Derivers ─────────────────────────────────────────────────────

/**
 * Leadership Equity (L): Compares exec/board diversity ratios against benchmarks.
 * Uses the "standardized against 30% target" approach from the spec.
 */
export function deriveLeadershipEquity(params: {
  execFemalePct?: number;
  execPocPct?: number;
  boardFemalePct?: number;
  boardPocPct?: number;
}): number {
  const metrics: number[] = [];

  if (params.execFemalePct != null) {
    metrics.push(Math.min((params.execFemalePct / 100 / BENCHMARKS.diversity_target) * 100, 100));
  }
  if (params.execPocPct != null) {
    metrics.push(Math.min((params.execPocPct / 100 / BENCHMARKS.diversity_target) * 100, 100));
  }
  if (params.boardFemalePct != null) {
    metrics.push(Math.min((params.boardFemalePct / 100 / BENCHMARKS.diversity_target) * 100, 100));
  }
  if (params.boardPocPct != null) {
    metrics.push(Math.min((params.boardPocPct / 100 / BENCHMARKS.diversity_target) * 100, 100));
  }

  if (metrics.length === 0) return 20; // baseline when no data — transparency penalty
  return Math.round(metrics.reduce((a, b) => a + b, 0) / metrics.length);
}

/**
 * Employee Experience (E): Combines retention gap, promotion velocity, and sentiment.
 * Higher retention gap → lower score.
 */
export function deriveEmployeeExperience(params: {
  /** Promotion Velocity Score (0-100), already calculated */
  promotionVelocityScore?: number;
  /** Retention gap between majority and minority groups (0.0 to 1.0). 0 = perfect parity */
  retentionGap?: number;
  /** Average sentiment score from reviews (0-100) */
  sentimentScore?: number;
}): number {
  const components: number[] = [];

  if (params.promotionVelocityScore != null) {
    components.push(params.promotionVelocityScore);
  }
  if (params.retentionGap != null) {
    // Gap 0 = 100, Gap 0.20 = 80, Gap 0.50 = 50
    components.push(Math.max(100 - params.retentionGap * 100, 0));
  }
  if (params.sentimentScore != null) {
    components.push(params.sentimentScore);
  }

  if (components.length === 0) return 25; // baseline
  return Math.round(components.reduce((a, b) => a + b, 0) / components.length);
}

/**
 * Social Commitment (S): Aggregates binary and gradient signals for public commitments.
 */
export function deriveSocialCommitment(params: {
  hasPayEquityAudit: boolean;
  hasEEO1Published: boolean;
  hasCEOPledge: boolean;
  hasDiversityReport: boolean;
  diversityDisclosureCount?: number;
}): number {
  let score = 0;
  const maxPts = 100;

  // Major disclosures (25 pts each)
  if (params.hasPayEquityAudit) score += 25;
  if (params.hasEEO1Published) score += 25;

  // Moderate signals (15 pts each)
  if (params.hasDiversityReport) score += 20;
  if (params.hasCEOPledge) score += 15;

  // Bonus for disclosure depth
  if (params.diversityDisclosureCount && params.diversityDisclosureCount >= 3) score += 15;
  else if (params.diversityDisclosureCount && params.diversityDisclosureCount >= 1) score += 8;

  return Math.min(score, maxPts);
}

// ─── Main Calculator ────────────────────────────────────────────────────────

export function calculateVibeScore(
  input: VibeScoreInput,
  confidence: VibeScoreResult["confidence"],
): VibeScoreResult {
  const breakdown = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((key) => ({
    pillar: PILLAR_LABELS[key],
    weight: WEIGHTS[key],
    raw: Math.round(input[key]),
    weighted: Math.round(input[key] * WEIGHTS[key] * 10) / 10,
  }));

  const rawScore = breakdown.reduce((s, b) => s + b.weighted, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const band = getBand(score);

  return {
    score,
    label: BAND_LABELS[band],
    band,
    confidence,
    breakdown,
  };
}
