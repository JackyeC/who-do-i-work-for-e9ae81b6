/**
 * Offer Strength Score™ — Client-side scoring engine (fallback + types)
 * Used when the AI edge function is unavailable or as instant preview.
 */

import type { LegalFlag } from "@/components/strategic-offer/CivicLegalAudit";
import type { OfferClarityReport } from "@/components/offer-clarity/OfferClarityDashboard";

/* ── Types ── */

export interface ScoreCategory {
  key: string;
  label: string;
  score: number;
  weight: number;
  confidence: "high" | "medium" | "low";
  findings: string[];
  positiveSignals?: string[];
  negativeSignals?: string[];
}

export interface RedFlag {
  title: string;
  severity: "high" | "medium" | "low";
  description: string;
  suggestedResponse?: string;
  isNegotiable?: boolean;
}

export interface GreenFlag {
  title: string;
  description: string;
}

export interface NegotiationTarget {
  item: string;
  whyItMatters: string;
  negotiability: "high" | "medium" | "low";
  suggestedFraming: string;
}

export interface OfferStrengthResult {
  categories: ScoreCategory[];
  totalScore: number;
  finalLabel: string;
  finalRecommendation: string;
  confidence: "high" | "medium" | "low";
  personalizationApplied: boolean;
  whyThisScore: string;
  redFlags: RedFlag[];
  greenFlags: GreenFlag[];
  negotiationTargets: NegotiationTarget[];
  marketBenchmark?: { available: boolean; rangeLow?: number; rangeHigh?: number; percentile?: number; note?: string };
  missingDataWarnings: string[];
}

export const SCORE_LABELS = [
  { min: 85, label: "Strong Offer", color: "text-[hsl(var(--civic-green))]" },
  { min: 70, label: "Good Offer", color: "text-primary" },
  { min: 55, label: "Mixed Offer", color: "text-[hsl(var(--civic-yellow))]" },
  { min: 40, label: "Risky Offer", color: "text-destructive" },
  { min: 0, label: "High-Risk Offer", color: "text-destructive" },
] as const;

export function getScoreLabel(score: number) {
  return SCORE_LABELS.find(l => score >= l.min) || SCORE_LABELS[SCORE_LABELS.length - 1];
}

export function getRecommendation(score: number, highSeverityCount: number, confidence: string): string {
  if (highSeverityCount >= 3 || score < 40) return "High-Risk Offer";
  if (confidence === "low") return "Get More Information";
  if (score >= 85 && highSeverityCount === 0) return "Ready to Sign";
  if (score >= 70) return "Worth Negotiating";
  if (score >= 55) return "Proceed Carefully";
  return "Get More Information";
}

/* ── Default category weights ── */
const DEFAULT_WEIGHTS = {
  compensation: 25,
  clarity: 15,
  restrictive: 20,
  benefits: 10,
  mechanics: 10,
  growth: 10,
  legal: 10,
};

/* ── Client-side fallback scoring ── */

interface FallbackInput {
  salary: number;
  baseline: number;
  bonus: string;
  equity: string;
  signOnBonus: string;
  nonCompete: string;
  repaymentClause: string;
  benefitWaitingPeriod: string;
  arbitrationClause: boolean;
  ipClause: boolean;
  hasInterview: boolean;
  additionalDetails: string;
  legalFlags: LegalFlag[];
  clarityReport: OfferClarityReport | null;
}

export function computeFallbackScore(input: FallbackInput): OfferStrengthResult {
  const { salary, baseline, bonus, equity, signOnBonus, nonCompete, repaymentClause,
    benefitWaitingPeriod, arbitrationClause, ipClause, legalFlags, clarityReport } = input;

  const redFlagCount = legalFlags.filter(f => f.severity === "red").length;
  const yellowFlagCount = legalFlags.filter(f => f.severity === "yellow").length;
  const hasBonus = !!bonus;
  const hasEquity = !!equity;
  const repaymentMonths = parseInt(repaymentClause) || 0;
  const waitDays = parseInt(benefitWaitingPeriod) || 0;

  // Category 1: Compensation
  const compScore = clarityReport?.compensation.score ??
    (salary > baseline * 1.2 ? 82 : salary > baseline * 1.05 ? 68 : salary > baseline ? 55 : salary > 0 ? 35 : 20);
  const compFindings: string[] = [];
  const compPositive: string[] = [];
  const compNegative: string[] = [];
  if (clarityReport) {
    compFindings.push(`Market percentile: ${clarityReport.compensation.percentile}th`);
    if (clarityReport.compensation.percentile >= 60) compPositive.push("Base salary at or above market median");
    else compNegative.push("Base salary below market median");
  } else if (salary > 0 && baseline > 0) {
    const pct = ((salary / baseline - 1) * 100).toFixed(0);
    compFindings.push(salary > baseline ? `Salary ${pct}% above your safety line` : "Salary at or below your safety line");
    if (salary < baseline) compNegative.push("Base salary does not cover your minimum expenses");
  }
  if (hasBonus) compPositive.push("Variable compensation included");
  else compNegative.push("No bonus or commission disclosed");
  if (hasEquity) compPositive.push("Equity component included");
  if (!hasEquity && !hasBonus) compFindings.push("No variable compensation — total comp is base-only");

  // Category 2: Contract Clarity
  const clarityScore = clarityReport?.transparency.score ?? 50;
  const clarityFindings = clarityReport?.transparency.findings?.slice(0, 3) ?? ["Contract clarity not fully assessed from provided details"];

  // Category 3: Restrictive Terms Risk (inverse — more restrictions = lower score)
  const restrictiveScore = Math.max(0, 100 - redFlagCount * 28 - yellowFlagCount * 14);
  const restrictiveFindings: string[] = [];
  const restrictiveNeg: string[] = [];
  if (arbitrationClause) restrictiveNeg.push("Mandatory arbitration limits legal options");
  if (ipClause) restrictiveNeg.push("Broad IP assignment may claim personal creations");
  if (nonCompete) {
    const isAggressive = /nationwide|global|any competitor/i.test(nonCompete);
    restrictiveNeg.push(isAggressive ? "Non-compete scope appears unusually broad" : "Non-compete clause present — review scope");
  }
  if (repaymentMonths > 24) restrictiveNeg.push(`${repaymentMonths}-month repayment obligation creates financial lock-in`);
  else if (repaymentMonths > 0) restrictiveFindings.push(`${repaymentMonths}-month repayment period detected`);
  if (restrictiveNeg.length === 0) restrictiveFindings.push("No significant restrictive clauses detected");

  // Category 4: Benefits Quality
  const benefitsScore = clarityReport?.employeeExperience.score ?? (waitDays > 60 ? 35 : waitDays > 30 ? 55 : 65);
  const benefitsFindings: string[] = [];
  if (waitDays > 60) benefitsFindings.push(`${waitDays}-day benefits waiting period creates significant coverage gap`);
  else if (waitDays > 30) benefitsFindings.push(`${waitDays}-day benefits waiting period — verify COBRA or bridge coverage`);
  else if (waitDays > 0) benefitsFindings.push(`${waitDays}-day benefits waiting period — within standard range`);
  else benefitsFindings.push("Benefits start timing not specified in offer details");

  // Category 5: Offer Mechanics & Fairness
  const mechanicsScore = salary >= baseline ? 70 : salary > 0 ? 40 : 30;
  const mechanicsFindings: string[] = [];
  if (salary >= baseline) mechanicsFindings.push("Base salary covers your calculated living expenses");
  else if (salary > 0) mechanicsFindings.push("Base salary falls below your calculated safety line");
  else mechanicsFindings.push("Base salary not provided — cannot assess financial feasibility");

  // Category 6: Career Growth Signals
  const growthScore = clarityReport?.leadershipRepresentation.score ?? 50;
  const growthFindings = clarityReport?.leadershipRepresentation.findings?.slice(0, 2) ?? ["Career growth indicators not fully assessed from available data"];

  // Category 7: Legal / Financial Risk
  const legalScore = clarityReport?.legalRisk.score ?? Math.max(0, 100 - redFlagCount * 25 - yellowFlagCount * 10);
  const legalFindings: string[] = [];
  if (repaymentMonths > 0) legalFindings.push(`Financial lock-in: ${repaymentMonths}-month repayment obligation`);
  if (redFlagCount > 0) legalFindings.push(`${redFlagCount} high-severity legal risk signal${redFlagCount > 1 ? "s" : ""}`);
  if (legalFindings.length === 0) legalFindings.push("No major legal/financial risk indicators from available data");

  const categories: ScoreCategory[] = [
    { key: "compensation", label: "Compensation Competitiveness", score: compScore, weight: 25, confidence: clarityReport ? "high" : salary > 0 ? "medium" : "low", findings: compFindings, positiveSignals: compPositive, negativeSignals: compNegative },
    { key: "clarity", label: "Contract Clarity", score: clarityScore, weight: 15, confidence: clarityReport ? "medium" : "low", findings: clarityFindings },
    { key: "restrictive", label: "Restrictive Terms Risk", score: restrictiveScore, weight: 20, confidence: (arbitrationClause || ipClause || nonCompete) ? "high" : "medium", findings: restrictiveFindings, negativeSignals: restrictiveNeg },
    { key: "benefits", label: "Benefits Quality", score: benefitsScore, weight: 10, confidence: clarityReport ? "medium" : waitDays > 0 ? "medium" : "low", findings: benefitsFindings },
    { key: "mechanics", label: "Offer Mechanics & Fairness", score: mechanicsScore, weight: 10, confidence: salary > 0 ? "medium" : "low", findings: mechanicsFindings },
    { key: "growth", label: "Career Growth Signals", score: growthScore, weight: 10, confidence: clarityReport ? "medium" : "low", findings: growthFindings },
    { key: "legal", label: "Legal / Financial Risk", score: legalScore, weight: 10, confidence: redFlagCount > 0 || repaymentMonths > 0 ? "high" : "medium", findings: legalFindings },
  ];

  const totalScore = Math.round(categories.reduce((sum, c) => sum + c.score * (c.weight / 100), 0));
  const label = getScoreLabel(totalScore);
  const highSeverityCount = legalFlags.filter(f => f.severity === "red").length;

  // Determine overall confidence
  const lowConfCats = categories.filter(c => c.confidence === "low").length;
  const overallConfidence: "high" | "medium" | "low" = lowConfCats >= 4 ? "low" : lowConfCats >= 2 ? "medium" : "high";

  // Build red flags
  const redFlags: RedFlag[] = [];
  if (arbitrationClause) redFlags.push({ title: "Mandatory Arbitration", severity: "high", description: "Waives jury trial rights. Disputes resolved in private arbitration.", suggestedResponse: "Request carve-outs for discrimination and wage claims.", isNegotiable: true });
  if (nonCompete && /nationwide|global|any competitor/i.test(nonCompete)) redFlags.push({ title: "Aggressive Non-Compete", severity: "high", description: "Scope appears unusually broad — may restrict future career options.", suggestedResponse: "Narrow to direct competitors only, 6-month max, within 50 miles.", isNegotiable: true });
  if (repaymentMonths > 24) redFlags.push({ title: "Extended Repayment Obligation", severity: "high", description: `${repaymentMonths}-month commitment creates significant financial lock-in.`, suggestedResponse: "Request prorated repayment schedule.", isNegotiable: true });
  if (salary > 0 && salary < baseline) redFlags.push({ title: "Below Safety Line", severity: "medium", description: "Base salary does not cover your calculated minimum expenses.", suggestedResponse: "Negotiate base salary above your safety line.", isNegotiable: true });
  if (ipClause) redFlags.push({ title: "Broad IP Assignment", severity: "medium", description: "May claim ownership of personal-time creations.", suggestedResponse: "Request carve-out for unrelated personal projects.", isNegotiable: true });

  // Build green flags
  const greenFlags: GreenFlag[] = [];
  if (salary > baseline * 1.15) greenFlags.push({ title: "Strong Base Salary", description: `Base salary is ${((salary / baseline - 1) * 100).toFixed(0)}% above your safety line.` });
  if (hasEquity && equity.length > 15) greenFlags.push({ title: "Equity Details Provided", description: "Equity component includes specific terms." });
  if (hasBonus) greenFlags.push({ title: "Variable Compensation Included", description: "Bonus or commission structure present." });
  if (signOnBonus) greenFlags.push({ title: "Sign-On Bonus Offered", description: "Immediate compensation boost at start." });
  if (!arbitrationClause && !ipClause && redFlagCount === 0) greenFlags.push({ title: "Clean Legal Terms", description: "No major restrictive clauses detected." });
  if (waitDays <= 30 && waitDays > 0) greenFlags.push({ title: "Quick Benefits Start", description: `Benefits begin within ${waitDays} days.` });

  // Build negotiation targets
  const negotiationTargets: NegotiationTarget[] = [];
  if (salary < baseline * 1.1 && salary > 0) negotiationTargets.push({ item: "Base Salary", whyItMatters: "Close to or below your financial safety line", negotiability: "high", suggestedFraming: "Based on my research and market data, I'd like to discuss a base salary adjustment." });
  if (!hasBonus) negotiationTargets.push({ item: "Bonus Structure", whyItMatters: "No variable compensation disclosed", negotiability: "medium", suggestedFraming: "Can we discuss a performance-based bonus component?" });
  if (waitDays > 30) negotiationTargets.push({ item: "Benefits Start Date", whyItMatters: `${waitDays}-day gap creates coverage risk`, negotiability: "medium", suggestedFraming: "Would it be possible to waive or reduce the benefits waiting period?" });
  if (nonCompete) negotiationTargets.push({ item: "Non-Compete Scope", whyItMatters: "Restricts future career options", negotiability: "high", suggestedFraming: "I'd like to narrow the non-compete to direct competitors within a reasonable geography and duration." });
  if (repaymentMonths > 0) negotiationTargets.push({ item: "Repayment Terms", whyItMatters: "Creates financial lock-in risk", negotiability: "medium", suggestedFraming: "Can we structure this with prorated repayment rather than full clawback?" });

  // Missing data warnings
  const missingDataWarnings: string[] = [];
  if (!salary) missingDataWarnings.push("Base salary not provided — compensation score is estimated.");
  if (!hasEquity && !hasBonus) missingDataWarnings.push("No variable compensation details available.");
  if (waitDays === 0 && !clarityReport) missingDataWarnings.push("Benefits start date not specified.");
  if (!clarityReport) missingDataWarnings.push("AI market analysis not available — scores use local estimates only.");

  // Why this score
  const topFactors: string[] = [];
  if (compScore < 55) topFactors.push("weak compensation");
  else if (compScore >= 75) topFactors.push("competitive compensation");
  if (restrictiveScore < 50) topFactors.push("significant restrictive clauses");
  if (legalScore < 50) topFactors.push("elevated legal/financial risk");
  if (growthScore >= 70) topFactors.push("positive growth indicators");
  const whyThisScore = topFactors.length > 0
    ? `This offer scores ${totalScore}/100 primarily due to ${topFactors.join(", ")}. ${missingDataWarnings.length > 0 ? "Some categories have limited data, which affects confidence." : ""}`
    : `This offer scores ${totalScore}/100 based on available data. ${missingDataWarnings.length > 0 ? "Several details are missing — provide more information for a stronger review." : ""}`;

  return {
    categories,
    totalScore,
    finalLabel: label.label,
    finalRecommendation: getRecommendation(totalScore, highSeverityCount, overallConfidence),
    confidence: overallConfidence,
    personalizationApplied: false,
    whyThisScore: whyThisScore.trim(),
    redFlags,
    greenFlags,
    negotiationTargets,
    missingDataWarnings,
  };
}
