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
    questions.push({ text: "You're spending on lobbying but haven't published a Bias Audit. Why should I trust that your hiring process is fair?", triggeredBy: "Dirty Receipt: Influence vs. Transparency" });
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

  // ── 1. The Call-Out — direct observation, never generic ──
  if (coverage === "Low") {
    parts.push("Let's be serious. The public record is nearly empty. When a company makes it this difficult to verify basic data, that is not an oversight — that is architecture. The marketing may be polished, but the receipts are absent.");
  } else if (weakSignals.length >= 3) {
    parts.push("Three or more signal categories are showing gaps. That is not noise — that is a pattern. Where there should be substance, there is silence. The question is whether that silence is strategic.");
  } else if (weakSignals.length > 0 && strongSignals.length > 0) {
    parts.push("This is a contradictory profile. Some signals show genuine institutional character; others show a company that is counting on you not looking past the careers page. The inconsistency itself is the signal.");
  } else if (weakSignals.length > 0) {
    parts.push("The data reveals gaps that no amount of employer branding can paper over. These are not edge cases — they are the areas where accountability should be most visible and is not.");
  } else {
    parts.push("The receipts align with the rhetoric. In a market where that is the exception rather than the rule, this profile is worth noting. Credit where it is earned.");
  }

  // ── 2. The 'Dirty Receipt' — connect contradictions with specifics ──

  // High influence + weak benefits/hiring = the signature callout
  if (influence && influence.subscore >= 60 && weakSignals.filter(s => s.key !== "influence").length >= 2) {
    const weakLabels = weakSignals.filter(s => s.key !== "influence").map(s => s.label.toLowerCase());
    parts.push(`They score ${influence.subscore}/100 on Influence Exposure — they know exactly how to move money in Washington. But on ${weakLabels.join(" and ")}? Silence. That gap between political investment and workforce investment is not accidental. It is a priority statement.`);
  } else if (influence && influence.subscore >= 60 && hiring && hiring.subscore < 50) {
    parts.push(`They are spending to shape policy in Washington but have not published a Bias Audit for their own AI hiring tools. They will lobby Congress on workforce issues but will not disclose how their algorithm evaluates you. That is not an oversight. That is a choice.`);
  } else if (strongSignals.length > 0) {
    const strongLabels = strongSignals.map(s => `${s.label.toLowerCase()} (${s.subscore}/100)`);
    parts.push(`Where they show up: ${strongLabels.join(", ")}. That is documented character, not a press release. Credit where it is earned.`);
  }

  // Specific HR tech / Bias Audit callout
  if (flags.opaqueHiringTechnology || (hiring && hiring.subscore < 50)) {
    const lobbyingContext = (influence && influence.subscore >= 50)
      ? `They are investing in lobbyists but not in a published Bias Audit. That tells you where the priorities actually sit.`
      : `No published bias audits, no transparency on how their AI evaluates candidates. In 2026, that is not a gap — it is a decision.`;
    parts.push(`The hiring technology is opaque. ${lobbyingContext} You are entitled to know how you are being evaluated before a human ever reviews your application.`);
  }

  // Compensation gaps — the "show the work" lens
  if (flags.compensationTransparencyGaps || (comp && comp.subscore < 50)) {
    parts.push("Pay transparency is weak. If they cannot show you the band, the benchmark, or the equity audit — that is not complexity, that is concealment. Companies that pay fairly are not afraid to prove it.");
  }

  // Leadership instability — the human element
  if (flags.leadershipInstability || (leadership && leadership.subscore < 40)) {
    parts.push("Leadership is unstable. When the people at the top keep changing, the people in the middle absorb the disruption. That is not just organizational risk — it is an environment where priorities, expectations, and reporting lines shift without warning.");
  }

  // ── Layoff timing — direct, human-centered ──
  if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 90) {
    parts.push(`They reduced headcount ${layoff.daysSinceLastLayoff} days ago. The team you would be joining has not finished processing that. Ask about it directly and observe how they respond — not the talking points, the body language.`);
  } else if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 180) {
    parts.push("Reductions within six months. The org chart may have stabilized, but institutional trust has not. Ask whether your role existed before the cuts, and whether the person who held it received a genuine transition.");
  }

  // ── 3. The 'Jackye' Closing — punchy, specific, never "do more research" ──
  switch (verdict) {
    case "Yes":
      parts.push("The data supports moving forward. Ask the questions below regardless — not because the profile raises doubt, but because strong institutional character holds up under scrutiny. That is how trust is verified.");
      break;
    case "Proceed with caution":
      parts.push("Do not sign without asking why their political spending contradicts their public positioning. Trace the flow of funds against the marketing. If the record does not match the pitch, your leverage is knowing that before they do.");
      break;
    case "Not without more answers":
      parts.push("Do not proceed until they answer the questions below — in writing. Not a phone call, not a promise to follow up. In writing. If they decline, that is the answer.");
      break;
    case "I would pause":
      parts.push("The signals are telling a story the careers page will not. No offer is worth accepting when the institutional character does not match the positioning. Verify the record first. Always.");
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
