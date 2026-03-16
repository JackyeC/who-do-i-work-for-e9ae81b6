/**
 * Layoff Probability Score — 0–100
 *
 * Estimates likelihood of workforce instability based on:
 *   1. Workforce signals (30%): job posting decline, recruiter layoffs, hiring freeze
 *   2. Financial signals (25%): revenue decline, missed guidance, funding slowdown
 *   3. Operational signals (25%): WARN notices, facility closures, restructuring
 *   4. Leadership signals (20%): CFO departure, exec turnover, board shakeups
 */

export interface LayoffProbabilityInput {
  // Workforce signals
  jobPostingTrend: "growing" | "stable" | "declining" | "unknown";
  jobPostingDeclinePct: number; // 0-100, pct drop in 90 days
  hasHiringFreeze: boolean;
  hasRecruiterLayoffs: boolean;

  // Financial signals
  isPubliclyTraded: boolean;
  hasRevenueDecline: boolean;
  hasMissedGuidance: boolean;
  hasFundingSlowdown: boolean;
  revenue: string | null;

  // Operational signals
  warnNoticeCount: number;
  hasFacilityClosures: boolean;
  hasRestructuringAnnouncement: boolean;
  courtCaseCount: number; // labor-related

  // Leadership signals
  recentExecutiveDepartures: number;
  hasCfoDeparture: boolean;
  hasCeoDeparture: boolean;
  boardShakeup: boolean;
}

export interface LayoffProbabilityResult {
  score: number;
  riskLevel: "low" | "moderate" | "elevated" | "high";
  categories: {
    name: string;
    key: string;
    score: number;
    weight: number;
    signals: string[];
  }[];
  topSignals: string[];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function calculateLayoffProbability(input: LayoffProbabilityInput): LayoffProbabilityResult {
  // ─── Workforce (30%) ───
  let workforce = 20; // baseline
  const wSignals: string[] = [];

  if (input.jobPostingTrend === "declining") {
    workforce += Math.min(40, input.jobPostingDeclinePct * 1.5);
    wSignals.push(`${input.jobPostingDeclinePct}% drop in open roles (90 days)`);
  } else if (input.jobPostingTrend === "growing") {
    workforce -= 10;
    wSignals.push("Job postings are growing");
  }
  if (input.hasHiringFreeze) { workforce += 25; wSignals.push("Hiring freeze indicators detected"); }
  if (input.hasRecruiterLayoffs) { workforce += 20; wSignals.push("Recruiter layoffs detected"); }
  if (wSignals.length === 0) wSignals.push("No workforce instability signals");
  workforce = clamp(workforce);

  // ─── Financial (25%) ───
  let financial = 15;
  const fSignals: string[] = [];

  if (input.hasRevenueDecline) { financial += 30; fSignals.push("Revenue decline detected"); }
  if (input.hasMissedGuidance) { financial += 25; fSignals.push("Missed earnings guidance"); }
  if (input.hasFundingSlowdown) { financial += 20; fSignals.push("Funding slowdown detected"); }
  if (!input.isPubliclyTraded && !input.revenue) { financial += 10; fSignals.push("Private company — limited financial visibility"); }
  if (fSignals.length === 0) fSignals.push("No financial distress signals");
  financial = clamp(financial);

  // ─── Operational (25%) ───
  let operational = 10;
  const oSignals: string[] = [];

  if (input.warnNoticeCount > 0) {
    operational += Math.min(40, input.warnNoticeCount * 15);
    oSignals.push(`${input.warnNoticeCount} WARN notice(s) filed`);
  }
  if (input.hasFacilityClosures) { operational += 20; oSignals.push("Facility closures reported"); }
  if (input.hasRestructuringAnnouncement) { operational += 25; oSignals.push("Restructuring announced"); }
  if (input.courtCaseCount > 2) { operational += 10; oSignals.push(`${input.courtCaseCount} labor-related court cases`); }
  if (oSignals.length === 0) oSignals.push("No operational disruption signals");
  operational = clamp(operational);

  // ─── Leadership (20%) ───
  let leadership = 10;
  const lSignals: string[] = [];

  if (input.hasCeoDeparture) { leadership += 30; lSignals.push("CEO departure detected"); }
  if (input.hasCfoDeparture) { leadership += 25; lSignals.push("CFO departure detected"); }
  if (input.recentExecutiveDepartures >= 3) {
    leadership += 20;
    lSignals.push(`${input.recentExecutiveDepartures} executive departures recently`);
  } else if (input.recentExecutiveDepartures >= 2) {
    leadership += 10;
    lSignals.push(`${input.recentExecutiveDepartures} executive departures recently`);
  }
  if (input.boardShakeup) { leadership += 15; lSignals.push("Board shakeup detected"); }
  if (lSignals.length === 0) lSignals.push("Leadership appears stable");
  leadership = clamp(leadership);

  // ─── Composite score ───
  const score = clamp(
    workforce * 0.30 +
    financial * 0.25 +
    operational * 0.25 +
    leadership * 0.20
  );

  const riskLevel: LayoffProbabilityResult["riskLevel"] =
    score >= 70 ? "high" : score >= 50 ? "elevated" : score >= 30 ? "moderate" : "low";

  const categories = [
    { name: "Workforce Signals", key: "workforce", score: workforce, weight: 30, signals: wSignals },
    { name: "Financial Signals", key: "financial", score: financial, weight: 25, signals: fSignals },
    { name: "Operational Signals", key: "operational", score: operational, weight: 25, signals: oSignals },
    { name: "Leadership Signals", key: "leadership", score: leadership, weight: 20, signals: lSignals },
  ];

  // Collect top signals (highest-impact ones)
  const topSignals = categories
    .flatMap(c => c.signals.filter(s => !s.includes("No ") && !s.includes("appears stable") && !s.includes("Limited")))
    .slice(0, 5);

  return { score, riskLevel, categories, topSignals };
}
