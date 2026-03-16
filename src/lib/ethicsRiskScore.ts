/**
 * Corporate Ethics Risk Score — 0–100
 *
 * Measures pattern of legal, ethical, or reputational risk based on:
 *   1. Regulatory Violations (25%): OSHA, EPA, antitrust, FTC
 *   2. Labor Relations (25%): union disputes, wage lawsuits, NLRB charges
 *   3. Consumer Harm (20%): enforcement actions, complaints, product safety
 *   4. Governance Issues (20%): insider trading, exec misconduct, restatements
 *   5. Environmental Compliance (10%): EPA violations, emissions, penalties
 */

export interface EthicsRiskInput {
  // Regulatory
  oshaViolationCount: number;
  ftcActionCount: number;
  antitrustInvestigations: number;
  regulatoryFineTotal: number;

  // Labor
  nlrbChargeCount: number;
  wageLawsuitCount: number;
  laborArbitrationCount: number;
  unionDisputeActive: boolean;
  discriminationSuitCount: number;

  // Consumer
  cfpbComplaintCount: number;
  consumerLawsuitCount: number;
  productRecallCount: number;

  // Governance
  insiderTradingFlags: number;
  accountingRestatements: number;
  executiveMisconductFlags: number;
  secInvestigationActive: boolean;
  hasRevolvingDoor: boolean;
  hasDarkMoney: boolean;

  // Environmental
  epaViolationCount: number;
  environmentalFineTotal: number;
  climateCommitmentBroken: boolean;
}

export interface EthicsRiskCategory {
  name: string;
  key: string;
  score: number;
  weight: number;
  signals: string[];
  level: "low" | "moderate" | "elevated" | "high";
}

export interface EthicsRiskResult {
  score: number;
  riskLevel: "low" | "moderate" | "elevated" | "high";
  categories: EthicsRiskCategory[];
  topConcerns: string[];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function level(score: number): EthicsRiskCategory["level"] {
  if (score >= 70) return "high";
  if (score >= 50) return "elevated";
  if (score >= 30) return "moderate";
  return "low";
}

export function calculateEthicsRisk(input: EthicsRiskInput): EthicsRiskResult {
  // ─── Regulatory (25%) ───
  let reg = 10;
  const rSignals: string[] = [];
  if (input.oshaViolationCount > 0) { reg += Math.min(30, input.oshaViolationCount * 8); rSignals.push(`${input.oshaViolationCount} OSHA citation(s)`); }
  if (input.ftcActionCount > 0) { reg += Math.min(25, input.ftcActionCount * 15); rSignals.push(`${input.ftcActionCount} FTC enforcement action(s)`); }
  if (input.antitrustInvestigations > 0) { reg += 20; rSignals.push("Antitrust investigation(s)"); }
  if (input.regulatoryFineTotal > 1_000_000) { reg += 15; rSignals.push(`$${(input.regulatoryFineTotal / 1_000_000).toFixed(1)}M in regulatory fines`); }
  if (rSignals.length === 0) rSignals.push("No regulatory enforcement signals");
  reg = clamp(reg);

  // ─── Labor (25%) ───
  let lab = 10;
  const labSignals: string[] = [];
  if (input.nlrbChargeCount > 0) { lab += Math.min(25, input.nlrbChargeCount * 10); labSignals.push(`${input.nlrbChargeCount} NLRB charge(s)`); }
  if (input.wageLawsuitCount > 0) { lab += Math.min(25, input.wageLawsuitCount * 12); labSignals.push(`${input.wageLawsuitCount} wage lawsuit(s)`); }
  if (input.discriminationSuitCount > 0) { lab += Math.min(20, input.discriminationSuitCount * 10); labSignals.push(`${input.discriminationSuitCount} discrimination suit(s)`); }
  if (input.unionDisputeActive) { lab += 15; labSignals.push("Active union dispute"); }
  if (input.laborArbitrationCount > 0) { lab += Math.min(10, input.laborArbitrationCount * 5); labSignals.push(`${input.laborArbitrationCount} labor arbitration(s)`); }
  if (labSignals.length === 0) labSignals.push("No labor relations concerns detected");
  lab = clamp(lab);

  // ─── Consumer (20%) ───
  let con = 5;
  const conSignals: string[] = [];
  if (input.cfpbComplaintCount > 100) { con += 20; conSignals.push(`${input.cfpbComplaintCount} CFPB complaints`); }
  else if (input.cfpbComplaintCount > 0) { con += Math.min(15, input.cfpbComplaintCount / 10); conSignals.push(`${input.cfpbComplaintCount} CFPB complaints`); }
  if (input.consumerLawsuitCount > 0) { con += Math.min(25, input.consumerLawsuitCount * 10); conSignals.push(`${input.consumerLawsuitCount} consumer lawsuit(s)`); }
  if (input.productRecallCount > 0) { con += Math.min(20, input.productRecallCount * 10); conSignals.push(`${input.productRecallCount} product recall(s)`); }
  if (conSignals.length === 0) conSignals.push("No consumer harm signals");
  con = clamp(con);

  // ─── Governance (20%) ───
  let gov = 10;
  const govSignals: string[] = [];
  if (input.secInvestigationActive) { gov += 30; govSignals.push("Active SEC investigation"); }
  if (input.insiderTradingFlags > 0) { gov += 20; govSignals.push("Insider trading flags detected"); }
  if (input.accountingRestatements > 0) { gov += 20; govSignals.push(`${input.accountingRestatements} accounting restatement(s)`); }
  if (input.executiveMisconductFlags > 0) { gov += 15; govSignals.push("Executive misconduct signals"); }
  if (input.hasRevolvingDoor) { gov += 5; govSignals.push("Revolving door connections"); }
  if (input.hasDarkMoney) { gov += 10; govSignals.push("Dark money connections detected"); }
  if (govSignals.length === 0) govSignals.push("No governance risk signals");
  gov = clamp(gov);

  // ─── Environmental (10%) ───
  let env = 5;
  const envSignals: string[] = [];
  if (input.epaViolationCount > 0) { env += Math.min(35, input.epaViolationCount * 10); envSignals.push(`${input.epaViolationCount} EPA violation(s)`); }
  if (input.environmentalFineTotal > 500_000) { env += 20; envSignals.push(`$${(input.environmentalFineTotal / 1_000_000).toFixed(1)}M in environmental fines`); }
  if (input.climateCommitmentBroken) { env += 15; envSignals.push("Climate commitment appears broken"); }
  if (envSignals.length === 0) envSignals.push("No environmental compliance issues detected");
  env = clamp(env);

  const score = clamp(
    reg * 0.25 + lab * 0.25 + con * 0.20 + gov * 0.20 + env * 0.10
  );

  const riskLevel = level(score);

  const categories: EthicsRiskCategory[] = [
    { name: "Regulatory Enforcement", key: "regulatory", score: reg, weight: 25, signals: rSignals, level: level(reg) },
    { name: "Labor Relations", key: "labor", score: lab, weight: 25, signals: labSignals, level: level(lab) },
    { name: "Consumer Harm", key: "consumer", score: con, weight: 20, signals: conSignals, level: level(con) },
    { name: "Governance Risk", key: "governance", score: gov, weight: 20, signals: govSignals, level: level(gov) },
    { name: "Environmental Compliance", key: "environmental", score: env, weight: 10, signals: envSignals, level: level(env) },
  ];

  const topConcerns = categories
    .filter(c => c.level === "elevated" || c.level === "high")
    .map(c => c.name);

  return { score, riskLevel, categories, topConcerns };
}
