/**
 * Go-To-Market (GTM) Score™ — 0–100
 *
 * Evaluates the credibility of a company's growth narrative
 * against actual hiring patterns and public signals.
 *
 * Categories:
 *   Sales Hiring Expansion   — 25%
 *   Marketing Expansion      — 20%
 *   Revenue Alignment        — 25%
 *   Executive Stability      — 20%
 *   Hiring-Layoff Balance    — 10%
 */

export interface GTMInput {
  // Sales Hiring
  recentSalesHires: number;
  totalRecentHires: number;
  hasSalesLeadershipHires: boolean;

  // Marketing Expansion
  recentMarketingHires: number;
  hasMarketingLeadership: boolean;
  hasBrandInvestmentSignals: boolean;

  // Revenue Alignment
  isPubliclyTraded: boolean;
  hasRevenueGrowth: boolean;
  hasFundingAnnouncement: boolean;
  revenue: string | null;

  // Executive Stability
  executiveTurnoverCount: number;
  executiveCount: number;
  hasCEOChange: boolean;

  // Hiring-Layoff Balance
  hasRecentLayoffs: boolean;
  hasRecentHiringFreeze: boolean;
  warnNoticeCount: number;
  isHiring: boolean;
}

export interface GTMCategoryScore {
  name: string;
  key: string;
  score: number;
  level: "High" | "Medium" | "Low";
  signals: string[];
}

export interface GTMResult {
  score: number;
  label: string;
  band: "aggressive_growth" | "steady_growth" | "mixed_signals" | "contraction_risk" | "restructuring";
  categories: GTMCategoryScore[];
  confidence: "High" | "Medium" | "Low";
  interpretation: string;
}

function getBand(score: number): GTMResult["band"] {
  if (score >= 80) return "aggressive_growth";
  if (score >= 65) return "steady_growth";
  if (score >= 45) return "mixed_signals";
  if (score >= 25) return "contraction_risk";
  return "restructuring";
}

function getLabel(band: GTMResult["band"]): string {
  const map: Record<GTMResult["band"], string> = {
    aggressive_growth: "Aggressive Growth",
    steady_growth: "Steady Growth",
    mixed_signals: "Mixed Signals",
    contraction_risk: "Contraction Risk",
    restructuring: "Restructuring Mode",
  };
  return map[band];
}

function getLevel(score: number): "High" | "Medium" | "Low" {
  if (score >= 65) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function scoreSalesExpansion(input: GTMInput): GTMCategoryScore {
  let score = 35;
  const signals: string[] = [];
  const salesRatio = input.totalRecentHires > 0 ? input.recentSalesHires / input.totalRecentHires : 0;

  if (input.recentSalesHires > 0) {
    score += Math.min(30, input.recentSalesHires * 5);
    signals.push(`${input.recentSalesHires} recent sales hire(s)`);
  }
  if (salesRatio >= 0.2) { score += 15; signals.push("Strong sales hiring concentration"); }
  if (input.hasSalesLeadershipHires) { score += 15; signals.push("Sales leadership hire detected"); }
  if (signals.length === 0) signals.push("No sales hiring signals detected");

  return { name: "Sales Hiring Expansion", key: "sales_expansion", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreMarketingExpansion(input: GTMInput): GTMCategoryScore {
  let score = 35;
  const signals: string[] = [];

  if (input.recentMarketingHires > 0) {
    score += Math.min(25, input.recentMarketingHires * 5);
    signals.push(`${input.recentMarketingHires} recent marketing hire(s)`);
  }
  if (input.hasMarketingLeadership) { score += 20; signals.push("Marketing leadership in place"); }
  if (input.hasBrandInvestmentSignals) { score += 15; signals.push("Brand investment signals detected"); }
  if (signals.length === 0) signals.push("No marketing expansion signals detected");

  return { name: "Marketing Expansion", key: "marketing_expansion", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreRevenueAlignment(input: GTMInput): GTMCategoryScore {
  let score = 40;
  const signals: string[] = [];

  if (input.isPubliclyTraded) { score += 10; signals.push("Publicly traded (financial transparency)"); }
  if (input.hasRevenueGrowth) { score += 25; signals.push("Revenue growth signals detected"); }
  if (input.hasFundingAnnouncement) { score += 15; signals.push("Recent funding announcement"); }
  if (input.revenue) { score += 5; signals.push(`Revenue: ${input.revenue}`); }
  if (signals.length === 0) signals.push("No revenue alignment data available");

  return { name: "Revenue Alignment", key: "revenue_alignment", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreExecutiveStability(input: GTMInput): GTMCategoryScore {
  let score = 60;
  const signals: string[] = [];

  if (input.hasCEOChange) { score -= 25; signals.push("Recent CEO change detected"); }
  if (input.executiveTurnoverCount > 2) {
    score -= Math.min(30, (input.executiveTurnoverCount - 2) * 10);
    signals.push(`${input.executiveTurnoverCount} executive departures`);
  } else if (input.executiveCount > 0) {
    score += 15;
    signals.push("Stable executive team");
  }
  if (signals.length === 0) signals.push("No executive stability data");

  return { name: "Executive Stability", key: "executive_stability", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreHiringLayoffBalance(input: GTMInput): GTMCategoryScore {
  let score = 50;
  const signals: string[] = [];

  if (input.hasRecentLayoffs) { score -= 25; signals.push("Recent layoffs detected"); }
  if (input.hasRecentHiringFreeze) { score -= 15; signals.push("Hiring freeze signal"); }
  if (input.warnNoticeCount > 0) { score -= Math.min(20, input.warnNoticeCount * 10); signals.push(`${input.warnNoticeCount} WARN notice(s)`); }
  if (input.isHiring) { score += 20; signals.push("Active hiring detected"); }
  if (signals.length === 0) signals.push("No hiring/layoff balance data");

  return { name: "Hiring-Layoff Balance", key: "hiring_layoff_balance", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

export function calculateGTM(input: GTMInput): GTMResult {
  const categories = [
    scoreSalesExpansion(input),
    scoreMarketingExpansion(input),
    scoreRevenueAlignment(input),
    scoreExecutiveStability(input),
    scoreHiringLayoffBalance(input),
  ];

  const weights = [0.25, 0.20, 0.25, 0.20, 0.10];
  const weightedScore = Math.round(categories.reduce((sum, c, i) => sum + c.score * weights[i], 0));
  const score = Math.max(0, Math.min(100, weightedScore));
  const band = getBand(score);

  const foundSignals = categories.reduce((sum, c) => sum + c.signals.filter(s => !s.includes("No ")).length, 0);
  const confidence: GTMResult["confidence"] = foundSignals >= 5 ? "High" : foundSignals >= 3 ? "Medium" : "Low";

  const interpretations: Record<GTMResult["band"], string> = {
    aggressive_growth: "Strong alignment between hiring patterns and growth narrative. Company is investing heavily in go-to-market.",
    steady_growth: "Hiring strategy aligns with a steady growth trajectory. Reasonable expansion signals.",
    mixed_signals: "Some disconnect between hiring patterns and growth narrative. Worth monitoring.",
    contraction_risk: "Hiring patterns don't align with stated growth ambitions. Possible contraction ahead.",
    restructuring: "Active restructuring signals. Company may be pivoting strategy or reducing operations.",
  };

  return { score, label: getLabel(band), band, categories, confidence, interpretation: interpretations[band] };
}
