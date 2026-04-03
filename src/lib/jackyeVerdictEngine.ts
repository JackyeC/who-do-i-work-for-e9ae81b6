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
/* These aren't polite suggestions — they're audit questions. */

function generateQuestions(signals: SignalInput[], flags: RedFlags, layoff: LayoffTiming): VerdictQuestion[] {
  const questions: VerdictQuestion[] = [];

  // Signal-driven questions — specific, auditor-style
  const hiring = signals.find(s => s.key === "hiring");
  if (hiring && hiring.subscore < 50) {
    questions.push({ text: "Show me the bias audit for your AI screening tools. Not a summary — the actual audit.", triggeredBy: "Hiring Transparency" });
    questions.push({ text: "How many candidates does a human actually review vs. how many your algorithm filters out?", triggeredBy: "Hiring Transparency" });
  }

  const comp = signals.find(s => s.key === "compensation");
  if (comp && comp.subscore < 60) {
    questions.push({ text: "What's the salary band for this role, and where does this offer sit within it? Show me the benchmark methodology.", triggeredBy: "Compensation Clarity" });
    questions.push({ text: "Has the company published a pay equity audit in the last 24 months? If not, why not?", triggeredBy: "Compensation Clarity" });
  }

  const workforce = signals.find(s => s.key === "workforce");
  if (workforce && workforce.subscore < 60) {
    questions.push({ text: "Did this role exist before the most recent layoffs, or is this backfill?", triggeredBy: "Workforce Stability" });
  }

  const influence = signals.find(s => s.key === "influence");
  if (influence && influence.subscore < 50) {
    questions.push({ text: "Your company's PAC donated to [X]. How does that align with the values on your careers page?", triggeredBy: "Influence Exposure" });
  } else if (influence && influence.subscore >= 60) {
    questions.push({ text: "You spend significantly on lobbying and political influence. What's the connection between those priorities and how you treat your workforce?", triggeredBy: "Influence Exposure" });
  }

  const leadership = signals.find(s => s.key === "leadership");
  if (leadership && leadership.subscore < 60) {
    questions.push({ text: "Three C-suite changes in two years is a pattern, not a coincidence. What's driving the turnover at the top?", triggeredBy: "Leadership & Culture Trust" });
    questions.push({ text: "What does psychological safety actually look like on this team — not the handbook version, the real version?", triggeredBy: "Leadership & Culture Trust" });
  }

  // Red-flag-driven questions
  if (flags.activeLayoffsWithin90Days || (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 90)) {
    questions.push({ text: "You cut people recently. What's the current headcount plan for my team, and is the budget secured for the next 18 months?", triggeredBy: "Recent Layoffs" });
  }
  if (flags.warnWithoutTransitionSupport) {
    questions.push({ text: "What transition support did affected employees actually receive? Severance, outplacement, or just a calendar invite?", triggeredBy: "WARN Notices" });
  }
  if (flags.opaqueHiringTechnology && flags.highInfluenceExposure) {
    questions.push({ text: "You invest in lobbying but have not published a Bias Audit. How should I evaluate the fairness of your hiring process?", triggeredBy: "Influence vs. Transparency Gap" });
  }

  return questions.slice(0, 7);
}

/* ── Jackye's Take Generator ── */
/* Voice: Transparent, witty, authoritative. The "Redline Auditor" of HR Tech. */
/* Goal: Deliver "Accountability Intelligence" — expose the gap between says and does. */

function generateJackyeTake(
  score: number,
  verdict: VerdictLevel,
  signals: SignalInput[],
  flags: RedFlags,
  layoff: LayoffTiming,
  coverage: CoverageLevel,
): string {
  const parts: string[] = [];

  // Helper lookups
  const weakSignals = signals.filter(s => s.subscore < 50);
  const strongSignals = signals.filter(s => s.subscore >= 70);
  const influence = signals.find(s => s.key === "influence");
  const hiring = signals.find(s => s.key === "hiring");
  const comp = signals.find(s => s.key === "compensation");
  const workforce = signals.find(s => s.key === "workforce");
  const leadership = signals.find(s => s.key === "leadership");

  // ── 1. The Call-Out — what you see vs what it is ──
  if (coverage === "Low") {
    parts.push("The public record is nearly empty. That's not an oversight. When a company makes it this hard to verify basic data, they've made a choice. The marketing is polished. The receipts are absent.");
  } else if (weakSignals.length >= 3) {
    parts.push("Three or more signal categories are showing gaps. That's not noise — that's a pattern. Where there should be substance, there's silence. The question is whether that silence is strategic.");
  } else if (weakSignals.length > 0 && strongSignals.length > 0) {
    parts.push("This is a contradictory profile. Some signals show real institutional character. Others show a company counting on you not looking past the careers page. The inconsistency is the signal.");
  } else if (weakSignals.length > 0) {
    parts.push("There are gaps here that no amount of employer branding covers. These aren't edge cases — they're the areas where accountability should be most visible. And it isn't.");
  } else {
    parts.push("The receipts match the rhetoric. In a market where that's the exception, this profile is worth noting. Credit where it's earned.");
  }

  // ── 2. The Receipt — connect contradictions with specifics ──

  if (influence && influence.subscore >= 60 && weakSignals.filter(s => s.key !== "influence").length >= 2) {
    const weakLabels = weakSignals.filter(s => s.key !== "influence").map(s => s.label.toLowerCase());
    parts.push(`They score ${influence.subscore}/100 on Influence Exposure — they know how to move money in Washington. But on ${weakLabels.join(" and ")}? Silence. That gap between political investment and workforce investment isn't accidental.`);
  } else if (influence && influence.subscore >= 60 && hiring && hiring.subscore < 50) {
    parts.push("They're spending to shape policy in Washington but haven't published a Bias Audit for their own AI hiring tools. They'll lobby Congress on workforce issues but won't disclose how their algorithm evaluates you. Yeah… that's not what this is.");
  } else if (strongSignals.length > 0) {
    const strongLabels = strongSignals.map(s => `${s.label.toLowerCase()} (${s.subscore}/100)`);
    parts.push(`Where they show up: ${strongLabels.join(", ")}. That's documented character, not a press release.`);
  }

  // Hiring tech opacity
  if (flags.opaqueHiringTechnology || (hiring && hiring.subscore < 50)) {
    const lobbyingContext = (influence && influence.subscore >= 50)
      ? "They're investing in lobbyists but not in a published Bias Audit. That tells you where the priorities actually sit."
      : "No published bias audits, no transparency on how their AI evaluates candidates. In 2026, that's not a gap — it's a decision.";
    parts.push(`The hiring technology is opaque. ${lobbyingContext} You're entitled to know how you're being evaluated before a human ever sees your application.`);
  }

  // Compensation gaps
  if (flags.compensationTransparencyGaps || (comp && comp.subscore < 50)) {
    parts.push("Pay transparency is weak. If they can't show you the band, the benchmark, or the equity audit — that's not complexity. That's concealment. Companies that pay fairly aren't afraid to prove it.");
  }

  // Leadership instability
  if (flags.leadershipInstability || (leadership && leadership.subscore < 40)) {
    parts.push("Leadership is unstable. When the people at the top keep changing, the people in the middle absorb it. Priorities shift, reporting lines move, expectations reset. That's not just org risk — it's your daily reality.");
  }

  // ── Layoff timing ──
  if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 90) {
    parts.push(`They reduced headcount ${layoff.daysSinceLastLayoff} days ago. The team you'd be joining hasn't finished processing that. Ask about it directly and watch how they respond — not the talking points. The body language.`);
  } else if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 180) {
    parts.push("Reductions within six months. The org chart may have stabilized, but trust hasn't. Ask whether your role existed before the cuts. That answer tells you more than the job description.");
  }

  // ── 3. The Closing — calm, factual, no theatrics ──
  switch (verdict) {
    case "Yes":
      parts.push("The data supports moving forward. Ask the questions below anyway — not because the profile raises doubt, but because strong character holds up under scrutiny. That's how trust is verified.");
      break;
    case "Proceed with caution":
      parts.push("Don't sign without asking why their political spending contradicts their public positioning. If the record doesn't match the pitch, your leverage is knowing that before they do.");
      break;
    case "Not without more answers":
      parts.push("Don't proceed until they answer the questions below — in writing. Not a phone call. Not a promise to follow up. In writing. If they decline, that's the answer.");
      break;
    case "I would pause":
      parts.push("The signals are telling a story the careers page won't. No offer is worth accepting when the institutional character doesn't match the positioning. Facts over feelings.");
      break;
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
