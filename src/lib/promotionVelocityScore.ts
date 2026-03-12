/**
 * Promotion Velocity Score™ — 0–100
 *
 * Weighted components:
 *   Career Path Progression Data    = 35%
 *   Internal Promotion Signals      = 20%
 *   Leadership Pipeline Diversity   = 15%
 *   Retention / Attrition Pattern   = 15%
 *   Learning & Mobility Infra       = 10%
 *   Transparency Modifier           =  5%
 */

export interface PVSInput {
  careerPathProgression: number;
  internalPromotionSignals: number;
  leadershipPipelineDiversity: number;
  retentionPattern: number;
  learningMobilityInfra: number;
  transparencyModifier: number;
}

export interface PVSResult {
  score: number;
  label: string;
  band: "strong_growth" | "healthy_mobility" | "mixed_mobility" | "slow_advancement" | "stagnation_risk";
  confidence: "High" | "Medium" | "Low";
  breakdown: { component: string; weight: number; raw: number; weighted: number }[];
}

const WEIGHTS = {
  careerPathProgression: 0.35,
  internalPromotionSignals: 0.20,
  leadershipPipelineDiversity: 0.15,
  retentionPattern: 0.15,
  learningMobilityInfra: 0.10,
  transparencyModifier: 0.05,
} as const;

const LABELS: Record<string, string> = {
  careerPathProgression: "Career Path Progression",
  internalPromotionSignals: "Internal Promotion Signals",
  leadershipPipelineDiversity: "Leadership Pipeline Diversity",
  retentionPattern: "Retention & Attrition Pattern",
  learningMobilityInfra: "Learning & Mobility Infrastructure",
  transparencyModifier: "Transparency Modifier",
};

function getBand(score: number): PVSResult["band"] {
  if (score >= 85) return "strong_growth";
  if (score >= 70) return "healthy_mobility";
  if (score >= 55) return "mixed_mobility";
  if (score >= 40) return "slow_advancement";
  return "stagnation_risk";
}

function getLabel(band: PVSResult["band"]): string {
  const map: Record<PVSResult["band"], string> = {
    strong_growth: "Strong Internal Growth",
    healthy_mobility: "Healthy Mobility",
    mixed_mobility: "Mixed Mobility",
    slow_advancement: "Slow Advancement",
    stagnation_risk: "Stagnation Risk",
  };
  return map[band];
}

export function computeConfidence(
  sourceCount: number,
  hasDirectEvidence: boolean,
  dataRecencyDays: number
): PVSResult["confidence"] {
  let points = 0;
  if (sourceCount >= 5) points += 3;
  else if (sourceCount >= 3) points += 2;
  else if (sourceCount >= 1) points += 1;

  if (hasDirectEvidence) points += 2;
  if (dataRecencyDays <= 180) points += 2;
  else if (dataRecencyDays <= 365) points += 1;

  if (points >= 5) return "High";
  if (points >= 3) return "Medium";
  return "Low";
}

export function calculatePVS(input: PVSInput, confidence: PVSResult["confidence"]): PVSResult {
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
    label: getLabel(band),
    band,
    confidence,
    breakdown,
  };
}

/** Evidence strength scoring using the 7-Layer model */
function layerSignalScore(signals: any[], max: number): number {
  if (!signals.length) return 12; // baseline for no data — slight penalty vs old 15

  // Weight by evidence strength
  let raw = 0;
  for (const s of signals) {
    const conf = s.confidence || "weak";
    if (conf === "direct" || conf === "high") raw += 28;
    else if (conf === "inferred" || conf === "medium") raw += 16;
    else raw += 7;
  }
  return Math.min(raw, max);
}

/** Derive sub-scores from raw signal arrays */
export function deriveSubScores(params: {
  promotionSignals: any[];
  mobilitySignals: any[];
  diversitySignals: any[];
  retentionSignals: any[];
  learningSignals: any[];
  transparencyCategories: number;
  totalCategories: number;
}): PVSInput {
  return {
    careerPathProgression: layerSignalScore(params.promotionSignals, 100),
    internalPromotionSignals: layerSignalScore(params.mobilitySignals, 100),
    leadershipPipelineDiversity: layerSignalScore(params.diversitySignals, 100),
    retentionPattern: layerSignalScore(params.retentionSignals, 100),
    learningMobilityInfra: layerSignalScore(params.learningSignals, 100),
    transparencyModifier: params.totalCategories > 0
      ? Math.round((params.transparencyCategories / params.totalCategories) * 100)
      : 12,
  };
}
