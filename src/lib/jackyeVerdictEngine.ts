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
    parts.push("Look, we've got an Ugly Baby situation here. The marketing is pretty, but the receipts? Dusty. When a company makes it this hard to find public data, that's not an accident — that's a strategy.");
  } else if (weakSignals.length >= 3) {
    parts.push("Facts over Feelings: the receipts are messy. I count at least three areas where this company is giving us silence instead of substance. Human frailty is real — but so is corporate negligence.");
  } else if (weakSignals.length > 0 && strongSignals.length > 0) {
    parts.push("This is a split-personality profile. Some signals show real character; others show a company that's hoping you won't look too hard. I always look too hard.");
  } else if (weakSignals.length > 0) {
    parts.push("AI can simulate competence all day long, but these signals? They reveal character. And right now, the character sheet has some blank spots that should worry you.");
  } else {
    parts.push("I don't hand out gold stars easily, but this one earned it. The receipts match the rhetoric — and in this market, that's not just rare, it's remarkable.");
  }

  // ── 2. The 'Dirty Receipt' — connect contradictions with specifics ──

  // High influence + weak benefits/hiring = the signature callout
  if (influence && influence.subscore >= 60 && weakSignals.filter(s => s.key !== "influence").length >= 2) {
    const weakLabels = weakSignals.filter(s => s.key !== "influence").map(s => s.label.toLowerCase());
    parts.push(`Dirty Receipt #1: They've got a ${influence.subscore}/100 on Influence Exposure. They know how to write checks in DC, but when it comes to ${weakLabels.join(" and ")}? Silence. That's a massive character gap. They're obsessed with automation but ghosting on humanization.`);
  } else if (influence && influence.subscore >= 60 && hiring && hiring.subscore < 50) {
    parts.push(`Dirty Receipt: They're spending money to shape policy in Washington but haven't published a Bias Audit for their own AI hiring tools. They'll lobby Congress about workforce issues but won't tell you how their algorithm screens you out. That's not oversight — that's an obsession with automation, not people.`);
  } else if (strongSignals.length > 0) {
    const strongLabels = strongSignals.map(s => `${s.label.toLowerCase()} (${s.subscore}/100)`);
    parts.push(`Where they show up: ${strongLabels.join(", ")}. That's actual character, not a press release. Credit where it's earned.`);
  }

  // Specific HR tech / Bias Audit callout — the Redline Auditor lens
  if (flags.opaqueHiringTechnology || (hiring && hiring.subscore < 50)) {
    const lobbyingContext = (influence && influence.subscore >= 50)
      ? `They're spending on lobbyists but $0 on a published Bias Audit. That tells you everything about priorities.`
      : `No published bias audits, no transparency on how their AI screens you. In 2026, that's not a gap — it's a choice.`;
    parts.push(`The hiring tech is a black box. ${lobbyingContext} You deserve to know how you're being evaluated before a human ever sees your résumé. That's not entitlement — that's psychological safety.`);
  }

  // Compensation gaps — the "show the work" lens
  if (flags.compensationTransparencyGaps || (comp && comp.subscore < 50)) {
    parts.push("Pay transparency is weak. If they can't show you the band, the benchmark, or the equity audit — that's not complexity, that's concealment. Companies that pay fairly aren't afraid to prove it. Period.");
  }

  // Leadership instability — the human element
  if (flags.leadershipInstability || (leadership && leadership.subscore < 40)) {
    parts.push("Leadership is unstable. When the people at the top keep changing, the people in the middle absorb the chaos. That's not just organizational risk — it's a psychological safety issue for everyone who reports to someone who might not be there next quarter.");
  }

  // ── Layoff timing — direct, human-centered ──
  if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 90) {
    parts.push(`They cut people ${layoff.daysSinceLastLayoff} days ago. That wound is still open. The team you'd join hasn't finished grieving the colleagues they lost. Ask about it directly and watch their body language — not their talking points.`);
  } else if (layoff.daysSinceLastLayoff !== null && layoff.daysSinceLastLayoff <= 180) {
    parts.push("Cuts within six months. The org chart may have stabilized, but the trust hasn't. Ask whether your role existed before the layoffs, and whether the person who had it got a real transition — or a calendar invite.");
  }

  // ── 3. The 'Jackye' Closing — punchy, specific, never "do more research" ──
  switch (verdict) {
    case "Yes":
      parts.push("Facts over Feelings: this one checks out. Go in strong, ask the questions below anyway — not because you doubt them, but because good character holds up under scrutiny. That's how trust gets built.");
      break;
    case "Proceed with caution":
      parts.push("Don't just sign the offer — ask them why their PAC spending doesn't match their Pride month logo. Look at the flow of funds vs. the marketing fluff. If the character doesn't match the pitch, your talent deserves better. Trust is the currency here; don't spend yours blindly.");
      break;
    case "Not without more answers":
      parts.push("I wouldn't move until they answer the questions below — in writing. Not a phone call, not a 'we'll get back to you.' In writing. If they dodge, that's your Dirty Receipt. Silence on accountability isn't an oversight; it's a confession.");
      break;
    case "I would pause":
      parts.push("Pump the brakes. The signals are telling a story the careers page won't. Facts over Feelings: no offer is worth walking into an Ugly Baby situation where the character doesn't match the pitch. Run the chain first. Always.");
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
