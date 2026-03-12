/**
 * Jackye Verdict Engine
 * Translates employer intelligence signals into a human decision layer.
 */

/* ── Types ── */

export type VerdictLevel = "Yes" | "Proceed with caution" | "Not without more answers" | "I would pause";
export type VerdictConfidence = "High" | "Medium" | "Low";
export type CoverageLevel = "High" | "Medium" | "Low";

export interface SignalInput {
  key: string;
  label: string;
  weight: number;      // percent, e.g. 25
  subscore: number;    // 0–100
  status: string;
}

export interface RedFlags {
  activeLayoffsWithin90Days: boolean;
  warnWithoutTransitionSupport: boolean;
  compensationTransparencyGaps: boolean;
  opaqueHiringTechnology: boolean;
  leadershipInstability: boolean;
  highInfluenceExposure: boolean;
}

export interface LayoffTiming {
  daysSinceLastLayoff: number | null;  // null = no layoffs
}

export interface VerdictInput {
  signals: SignalInput[];
  coveragePercent: number;   // 0–100
  redFlags: RedFlags;
  layoffTiming: LayoffTiming;
}

export interface VerdictQuestion {
  text: string;
  triggeredBy: string;  // which signal/flag triggered this question
}

export interface VerdictOutput {
  clarityScore: number;
  clarityBand: string;
  dataCoverage: CoverageLevel;
  dataCoverageDesc: string;
  verdict: VerdictLevel;
  verdictConfidence: VerdictConfidence;
  jackyeTake: string;
  questionsToAsk: VerdictQuestion[];
  redFlagCount: number;
  appliedOverrides: string[];
}

/* ── Constants ── */

const VERDICT_LEVELS: VerdictLevel[] = ["Yes", "Proceed with caution", "Not without more answers", "I would pause"];

const VERDICT_COLORS: Record<VerdictLevel, { color: string; bg: string; border: string }> = {
  "Yes": { color: "text-civic-green", bg: "bg-civic-green/10", border: "border-civic-green/30" },
  "Proceed with caution": { color: "text-civic-yellow", bg: "bg-civic-yellow/10", border: "border-civic-yellow/30" },
  "Not without more answers": { color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" },
  "I would pause": { color: "text-civic-red", bg: "bg-civic-red/10", border: "border-civic-red/30" },
};

export function getVerdictColors(verdict: VerdictLevel) {
  return VERDICT_COLORS[verdict];
}

/* ── Score Computation ── */

function computeClarityScore(signals: SignalInput[]): number {
  return Math.round(signals.reduce((sum, s) => sum + (s.subscore * s.weight) / 100, 0));
}

function getClarityBand(score: number): string {
  if (score >= 80) return "High Clarity";
  if (score >= 60) return "Moderate Clarity";
  if (score >= 40) return "Low Clarity";
  return "Opaque / High Risk";
}

function getCoverage(percent: number): { level: CoverageLevel; desc: string } {
  if (percent >= 70) return { level: "High", desc: "Multiple verified public sources available." };
  if (percent >= 40) return { level: "Medium", desc: "Some public evidence exists, but gaps remain." };
  return { level: "Low", desc: "Limited public data. Score may not fully reflect employer quality." };
}

/* ── Base Verdict from Score ── */

function baseVerdictFromScore(score: number): VerdictLevel {
  if (score >= 80) return "Yes";
  if (score >= 60) return "Proceed with caution";
  if (score >= 40) return "Not without more answers";
  return "I would pause";
}

/* ── Downgrade ── */

function downgradeVerdict(current: VerdictLevel): VerdictLevel {
  const idx = VERDICT_LEVELS.indexOf(current);
  return VERDICT_LEVELS[Math.min(idx + 1, VERDICT_LEVELS.length - 1)];
}

/* ── Confidence ── */

function computeConfidence(signals: SignalInput[], coveragePercent: number): VerdictConfidence {
  const signalCount = signals.filter(s => s.subscore > 0).length;
  if (coveragePercent >= 70 && signalCount >= 4) return "High";
  if (coveragePercent >= 40 && signalCount >= 3) return "Medium";
  return "Low";
}

/* ── Red Flag Detection ── */

function countRedFlags(flags: RedFlags): { count: number; active: string[] } {
  const active: string[] = [];
  if (flags.activeLayoffsWithin90Days) active.push("Active layoffs within 90 days");
  if (flags.warnWithoutTransitionSupport) active.push("WARN notices without transition support");
  if (flags.compensationTransparencyGaps) active.push("Significant compensation transparency gaps");
  if (flags.opaqueHiringTechnology) active.push("Opaque hiring technology signals");
  if (flags.leadershipInstability) active.push("Major leadership instability");
  if (flags.highInfluenceExposure) active.push("Unusually high influence exposure");
  return { count: active.length, active };
}

/* ── Questions Generator ── */

function generateQuestions(signals: SignalInput[], flags: RedFlags, layoff: LayoffTiming): VerdictQuestion[] {
  const questions: VerdictQuestion[] = [];

  // Signal-driven questions
  const hiring = signals.find(s => s.key === "hiring");
  if (hiring && hiring.subscore < 50) {
    questions.push({ text: "Can you share the bias audit for any AI tools used in your hiring process?", triggeredBy: "Hiring Transparency" });
    questions.push({ text: "How are candidates screened before a human reviews their application?", triggeredBy: "Hiring Transparency" });
  }

  const comp = signals.find(s => s.key === "compensation");
  if (comp && comp.subscore < 60) {
    questions.push({ text: "What is the salary band for this role, and how is it benchmarked?", triggeredBy: "Compensation Clarity" });
    questions.push({ text: "Is there a published pay equity report or internal audit?", triggeredBy: "Compensation Clarity" });
  }

  const workforce = signals.find(s => s.key === "workforce");
  if (workforce && workforce.subscore < 60) {
    questions.push({ text: "Has the company filed any WARN Act notices in the past 24 months?", triggeredBy: "Workforce Stability" });
  }

  const influence = signals.find(s => s.key === "influence");
  if (influence && influence.subscore < 50) {
    questions.push({ text: "Can you explain the company's lobbying priorities and how they affect employees?", triggeredBy: "Influence Exposure" });
  }

  const leadership = signals.find(s => s.key === "leadership");
  if (leadership && leadership.subscore < 60) {
    questions.push({ text: "What percentage of leadership roles are held by underrepresented groups?", triggeredBy: "Leadership & Culture Trust" });
    questions.push({ text: "How does the company measure and report on internal culture health?", triggeredBy: "Leadership & Culture Trust" });
  }

  // Red-flag-driven questions
  if (flags.activeLayoffsWithin90Days || (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 90)) {
    questions.push({ text: "What is the current headcount plan, and is the team I'd be joining affected by recent reductions?", triggeredBy: "Recent Layoffs" });
  }
  if (flags.warnWithoutTransitionSupport) {
    questions.push({ text: "What transition support was provided to employees affected by recent layoffs?", triggeredBy: "WARN Notices" });
  }

  return questions.slice(0, 7); // cap at 7
}

/* ── Jackye's Take Generator ── */

function generateJackyeTake(
  score: number,
  verdict: VerdictLevel,
  signals: SignalInput[],
  flags: RedFlags,
  layoff: LayoffTiming,
  coverage: CoverageLevel,
): string {
  const parts: string[] = [];

  // 1. What the signals show
  const weakSignals = signals.filter(s => s.subscore < 50).map(s => s.label.toLowerCase());
  const strongSignals = signals.filter(s => s.subscore >= 70).map(s => s.label.toLowerCase());

  if (weakSignals.length > 0) {
    parts.push(`The data raises questions about ${weakSignals.join(", ")}.`);
  }
  if (strongSignals.length > 0) {
    parts.push(`On the positive side, ${strongSignals.join(" and ")} look ${strongSignals.length > 1 ? "solid" : "solid"}.`);
  }

  // 2. What that means
  switch (verdict) {
    case "Yes":
      parts.push("This employer shows strong public signals across most categories. That's not common — and it's worth noting.");
      break;
    case "Proceed with caution":
      parts.push("This isn't a red flag situation, but there are gaps that could matter. You want answers before you commit, not after.");
      break;
    case "Not without more answers":
      parts.push("There's enough uncertainty here that moving forward without more information would be a risk. The gaps aren't small.");
      break;
    case "I would pause":
      parts.push("The signals here are concerning. Whether it's instability, lack of transparency, or outsized political exposure — this is a situation where you need to protect yourself first.");
      break;
  }

  // Layoff timing context
  if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 90) {
    parts.push(`There were layoffs within the last ${layoff.daysSinceLastLayoff} days. That's recent enough to directly affect the role you're considering.`);
  } else if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 180) {
    parts.push(`Layoffs occurred within the last six months. The company may still be stabilizing — ask about the current headcount trajectory.`);
  }

  // Coverage warning
  if (coverage === "Low") {
    parts.push("I should be honest: there isn't a lot of public data to work with here. That doesn't mean it's bad — but it means you can't skip your own diligence.");
  }

  // 3. What to do next
  if (verdict === "Yes") {
    parts.push("Go in with confidence, but still ask the questions below. Good signals don't replace direct conversations.");
  } else if (verdict === "Proceed with caution") {
    parts.push("Ask the questions below before your next interview. If they can't answer them clearly, that tells you something too.");
  } else if (verdict === "Not without more answers") {
    parts.push("Before you move forward, get these questions answered — in writing if possible. Silence on these topics is a signal in itself.");
  } else {
    parts.push("I'd hold off. If you're already in process, slow it down and gather more information. There's no rush worth ignoring what the data is showing you.");
  }

  return parts.join(" ");
}

/* ── Main Engine ── */

export function computeVerdict(input: VerdictInput): VerdictOutput {
  const { signals, coveragePercent, redFlags, layoffTiming } = input;

  // Score
  const clarityScore = computeClarityScore(signals);
  const clarityBand = getClarityBand(clarityScore);

  // Coverage
  const coverage = getCoverage(coveragePercent);

  // Base verdict
  let verdict = baseVerdictFromScore(clarityScore);
  const appliedOverrides: string[] = [];

  // Red flag overrides — each active flag downgrades by one level
  const { count: redFlagCount, active: activeFlags } = countRedFlags(redFlags);
  for (const flag of activeFlags) {
    const before = verdict;
    verdict = downgradeVerdict(verdict);
    if (before !== verdict) {
      appliedOverrides.push(`Downgraded from "${before}" → "${verdict}" due to: ${flag}`);
    }
  }

  // Data coverage override
  if (coverage.level === "Low") {
    const before = verdict;
    verdict = downgradeVerdict(verdict);
    if (before !== verdict) {
      appliedOverrides.push(`Downgraded from "${before}" → "${verdict}" due to low data coverage`);
    }
  }

  // Layoff timing override — 90 days forces at least "Proceed with caution"
  if (layoffTiming.daysSinceLastLayoff !== null && layoffTiming.daysSinceLastLayoff <= 90) {
    if (verdict === "Yes") {
      verdict = "Proceed with caution";
      appliedOverrides.push('Layoffs within 90 days forced verdict to at least "Proceed with caution"');
    }
  }

  // Confidence
  let confidence = computeConfidence(signals, coveragePercent);
  if (coverage.level === "Low" && confidence === "High") {
    confidence = "Medium";
  }

  // Generate outputs
  const jackyeTake = generateJackyeTake(clarityScore, verdict, signals, redFlags, layoffTiming, coverage.level);
  const questionsToAsk = generateQuestions(signals, redFlags, layoffTiming);

  return {
    clarityScore,
    clarityBand,
    dataCoverage: coverage.level,
    dataCoverageDesc: coverage.desc,
    verdict,
    verdictConfidence: confidence,
    jackyeTake,
    questionsToAsk,
    redFlagCount,
    appliedOverrides,
  };
}
