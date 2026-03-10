/**
 * 2026 Economic Intelligence Layer
 * Static data from BLS National Employment Matrix (2024-2034),
 * FRED Business Survey Indexes, BEA GDP by Industry, and Zillow Market Forecasts.
 * Last updated: March 2026
 */

// ── BLS Occupational Growth & Decay (2024–2034 Projections) ──

export interface OccupationalOutlook {
  occupation: string;
  growthPct: number;
  velocity: "high-velocity" | "growing" | "stable" | "declining" | "saturated";
  blsCode?: string;
  medianSalary?: string;
  relatedSkills: string[];
  adjacentPivots?: string[]; // for declining roles
}

export const HIGH_VELOCITY_PATHS: OccupationalOutlook[] = [
  { occupation: "Solar Photovoltaic Installer", growthPct: 180, velocity: "high-velocity", medianSalary: "$48,800", relatedSkills: ["electrical systems", "renewable energy", "installation", "safety compliance"], blsCode: "47-2231" },
  { occupation: "Wind Turbine Service Technician", growthPct: 81, velocity: "high-velocity", medianSalary: "$61,770", relatedSkills: ["mechanical systems", "turbine maintenance", "SCADA", "safety protocols"], blsCode: "49-9081" },
  { occupation: "Nurse Practitioner", growthPct: 46, velocity: "high-velocity", medianSalary: "$126,260", relatedSkills: ["patient care", "diagnostics", "prescriptive authority", "clinical leadership"], blsCode: "29-1171" },
  { occupation: "Data Scientist", growthPct: 36, velocity: "high-velocity", medianSalary: "$108,020", relatedSkills: ["machine learning", "statistics", "Python", "data visualization"], blsCode: "15-2051" },
  { occupation: "Information Security Analyst", growthPct: 33, velocity: "high-velocity", medianSalary: "$120,360", relatedSkills: ["cybersecurity", "risk assessment", "SIEM", "compliance frameworks"], blsCode: "15-1212" },
  { occupation: "Substance Abuse/Mental Health Counselor", growthPct: 26, velocity: "high-velocity", medianSalary: "$53,710", relatedSkills: ["clinical counseling", "crisis intervention", "motivational interviewing", "treatment planning"], blsCode: "21-1018" },
  { occupation: "AI/ML Engineer", growthPct: 34, velocity: "high-velocity", medianSalary: "$136,620", relatedSkills: ["deep learning", "NLP", "MLOps", "transformer architectures"], blsCode: "15-2051" },
  { occupation: "Physician Assistant", growthPct: 28, velocity: "high-velocity", medianSalary: "$130,020", relatedSkills: ["clinical assessment", "surgical assist", "patient management", "EHR systems"], blsCode: "29-1071" },
];

export const DECLINING_PATHS: OccupationalOutlook[] = [
  { occupation: "Computer Programmer", growthPct: -6, velocity: "saturated", medianSalary: "$99,700", relatedSkills: ["coding", "debugging", "software development"], adjacentPivots: ["AI Implementation Specialist", "DevOps Engineer", "Cloud Architect"], blsCode: "15-1251" },
  { occupation: "Customer Service Representative", growthPct: -5, velocity: "saturated", medianSalary: "$39,680", relatedSkills: ["communication", "CRM", "problem solving"], adjacentPivots: ["Customer Success Manager", "UX Researcher", "Community Manager"], blsCode: "43-4051" },
  { occupation: "Data Entry Keyer", growthPct: -32, velocity: "saturated", medianSalary: "$37,970", relatedSkills: ["typing", "data management", "attention to detail"], adjacentPivots: ["Data Analyst", "RPA Developer", "Business Intelligence Analyst"], blsCode: "43-9021" },
  { occupation: "Executive Secretary", growthPct: -21, velocity: "saturated", medianSalary: "$68,230", relatedSkills: ["admin management", "scheduling", "document prep"], adjacentPivots: ["Project Manager", "Operations Coordinator", "Chief of Staff"], blsCode: "43-6011" },
  { occupation: "Word Processor/Typist", growthPct: -36, velocity: "saturated", medianSalary: "$46,010", relatedSkills: ["document formatting", "transcription", "proofreading"], adjacentPivots: ["Content Strategist", "Technical Writer", "Prompt Engineer"], blsCode: "43-9022" },
];

// ── FRED: Industry Contraction & Stability (PMI-based) ──

export interface IndustryPulse {
  sector: string;
  pmiValue: number; // <50 = contraction
  trend: "expanding" | "stable" | "contracting";
  signal: string;
  investmentSignal?: string;
}

export const INDUSTRY_PULSE_2026: IndustryPulse[] = [
  { sector: "Manufacturing", pmiValue: 48.2, trend: "contracting", signal: "Sector Volatility — Manufacturing PMI below 50 for Q1 2026", investmentSignal: "IP investment up 7.4% — growth for R&D and Legal roles" },
  { sector: "Healthcare Services", pmiValue: 57.8, trend: "expanding", signal: "Strong expansion — driven by aging population and mental health demand" },
  { sector: "Technology/Information", pmiValue: 54.1, trend: "expanding", signal: "Moderate growth — AI infrastructure spending driving demand", investmentSignal: "Enterprise AI spending up 42% YoY" },
  { sector: "Construction", pmiValue: 50.8, trend: "stable", signal: "Holding steady — infrastructure bill projects sustaining demand" },
  { sector: "Financial Services", pmiValue: 52.3, trend: "expanding", signal: "Moderate expansion — fintech and compliance roles growing" },
  { sector: "Retail Trade", pmiValue: 46.5, trend: "contracting", signal: "Contraction — e-commerce consolidation reducing traditional retail roles" },
  { sector: "Professional Services", pmiValue: 55.6, trend: "expanding", signal: "Strong growth — consulting and advisory services in high demand" },
  { sector: "Energy", pmiValue: 56.2, trend: "expanding", signal: "Expansion — clean energy transition creating new roles" },
];

// ── BEA: Sector GDP Expansion (Q4 2025 / Q1 2026) ──

export interface SectorGDP {
  sector: string;
  gdpGrowthPct: number;
  rank: number;
  opportunity: string;
  topRoles: string[];
}

export const SECTOR_GDP_2026: SectorGDP[] = [
  { sector: "Health Care & Social Assistance", gdpGrowthPct: 4.4, rank: 1, opportunity: "Largest GDP contributor — aging population + mental health expansion", topRoles: ["Nurse Practitioner", "Health Informatics Analyst", "Behavioral Health Specialist"] },
  { sector: "Information & Technology", gdpGrowthPct: 3.8, rank: 2, opportunity: "AI infrastructure and cybersecurity driving GDP growth", topRoles: ["AI/ML Engineer", "Cloud Architect", "InfoSec Analyst"] },
  { sector: "Professional & Business Services", gdpGrowthPct: 3.2, rank: 3, opportunity: "Consulting and managed services demand increasing", topRoles: ["Management Consultant", "Business Analyst", "Program Manager"] },
  { sector: "Finance & Insurance", gdpGrowthPct: 2.8, rank: 4, opportunity: "Fintech and regulatory compliance fueling growth", topRoles: ["Compliance Officer", "Fintech PM", "Risk Analyst"] },
  { sector: "Construction", gdpGrowthPct: 2.4, rank: 5, opportunity: "Infrastructure modernization and clean energy projects", topRoles: ["Project Manager", "Civil Engineer", "Sustainability Coordinator"] },
  { sector: "Manufacturing", gdpGrowthPct: 0.6, rank: 8, opportunity: "Slow — automation offsetting reshoring gains", topRoles: ["Automation Engineer", "Supply Chain Analyst", "Quality Engineer"] },
  { sector: "Retail Trade", gdpGrowthPct: -0.3, rank: 10, opportunity: "Declining — pivot to e-commerce operations and logistics", topRoles: ["E-Commerce Manager", "Supply Chain Analyst", "CX Designer"] },
];

// ── Zillow: Affordability Bridge Markets (2026 Forecast) ──

export interface AffordabilityMarket {
  metro: string;
  state: string;
  medianRent: number;
  medianIncome: number;
  incomeToRentRatio: number;
  rentGrowthYoY: number;
  incomeGrowthYoY: number;
  category: "small-win" | "high-cost" | "emerging";
  purchasingPowerBonus?: number; // % more purchasing power vs NYC/SF baseline
}

export const AFFORDABILITY_MARKETS: AffordabilityMarket[] = [
  { metro: "Indianapolis, IN", state: "IN", medianRent: 1280, medianIncome: 62400, incomeToRentRatio: 4.06, rentGrowthYoY: 2.1, incomeGrowthYoY: 4.8, category: "small-win", purchasingPowerBonus: 62 },
  { metro: "Atlanta, GA", state: "GA", medianRent: 1650, medianIncome: 71200, incomeToRentRatio: 3.60, rentGrowthYoY: 1.8, incomeGrowthYoY: 5.2, category: "small-win", purchasingPowerBonus: 44 },
  { metro: "Raleigh, NC", state: "NC", medianRent: 1580, medianIncome: 74800, incomeToRentRatio: 3.95, rentGrowthYoY: 2.3, incomeGrowthYoY: 5.6, category: "small-win", purchasingPowerBonus: 48 },
  { metro: "Columbus, OH", state: "OH", medianRent: 1220, medianIncome: 59800, incomeToRentRatio: 4.08, rentGrowthYoY: 1.9, incomeGrowthYoY: 4.2, category: "small-win", purchasingPowerBonus: 58 },
  { metro: "Salt Lake City, UT", state: "UT", medianRent: 1520, medianIncome: 68900, incomeToRentRatio: 3.78, rentGrowthYoY: 2.5, incomeGrowthYoY: 5.1, category: "small-win", purchasingPowerBonus: 41 },
  { metro: "Pittsburgh, PA", state: "PA", medianRent: 1180, medianIncome: 58200, incomeToRentRatio: 4.11, rentGrowthYoY: 1.4, incomeGrowthYoY: 3.8, category: "small-win", purchasingPowerBonus: 64 },
  { metro: "New York, NY", state: "NY", medianRent: 3450, medianIncome: 85200, incomeToRentRatio: 2.06, rentGrowthYoY: 3.2, incomeGrowthYoY: 2.8, category: "high-cost" },
  { metro: "San Francisco, CA", state: "CA", medianRent: 3200, medianIncome: 98500, incomeToRentRatio: 2.56, rentGrowthYoY: 2.9, incomeGrowthYoY: 2.1, category: "high-cost" },
  { metro: "Austin, TX", state: "TX", medianRent: 1680, medianIncome: 72100, incomeToRentRatio: 3.57, rentGrowthYoY: 0.8, incomeGrowthYoY: 4.9, category: "emerging", purchasingPowerBonus: 38 },
  { metro: "Boise, ID", state: "ID", medianRent: 1420, medianIncome: 61500, incomeToRentRatio: 3.61, rentGrowthYoY: 1.2, incomeGrowthYoY: 4.5, category: "emerging", purchasingPowerBonus: 52 },
];

export const HIGH_COST_BASELINE_RENT = 3325; // avg of NYC + SF

// ── AI Early-Career Signal (Anthropic/BLS March 2026) ──

export const EARLY_CAREER_AI_SIGNAL = {
  headline: "AI hasn't caused mass unemployment — but it has significantly slowed hiring for entry-level professional roles (ages 22–25).",
  source: "Anthropic/BLS Working Paper, March 2026",
  strategy: "Early-career professionals should prioritize 'Agentic Workflow' skills — prompt engineering, AI tool orchestration, and human-AI collaboration — to stand out in a slow-hiring market.",
  affectedRoles: ["Junior Software Developer", "Entry-Level Analyst", "Associate Consultant", "Junior Designer", "Content Writer"],
  recommendedSkills: ["Agentic AI Workflows", "Prompt Engineering", "AI Tool Orchestration", "Human-AI Collaboration", "Automation Design"],
};

// ── Utility: Match user skills/role to economic signals ──

export function getOccupationalOutlook(jobTitle: string, skills: string[]): {
  matchedGrowth: OccupationalOutlook[];
  matchedDecline: OccupationalOutlook[];
  pivotRequired: boolean;
} {
  const titleLower = jobTitle.toLowerCase();
  const skillsLower = skills.map(s => s.toLowerCase());

  const matchedGrowth = HIGH_VELOCITY_PATHS.filter(p =>
    p.occupation.toLowerCase().includes(titleLower) ||
    titleLower.includes(p.occupation.toLowerCase().split(" ")[0]) ||
    p.relatedSkills.some(rs => skillsLower.some(us => us.includes(rs) || rs.includes(us)))
  );

  const matchedDecline = DECLINING_PATHS.filter(p =>
    p.occupation.toLowerCase().includes(titleLower) ||
    titleLower.includes(p.occupation.toLowerCase().split(" ")[0]) ||
    p.relatedSkills.some(rs => skillsLower.some(us => us.includes(rs) || rs.includes(us)))
  );

  return { matchedGrowth, matchedDecline, pivotRequired: matchedDecline.length > 0 };
}

export function getSectorVolatility(industries: string[]): IndustryPulse[] {
  const indLower = industries.map(i => i.toLowerCase());
  return INDUSTRY_PULSE_2026.filter(p =>
    indLower.some(i => p.sector.toLowerCase().includes(i) || i.includes(p.sector.toLowerCase().split("/")[0].trim().toLowerCase()))
  );
}

export function getAffordabilityBridge(currentCity?: string): AffordabilityMarket[] {
  if (!currentCity) return AFFORDABILITY_MARKETS.filter(m => m.category === "small-win");
  const cityLower = currentCity.toLowerCase();
  const isHighCost = ["new york", "nyc", "san francisco", "sf", "los angeles", "la", "boston", "seattle"].some(c => cityLower.includes(c));
  if (isHighCost) {
    return AFFORDABILITY_MARKETS.filter(m => m.category === "small-win" || m.category === "emerging");
  }
  return AFFORDABILITY_MARKETS.filter(m => m.category === "small-win");
}

export function computeStabilityScore(
  occupationGrowthPct: number,
  sectorPmi: number,
  sectorGdpGrowth: number,
): number {
  // Normalize each factor to 0-100
  const growthScore = Math.min(100, Math.max(0, 50 + occupationGrowthPct * 1.5));
  const pmiScore = Math.min(100, Math.max(0, (sectorPmi - 30) * (100 / 40)));
  const gdpScore = Math.min(100, Math.max(0, 50 + sectorGdpGrowth * 10));

  // Weighted average
  return Math.round(growthScore * 0.4 + pmiScore * 0.35 + gdpScore * 0.25);
}

export function isEarlyCareer(yearsExperience: string): boolean {
  const years = parseInt(yearsExperience, 10);
  return !isNaN(years) && years <= 3;
}
