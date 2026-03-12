/**
 * Flight Risk Score™ — 0–100
 *
 * Weighted components:
 *   Retention (median tenure)              = 35%
 *   Promotion Velocity                     = 25%
 *   Leadership Internal Promotion Ratio    = 20%
 *   Exit Pattern Analysis                  = 15%
 *   Layoff Stability Modifier              =  5%
 */

export interface FRSInput {
  retention: number;
  promotionVelocity: number;
  leadershipInternalRatio: number;
  exitPattern: number;
  layoffStability: number;
}

export interface FRSResult {
  score: number;
  label: string;
  band: "stable_builder" | "healthy_mobility" | "moderate_churn" | "high_churn" | "burn_replace";
  confidence: "High" | "Medium" | "Low";
  breakdown: { component: string; weight: number; raw: number; weighted: number }[];
}

const WEIGHTS = {
  retention: 0.35,
  promotionVelocity: 0.25,
  leadershipInternalRatio: 0.20,
  exitPattern: 0.15,
  layoffStability: 0.05,
} as const;

const LABELS: Record<string, string> = {
  retention: "Retention (Median Tenure)",
  promotionVelocity: "Promotion Velocity",
  leadershipInternalRatio: "Leadership Internal Promotion Ratio",
  exitPattern: "Exit Pattern Analysis",
  layoffStability: "Layoff Stability Modifier",
};

function getBand(score: number): FRSResult["band"] {
  if (score >= 85) return "stable_builder";
  if (score >= 70) return "healthy_mobility";
  if (score >= 55) return "moderate_churn";
  if (score >= 40) return "high_churn";
  return "burn_replace";
}

const BAND_LABELS: Record<FRSResult["band"], string> = {
  stable_builder: "Stable Career Builder",
  healthy_mobility: "Healthy Mobility",
  moderate_churn: "Moderate Churn",
  high_churn: "High Churn Risk",
  burn_replace: "Burn & Replace Culture",
};

export function computeFRSConfidence(
  sourceCount: number,
  hasDirectData: boolean,
  dataRecencyDays: number
): FRSResult["confidence"] {
  let points = 0;
  if (sourceCount >= 6) points += 3;
  else if (sourceCount >= 3) points += 2;
  else if (sourceCount >= 1) points += 1;
  if (hasDirectData) points += 2;
  if (dataRecencyDays <= 180) points += 2;
  else if (dataRecencyDays <= 365) points += 1;
  if (points >= 5) return "High";
  if (points >= 3) return "Medium";
  return "Low";
}

export function calculateFRS(input: FRSInput, confidence: FRSResult["confidence"]): FRSResult {
  const breakdown = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((key) => ({
    component: LABELS[key],
    weight: WEIGHTS[key],
    raw: Math.round(input[key]),
    weighted: Math.round(input[key] * WEIGHTS[key] * 10) / 10,
  }));

  const score = Math.round(breakdown.reduce((s, b) => s + b.weighted, 0));
  const clampedScore = Math.max(0, Math.min(100, score));
  const band = getBand(clampedScore);

  return {
    score: clampedScore,
    label: BAND_LABELS[band],
    band,
    confidence,
    breakdown,
  };
}

/** Derive sub-scores from signal arrays */
export function deriveFRSSubScores(params: {
  retentionSignals: any[];
  promotionSignals: any[];
  leadershipSignals: any[];
  exitSignals: any[];
  layoffSignals: any[];
}): FRSInput {
  const score = (signals: any[], max: number) => {
    if (!signals.length) return 15;
    let raw = 0;
    for (const s of signals) {
      const c = s.confidence || "weak";
      if (c === "direct" || c === "high") raw += 28;
      else if (c === "inferred" || c === "medium") raw += 16;
      else raw += 7;
    }
    return Math.min(raw, max);
  };

  // For layoff stability, invert: more layoff signals = lower score
  const layoffRaw = params.layoffSignals.length;
  const layoffScore = layoffRaw === 0 ? 80 : layoffRaw <= 2 ? 50 : layoffRaw <= 4 ? 30 : 10;

  return {
    retention: score(params.retentionSignals, 100),
    promotionVelocity: score(params.promotionSignals, 100),
    leadershipInternalRatio: score(params.leadershipSignals, 100),
    exitPattern: score(params.exitSignals, 100),
    layoffStability: layoffScore,
  };
}

/** Movement graph data types */
export interface MovementNode {
  id: string;
  name: string;
  type: "center" | "outgoing" | "incoming";
  count: number;
}

export interface MovementLink {
  source: string;
  target: string;
  count: number;
  direction: "outgoing" | "incoming";
}

export interface MovementGraphData {
  nodes: MovementNode[];
  links: MovementLink[];
}
