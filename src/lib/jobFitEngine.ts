import type { JobPreferences } from "@/hooks/use-job-preferences";

export type FitBadge =
  | "Strong Fit"
  | "Location Mismatch"
  | "Compensation Mismatch"
  | "Flexible Work Fit"
  | "Relocation Required";

export interface FitResult {
  fitScore: number; // 0-100
  fitBadges: FitBadge[];
  mismatches: string[];
  strengths: string[];
}

function parseSalaryMin(salaryRange: string | null | undefined): number {
  if (!salaryRange) return 0;
  const match = salaryRange.match(/\$?([\d,]+)/);
  if (!match) return 0;
  const val = parseFloat(match[1].replace(/,/g, ""));
  return salaryRange.toLowerCase().includes("k") ? val * 1000 : val;
}

export function evaluateJobFit(
  job: {
    work_mode?: string | null;
    location?: string | null;
    salary_range?: string | null;
    seniority_level?: string | null;
    department?: string | null;
    employment_type?: string | null;
  },
  prefs: JobPreferences
): FitResult {
  const badges: FitBadge[] = [];
  const mismatches: string[] = [];
  const strengths: string[] = [];
  let score = 60; // neutral baseline

  // Remote / work mode
  const workMode = job.work_mode?.toLowerCase() || "";
  if (prefs.remote_preference === "remote_only") {
    if (workMode === "remote") {
      badges.push("Flexible Work Fit");
      strengths.push("Remote-friendly — matches your preference");
      score += 15;
    } else if (workMode === "on-site" || workMode === "onsite") {
      badges.push("Location Mismatch");
      mismatches.push("This role is on-site, but you prefer remote work");
      score -= 30;
    } else if (workMode === "hybrid") {
      mismatches.push("Hybrid role — you prefer fully remote");
      score -= 10;
    }
  } else if (prefs.remote_preference === "onsite_ok" && workMode === "remote") {
    strengths.push("Remote role available");
    score += 5;
  }

  // Location
  if (prefs.preferred_locations.length > 0 && job.location) {
    const loc = job.location.toLowerCase();
    const match = prefs.preferred_locations.some((l) => loc.includes(l.toLowerCase()));
    if (match) {
      strengths.push("Location matches your preferences");
      score += 10;
    } else if (workMode !== "remote") {
      if (!prefs.willing_to_relocate) {
        badges.push("Relocation Required");
        mismatches.push("Location doesn't match and you're not open to relocating");
        score -= 20;
      } else {
        mismatches.push("Would require relocation");
        score -= 5;
      }
    }
  }

  // Compensation
  const jobSalary = parseSalaryMin(job.salary_range);
  if (prefs.minimum_compensation && jobSalary > 0) {
    if (jobSalary < prefs.minimum_compensation) {
      badges.push("Compensation Mismatch");
      mismatches.push(`Listed pay starts below your $${(prefs.minimum_compensation / 1000).toFixed(0)}k minimum`);
      score -= 20;
    } else if (prefs.target_compensation && jobSalary >= prefs.target_compensation) {
      strengths.push("Compensation meets or exceeds your target");
      score += 15;
    } else {
      strengths.push("Compensation is within your acceptable range");
      score += 5;
    }
  }

  // Seniority
  if (prefs.seniority_level && job.seniority_level) {
    if (job.seniority_level.toLowerCase() === prefs.seniority_level.toLowerCase()) {
      strengths.push("Seniority level matches");
      score += 5;
    }
  }

  // Employment type
  if (prefs.employment_type && prefs.employment_type !== "any" && job.employment_type) {
    if (job.employment_type.toLowerCase().includes(prefs.employment_type.toLowerCase())) {
      strengths.push("Employment type matches");
      score += 5;
    }
  }

  // Strong Fit badge
  if (score >= 75 && mismatches.length === 0) {
    badges.unshift("Strong Fit");
  }

  return {
    fitScore: Math.max(0, Math.min(100, score)),
    fitBadges: badges,
    mismatches,
    strengths,
  };
}
