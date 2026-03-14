/**
 * Corporate Behavior Index™ (CBI) — 0–100
 *
 * Measures how responsibly a company behaves toward workers.
 * Not marketing. Not employer branding. Actual behavior signals.
 *
 * Five categories (equal weight 20% each):
 *   1. Workforce Stability    — layoffs, WARN notices, hiring patterns
 *   2. Career Mobility        — promotion velocity, internal hiring, pipeline diversity
 *   3. Pay Transparency       — salary ranges, pay equity, compensation reporting
 *   4. Governance & Leadership — executive turnover, board independence, regulatory actions
 *   5. HR Tech Ethics         — AI bias audits, algorithm transparency, compliance
 */

export interface CBIInput {
  // Workforce Stability signals
  warnNoticeCount: number;
  hasLayoffSignals: boolean;
  hasBenefitsData: boolean;
  hasSentimentData: boolean;
  sentimentPositiveRatio: number; // 0-1

  // Career Mobility signals
  hasPromotionData: boolean;
  promotionVelocityScore: number; // 0-100 if available
  hasCareerPaths: boolean;
  hasInternalMobilitySignals: boolean;
  leadershipPipelineDiversity: boolean;

  // Pay Transparency signals
  hasPayEquitySignals: boolean;
  hasCompensationBands: boolean;
  hasPublicPayReporting: boolean;
  payTransparencySignalCount: number;

  // Governance & Leadership signals
  executiveCount: number;
  boardMemberCount: number;
  boardIndependentCount: number;
  hasRevolvingDoor: boolean;
  hasDarkMoney: boolean;
  hasGovernanceDisclosures: boolean;
  isPubliclyTraded: boolean;

  // HR Tech Ethics signals
  aiHrSignalCount: number;
  hasBiasAudit: boolean;
  hasAlgorithmTransparency: boolean;
  hasComplianceDisclosure: boolean;
  aiHiringToolCount: number;
}

export interface CBICategoryScore {
  name: string;
  key: string;
  score: number;
  maxScore: number;
  signals: { label: string; found: boolean; impact: "positive" | "negative" | "neutral" }[];
}

export interface CBIResult {
  score: number;
  label: string;
  band: "exemplary" | "responsible" | "mixed" | "concerning" | "opaque";
  categories: CBICategoryScore[];
  confidence: "High" | "Medium" | "Low";
  signalCount: number;
}

function getBand(score: number): CBIResult["band"] {
  if (score >= 80) return "exemplary";
  if (score >= 65) return "responsible";
  if (score >= 45) return "mixed";
  if (score >= 25) return "concerning";
  return "opaque";
}

function getLabel(band: CBIResult["band"]): string {
  const map: Record<CBIResult["band"], string> = {
    exemplary: "Exemplary Employer",
    responsible: "Responsible Employer",
    mixed: "Mixed Signals",
    concerning: "Concerning Patterns",
    opaque: "Opaque / No Data",
  };
  return map[band];
}

function scoreWorkforceStability(input: CBIInput): CBICategoryScore {
  const signals: CBICategoryScore["signals"] = [];
  let score = 50; // baseline

  // WARN notices (negative)
  if (input.warnNoticeCount > 0) {
    score -= Math.min(25, input.warnNoticeCount * 8);
    signals.push({ label: `${input.warnNoticeCount} WARN notice(s) filed`, found: true, impact: "negative" });
  } else {
    signals.push({ label: "No WARN notices filed", found: true, impact: "positive" });
    score += 10;
  }

  // Layoff signals
  if (input.hasLayoffSignals) {
    score -= 15;
    signals.push({ label: "Layoff signals detected", found: true, impact: "negative" });
  } else {
    score += 5;
    signals.push({ label: "No layoff signals", found: false, impact: "positive" });
  }

  // Benefits data (positive)
  if (input.hasBenefitsData) {
    score += 15;
    signals.push({ label: "Benefits data published", found: true, impact: "positive" });
  } else {
    signals.push({ label: "No benefits data found", found: false, impact: "neutral" });
  }

  // Sentiment
  if (input.hasSentimentData) {
    const sentimentBonus = Math.round((input.sentimentPositiveRatio - 0.5) * 40);
    score += sentimentBonus;
    signals.push({
      label: `Worker sentiment: ${Math.round(input.sentimentPositiveRatio * 100)}% positive`,
      found: true,
      impact: input.sentimentPositiveRatio >= 0.5 ? "positive" : "negative",
    });
  }

  return { name: "Workforce Stability", key: "workforce_stability", score: Math.max(0, Math.min(100, score)), maxScore: 100, signals };
}

function scoreCareerMobility(input: CBIInput): CBICategoryScore {
  const signals: CBICategoryScore["signals"] = [];
  let score = 30; // baseline — most companies hide this

  if (input.hasPromotionData) {
    score += 20;
    signals.push({ label: "Promotion data available", found: true, impact: "positive" });
  } else {
    signals.push({ label: "No promotion data disclosed", found: false, impact: "negative" });
  }

  if (input.promotionVelocityScore > 0) {
    const bonus = Math.round(input.promotionVelocityScore * 0.3);
    score += bonus;
    signals.push({ label: `Promotion Velocity Score: ${input.promotionVelocityScore}`, found: true, impact: input.promotionVelocityScore >= 55 ? "positive" : "negative" });
  }

  if (input.hasCareerPaths) {
    score += 10;
    signals.push({ label: "Career path data found", found: true, impact: "positive" });
  }

  if (input.hasInternalMobilitySignals) {
    score += 10;
    signals.push({ label: "Internal mobility signals detected", found: true, impact: "positive" });
  }

  if (input.leadershipPipelineDiversity) {
    score += 10;
    signals.push({ label: "Leadership pipeline diversity signals", found: true, impact: "positive" });
  } else {
    signals.push({ label: "No diversity pipeline signals", found: false, impact: "neutral" });
  }

  return { name: "Career Mobility", key: "career_mobility", score: Math.max(0, Math.min(100, score)), maxScore: 100, signals };
}

function scorePayTransparency(input: CBIInput): CBICategoryScore {
  const signals: CBICategoryScore["signals"] = [];
  let score = 20; // baseline — most companies are opaque

  if (input.hasPayEquitySignals) {
    score += 25;
    signals.push({ label: "Pay equity signals detected", found: true, impact: "positive" });
  } else {
    signals.push({ label: "No pay equity reporting found", found: false, impact: "negative" });
  }

  if (input.hasCompensationBands) {
    score += 20;
    signals.push({ label: "Compensation bands published", found: true, impact: "positive" });
  } else {
    signals.push({ label: "No salary bands published", found: false, impact: "neutral" });
  }

  if (input.hasPublicPayReporting) {
    score += 20;
    signals.push({ label: "Public pay reporting available", found: true, impact: "positive" });
  }

  if (input.payTransparencySignalCount > 0) {
    score += Math.min(15, input.payTransparencySignalCount * 5);
    signals.push({ label: `${input.payTransparencySignalCount} transparency signal(s)`, found: true, impact: "positive" });
  }

  return { name: "Pay Transparency", key: "pay_transparency", score: Math.max(0, Math.min(100, score)), maxScore: 100, signals };
}

function scoreGovernance(input: CBIInput): CBICategoryScore {
  const signals: CBICategoryScore["signals"] = [];
  let score = 40; // baseline

  if (input.boardMemberCount > 0) {
    score += 10;
    const independentRatio = input.boardMemberCount > 0 ? input.boardIndependentCount / input.boardMemberCount : 0;
    signals.push({ label: `${input.boardMemberCount} board member(s), ${input.boardIndependentCount} independent`, found: true, impact: independentRatio >= 0.5 ? "positive" : "neutral" });
    if (independentRatio >= 0.67) score += 15;
    else if (independentRatio >= 0.5) score += 8;
  } else {
    signals.push({ label: "No board composition data", found: false, impact: "neutral" });
  }

  if (input.hasRevolvingDoor) {
    score -= 15;
    signals.push({ label: "Revolving door connections detected", found: true, impact: "negative" });
  }

  if (input.hasDarkMoney) {
    score -= 15;
    signals.push({ label: "Dark money connections detected", found: true, impact: "negative" });
  }

  if (input.hasGovernanceDisclosures) {
    score += 10;
    signals.push({ label: "Governance disclosures found", found: true, impact: "positive" });
  }

  if (input.isPubliclyTraded) {
    score += 10;
    signals.push({ label: "Publicly traded (SEC reporting)", found: true, impact: "positive" });
  }

  return { name: "Governance & Leadership", key: "governance", score: Math.max(0, Math.min(100, score)), maxScore: 100, signals };
}

function scoreHRTechEthics(input: CBIInput): CBICategoryScore {
  const signals: CBICategoryScore["signals"] = [];
  let score = 50; // baseline — neutral until we find signals

  if (input.aiHrSignalCount > 0) {
    // Using AI hiring tools — need to check if they're transparent
    signals.push({ label: `${input.aiHrSignalCount} AI hiring tool(s) detected`, found: true, impact: "neutral" });

    if (input.hasBiasAudit) {
      score += 25;
      signals.push({ label: "Bias audit published", found: true, impact: "positive" });
    } else {
      score -= 20;
      signals.push({ label: "No bias audit for AI tools", found: false, impact: "negative" });
    }

    if (input.hasAlgorithmTransparency) {
      score += 15;
      signals.push({ label: "Algorithm transparency disclosed", found: true, impact: "positive" });
    }

    if (input.hasComplianceDisclosure) {
      score += 10;
      signals.push({ label: "Compliance disclosures found", found: true, impact: "positive" });
    } else {
      score -= 10;
      signals.push({ label: "No compliance disclosures", found: false, impact: "negative" });
    }
  } else {
    // No AI hiring tools detected — neither good nor bad
    signals.push({ label: "No AI hiring tools detected", found: false, impact: "neutral" });
  }

  return { name: "HR Tech Ethics", key: "hr_tech_ethics", score: Math.max(0, Math.min(100, score)), maxScore: 100, signals };
}

export function calculateCBI(input: CBIInput): CBIResult {
  const categories = [
    scoreWorkforceStability(input),
    scoreCareerMobility(input),
    scorePayTransparency(input),
    scoreGovernance(input),
    scoreHRTechEthics(input),
  ];

  // Equal weights (20% each)
  const weightedScore = Math.round(categories.reduce((sum, c) => sum + c.score, 0) / categories.length);
  const score = Math.max(0, Math.min(100, weightedScore));
  const band = getBand(score);

  // Count total signals found
  const signalCount = categories.reduce((sum, c) => sum + c.signals.filter(s => s.found).length, 0);

  // Confidence based on signal coverage
  const totalSignals = categories.reduce((sum, c) => sum + c.signals.length, 0);
  const foundSignals = categories.reduce((sum, c) => sum + c.signals.filter(s => s.found).length, 0);
  const coverageRatio = totalSignals > 0 ? foundSignals / totalSignals : 0;
  const confidence: CBIResult["confidence"] = coverageRatio >= 0.6 ? "High" : coverageRatio >= 0.35 ? "Medium" : "Low";

  return { score, label: getLabel(band), band, categories, confidence, signalCount };
}
