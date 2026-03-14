/**
 * Recruiter Reality Score™ (RRS) — 0–100
 *
 * Measures how closely a company's recruiting experience
 * matches what it promises. Not employer branding — actual candidate experience.
 *
 * Categories:
 *   Response Transparency  — 25%
 *   Interview Efficiency    — 20%
 *   Salary Transparency     — 25%
 *   Candidate Experience    — 20%
 *   Process Integrity       — 10%
 */

export interface RRSInput {
  // Response Transparency
  hasApplicationAcknowledgment: boolean;
  hasTimelineDisclosure: boolean;
  hasRejectionNotification: boolean;
  candidateGhostingSignals: number; // 0 = none, higher = worse

  // Interview Efficiency
  interviewRoundCount: number; // avg rounds
  hasStructuredInterviewProcess: boolean;
  hasInterviewFeedback: boolean;

  // Salary Transparency
  hasSalaryInPostings: boolean;
  hasCompensationBands: boolean;
  hasBenefitsInPostings: boolean;
  salaryDisclosureRate: number; // 0-1

  // Candidate Experience
  hasGlassdoorInterviewReviews: boolean;
  glassdoorInterviewRating: number; // 0-5
  hasCandidateExperienceSurvey: boolean;

  // Process Integrity
  hasEEODisclosure: boolean;
  hasAIDisclosure: boolean;
  hasAccommodationsPolicy: boolean;
}

export interface RRSCategoryScore {
  name: string;
  key: string;
  score: number;
  level: "High" | "Medium" | "Low";
  signals: string[];
}

export interface RRSResult {
  score: number;
  label: string;
  band: "transparent" | "decent" | "mixed" | "opaque" | "ghosting_risk";
  categories: RRSCategoryScore[];
  confidence: "High" | "Medium" | "Low";
  interpretation: string;
}

function getBand(score: number): RRSResult["band"] {
  if (score >= 80) return "transparent";
  if (score >= 65) return "decent";
  if (score >= 45) return "mixed";
  if (score >= 25) return "opaque";
  return "ghosting_risk";
}

function getLabel(band: RRSResult["band"]): string {
  const map: Record<RRSResult["band"], string> = {
    transparent: "Transparent Recruiter",
    decent: "Decent Process",
    mixed: "Mixed Signals",
    opaque: "Opaque Process",
    ghosting_risk: "Ghosting Risk",
  };
  return map[band];
}

function getLevel(score: number): "High" | "Medium" | "Low" {
  if (score >= 65) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}

function scoreResponseTransparency(input: RRSInput): RRSCategoryScore {
  let score = 30;
  const signals: string[] = [];

  if (input.hasApplicationAcknowledgment) { score += 20; signals.push("Application acknowledgment detected"); }
  if (input.hasTimelineDisclosure) { score += 20; signals.push("Timeline disclosure found"); }
  if (input.hasRejectionNotification) { score += 15; signals.push("Rejection notifications sent"); }
  if (input.candidateGhostingSignals > 0) {
    score -= Math.min(30, input.candidateGhostingSignals * 10);
    signals.push(`${input.candidateGhostingSignals} ghosting signal(s) detected`);
  }
  if (signals.length === 0) signals.push("No response transparency data found");

  return { name: "Response Transparency", key: "response_transparency", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreInterviewEfficiency(input: RRSInput): RRSCategoryScore {
  let score = 40;
  const signals: string[] = [];

  if (input.interviewRoundCount > 0) {
    if (input.interviewRoundCount <= 3) { score += 20; signals.push(`${input.interviewRoundCount} interview rounds (efficient)`); }
    else if (input.interviewRoundCount <= 5) { score += 5; signals.push(`${input.interviewRoundCount} interview rounds (moderate)`); }
    else { score -= 15; signals.push(`${input.interviewRoundCount} interview rounds (excessive)`); }
  }
  if (input.hasStructuredInterviewProcess) { score += 20; signals.push("Structured interview process"); }
  if (input.hasInterviewFeedback) { score += 15; signals.push("Interview feedback provided"); }
  if (signals.length === 0) signals.push("No interview process data found");

  return { name: "Interview Efficiency", key: "interview_efficiency", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreSalaryTransparency(input: RRSInput): RRSCategoryScore {
  let score = 15;
  const signals: string[] = [];

  if (input.hasSalaryInPostings) { score += 30; signals.push("Salary ranges in job postings"); }
  if (input.hasCompensationBands) { score += 20; signals.push("Compensation bands published"); }
  if (input.hasBenefitsInPostings) { score += 15; signals.push("Benefits disclosed in postings"); }
  if (input.salaryDisclosureRate > 0) {
    score += Math.round(input.salaryDisclosureRate * 20);
    signals.push(`${Math.round(input.salaryDisclosureRate * 100)}% salary disclosure rate`);
  }
  if (signals.length === 0) signals.push("No salary transparency data found");

  return { name: "Salary Transparency", key: "salary_transparency", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreCandidateExperience(input: RRSInput): RRSCategoryScore {
  let score = 30;
  const signals: string[] = [];

  if (input.hasGlassdoorInterviewReviews) {
    const ratingBonus = Math.round((input.glassdoorInterviewRating / 5) * 40);
    score += ratingBonus;
    signals.push(`Interview rating: ${input.glassdoorInterviewRating.toFixed(1)}/5`);
  }
  if (input.hasCandidateExperienceSurvey) { score += 20; signals.push("Candidate experience survey used"); }
  if (signals.length === 0) signals.push("No candidate experience data found");

  return { name: "Candidate Experience", key: "candidate_experience", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

function scoreProcessIntegrity(input: RRSInput): RRSCategoryScore {
  let score = 30;
  const signals: string[] = [];

  if (input.hasEEODisclosure) { score += 25; signals.push("EEO disclosure present"); }
  if (input.hasAIDisclosure) { score += 25; signals.push("AI tool disclosure present"); }
  if (input.hasAccommodationsPolicy) { score += 20; signals.push("Accommodations policy published"); }
  if (signals.length === 0) signals.push("No process integrity data found");

  return { name: "Process Integrity", key: "process_integrity", score: Math.max(0, Math.min(100, score)), level: getLevel(Math.max(0, Math.min(100, score))), signals };
}

export function calculateRRS(input: RRSInput): RRSResult {
  const categories = [
    scoreResponseTransparency(input),
    scoreInterviewEfficiency(input),
    scoreSalaryTransparency(input),
    scoreCandidateExperience(input),
    scoreProcessIntegrity(input),
  ];

  const weights = [0.25, 0.20, 0.25, 0.20, 0.10];
  const weightedScore = Math.round(categories.reduce((sum, c, i) => sum + c.score * weights[i], 0));
  const score = Math.max(0, Math.min(100, weightedScore));
  const band = getBand(score);

  const foundSignals = categories.reduce((sum, c) => sum + c.signals.filter(s => !s.includes("No ")).length, 0);
  const confidence: RRSResult["confidence"] = foundSignals >= 6 ? "High" : foundSignals >= 3 ? "Medium" : "Low";

  const interpretations: Record<RRSResult["band"], string> = {
    transparent: "This company demonstrates strong recruiting transparency. Candidates can expect clear communication and fair processes.",
    decent: "Recruiting processes show reasonable transparency with some room for improvement in candidate communication.",
    mixed: "Mixed signals in the recruiting process. Some transparency gaps may affect candidate experience.",
    opaque: "Limited transparency in recruiting. Candidates should expect potential delays and communication gaps.",
    ghosting_risk: "Significant lack of recruiting transparency. High risk of candidate ghosting and poor communication.",
  };

  return { score, label: getLabel(band), band, categories, confidence, interpretation: interpretations[band] };
}
