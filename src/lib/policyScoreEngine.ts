/**
 * Policy Score Engine
 * Computes a 0–100 score across 4 pillars: Disclosure, Oversight, Transparency, Consistency
 * Dynamically reweights based on user-selected "situations"
 */

export type Situation =
  | "compensation"
  | "stability"
  | "caregiver"
  | "early-career"
  | "career-switcher"
  | "values-first"
  | "risk-aware"
  | "leadership"
  | "culture-safety";

export const SITUATION_LABELS: Record<Situation, string> = {
  compensation: "Compensation Focused",
  stability: "Stability Seeking",
  caregiver: "Caregiver / Flexibility",
  "early-career": "Early Career Growth",
  "career-switcher": "Career Switcher",
  "values-first": "Values-First",
  "risk-aware": "Risk-Aware",
  leadership: "Leadership Track",
  "culture-safety": "Culture & Safety Sensitive",
};

export const SITUATION_ICONS: Record<Situation, string> = {
  compensation: "💰",
  stability: "🛡️",
  caregiver: "👨‍👩‍👧",
  "early-career": "🚀",
  "career-switcher": "🔄",
  "values-first": "🧭",
  "risk-aware": "⚠️",
  leadership: "📈",
  "culture-safety": "🤝",
};

interface PillarWeights {
  disclosure: number;
  oversight: number;
  transparency: number;
  consistency: number;
}

const BASE_WEIGHTS: PillarWeights = {
  disclosure: 0.25,
  oversight: 0.20,
  transparency: 0.20,
  consistency: 0.35,
};

const SITUATION_WEIGHT_MAP: Record<Situation, PillarWeights> = {
  "values-first": { disclosure: 0.15, oversight: 0.15, transparency: 0.20, consistency: 0.50 },
  "risk-aware": { disclosure: 0.20, oversight: 0.35, transparency: 0.25, consistency: 0.20 },
  caregiver: { disclosure: 0.15, oversight: 0.15, transparency: 0.35, consistency: 0.35 },
  compensation: { disclosure: 0.30, oversight: 0.10, transparency: 0.40, consistency: 0.20 },
  stability: { disclosure: 0.20, oversight: 0.30, transparency: 0.20, consistency: 0.30 },
  "early-career": { disclosure: 0.25, oversight: 0.15, transparency: 0.30, consistency: 0.30 },
  "career-switcher": { disclosure: 0.20, oversight: 0.30, transparency: 0.25, consistency: 0.25 },
  leadership: { disclosure: 0.20, oversight: 0.30, transparency: 0.15, consistency: 0.35 },
  "culture-safety": { disclosure: 0.15, oversight: 0.20, transparency: 0.25, consistency: 0.40 },
};

export function getBlendedWeights(situations: Situation[]): PillarWeights {
  if (situations.length === 0) return BASE_WEIGHTS;
  const sum: PillarWeights = { disclosure: 0, oversight: 0, transparency: 0, consistency: 0 };
  for (const s of situations) {
    const w = SITUATION_WEIGHT_MAP[s];
    sum.disclosure += w.disclosure;
    sum.oversight += w.oversight;
    sum.transparency += w.transparency;
    sum.consistency += w.consistency;
  }
  const n = situations.length;
  return {
    disclosure: sum.disclosure / n,
    oversight: sum.oversight / n,
    transparency: sum.transparency / n,
    consistency: sum.consistency / n,
  };
}

export interface PillarScore {
  label: string;
  key: keyof PillarWeights;
  score: number;       // 0-100
  weight: number;      // 0-1
  signals: string[];   // plain-language evidence
}

export interface PolicyScoreResult {
  total: number;
  grade: string;
  pillars: PillarScore[];
  topRisks: string[];
  topStrengths: string[];
  confidence: number;  // 0-1
}

interface PolicyDataInput {
  stances: Array<{ topic: string; public_position: string; spending_reality: string; gap: string }>;
  linkages: Array<{ link_type: string; amount: number | null; description: string | null; source_entity_name: string; target_entity_name: string }>;
  darkMoney: Array<{ name: string; org_type: string; estimated_amount: number | null }>;
  tradeAssociations: Array<{ name: string }>;
  lobbyingRecords: Array<{ state: string; lobbying_spend?: number | null }>;
  signalScans: Array<{ signal_category: string; signal_type: string; signal_value: string | number | null }>;
}

function scoreDisclosure(data: PolicyDataInput): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 50; // baseline

  const lobbyingLinks = data.linkages.filter(l => l.link_type === "lobbying_on_bill" || l.link_type === "lobbying_expenditure");
  if (lobbyingLinks.length > 0) { score += 15; signals.push("Federal lobbying activity is documented in public filings"); }
  if (data.lobbyingRecords.length > 0) { score += 10; signals.push(`State-level lobbying recorded in ${data.lobbyingRecords.length} state(s)`); }
  if (data.stances.length > 0) { score += 15; signals.push(`${data.stances.length} public policy position(s) on record`); }
  if (data.darkMoney.length > 0) { score -= 20; signals.push(`${data.darkMoney.length} undisclosed spending channel(s) detected`); }
  if (data.linkages.filter(l => l.link_type === "donation_to_member").length > 0) { score += 10; signals.push("Political donation recipients are identifiable"); }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function scoreOversight(data: PolicyDataInput): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 50;

  const govSignals = data.signalScans.filter(s => s.signal_category === "company_behavior");
  if (govSignals.length > 0) { score += 10; signals.push("Company behavior signals available for evaluation"); }

  const revolving = data.linkages.filter(l => l.link_type === "revolving_door");
  if (revolving.length > 0) { score -= 15; signals.push(`${revolving.length} revolving door connection(s) between government and company`); }
  if (data.tradeAssociations.length > 3) { score -= 5; signals.push(`Member of ${data.tradeAssociations.length} trade associations — broad policy influence footprint`); }
  else if (data.tradeAssociations.length > 0) { signals.push(`Member of ${data.tradeAssociations.length} trade association(s)`); }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function scoreTransparency(data: PolicyDataInput): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 50;

  const compTransp = data.signalScans.find(s => s.signal_category === "compensation_transparency");
  if (compTransp && compTransp.signal_value != null) {
    const val = Number(compTransp.signal_value);
    if (val >= 70) { score += 20; signals.push("Compensation transparency signals are strong"); }
    else if (val >= 40) { score += 5; signals.push("Some compensation transparency signals detected"); }
    else { score -= 10; signals.push("Weak compensation transparency signals"); }
  }

  if (data.lobbyingRecords.length > 0 && data.linkages.filter(l => l.link_type === "lobbying_on_bill").length > 0) {
    score += 15; signals.push("Both federal and state lobbying records are available");
  }
  if (data.stances.filter(s => s.gap === "aligned").length > data.stances.length / 2) {
    score += 10; signals.push("Majority of public positions align with observable spending");
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function scoreConsistency(data: PolicyDataInput): { score: number; signals: string[] } {
  const signals: string[] = [];
  if (data.stances.length === 0) return { score: 50, signals: ["No public stance data available for consistency analysis"] };

  const aligned = data.stances.filter(s => s.gap === "aligned").length;
  const mixed = data.stances.filter(s => s.gap === "mixed").length;
  const conflict = data.stances.filter(s => s.gap === "direct-conflict").length;
  const total = data.stances.length;

  const alignedPct = aligned / total;
  const conflictPct = conflict / total;
  let score = Math.round(alignedPct * 80 + (1 - conflictPct) * 20);

  if (conflict > 0) signals.push(`${conflict} direct contradiction(s) between public claims and spending records`);
  if (mixed > 0) signals.push(`${mixed} topic(s) show mixed alignment between claims and actions`);
  if (aligned > 0) signals.push(`${aligned} topic(s) show consistent alignment`);
  if (data.darkMoney.length > 0 && conflict > 0) { score -= 10; signals.push("Undisclosed spending channels compound consistency concerns"); }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

function getGrade(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Weak";
  return "Poor";
}

export function computePolicyScore(data: PolicyDataInput, situations: Situation[]): PolicyScoreResult {
  const weights = getBlendedWeights(situations);

  const disclosure = scoreDisclosure(data);
  const oversight = scoreOversight(data);
  const transparency = scoreTransparency(data);
  const consistency = scoreConsistency(data);

  const pillars: PillarScore[] = [
    { label: "Disclosure", key: "disclosure", score: disclosure.score, weight: weights.disclosure, signals: disclosure.signals },
    { label: "Oversight", key: "oversight", score: oversight.score, weight: weights.oversight, signals: oversight.signals },
    { label: "Transparency", key: "transparency", score: transparency.score, weight: weights.transparency, signals: transparency.signals },
    { label: "Consistency", key: "consistency", score: consistency.score, weight: weights.consistency, signals: consistency.signals },
  ];

  const total = Math.round(
    pillars.reduce((sum, p) => sum + p.score * p.weight, 0)
  );

  // Collect all signals, sort by score impact
  const allSignals = pillars.flatMap(p => p.signals.map(s => ({ text: s, pillarScore: p.score, pillar: p.label })));
  const risks = allSignals.filter(s => s.pillarScore < 50).map(s => s.text).slice(0, 3);
  const strengths = allSignals.filter(s => s.pillarScore >= 60).map(s => s.text).slice(0, 3);

  // Confidence based on data coverage
  let coverage = 0;
  if (data.stances.length > 0) coverage += 0.3;
  if (data.linkages.length > 0) coverage += 0.25;
  if (data.signalScans.length > 0) coverage += 0.2;
  if (data.lobbyingRecords.length > 0) coverage += 0.15;
  if (data.tradeAssociations.length > 0) coverage += 0.1;

  return {
    total,
    grade: getGrade(total),
    pillars,
    topRisks: risks.length > 0 ? risks : ["No significant risks detected based on available data"],
    topStrengths: strengths.length > 0 ? strengths : ["Insufficient data to confirm strengths"],
    confidence: Math.min(1, coverage),
  };
}

export function getSituationsFromStorage(): Situation[] {
  try {
    const stored = localStorage.getItem("userSituations");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

export function saveSituationsToStorage(situations: Situation[]) {
  localStorage.setItem("userSituations", JSON.stringify(situations));
}
