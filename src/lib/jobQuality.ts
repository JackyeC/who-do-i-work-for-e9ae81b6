import { differenceInDays } from "date-fns";

export type JobQualityTier = "fresh" | "recent" | "aging" | "stale" | "ghost";

export interface JobQualitySignal {
  tier: JobQualityTier;
  label: string;
  description: string;
  penalty: number; // 0 = no penalty, higher = worse
}

/**
 * Evaluate job quality based on age, salary transparency, and ATS evidence.
 * Uses neutral, non-judgmental labels per product guidelines.
 */
export function evaluateJobQuality(job: {
  created_at: string;
  posted_at?: string | null;
  salary_range?: string | null;
  source_platform?: string | null;
  description?: string | null;
}): JobQualitySignal {
  const postDate = job.posted_at || job.created_at;
  const days = differenceInDays(new Date(), new Date(postDate));

  if (days <= 3) {
    return { tier: "fresh", label: "Fresh listing", description: "Posted within the last 3 days", penalty: 0 };
  }
  if (days <= 14) {
    return { tier: "recent", label: "Recently posted", description: `Posted ${days} days ago`, penalty: 0 };
  }
  if (days <= 45) {
    return { tier: "aging", label: "Aging listing", description: `Posted ${days} days ago — confirm it's still active`, penalty: 1 };
  }
  if (days <= 90) {
    return { tier: "stale", label: "Limited hiring visibility", description: `Posted ${days} days ago — may be inactive`, penalty: 3 };
  }
  return { tier: "ghost", label: "Evergreen page detected", description: "This listing has been posted for over 90 days with no update", penalty: 5 };
}

/**
 * Detect if a job looks like a repost by checking for duplicates.
 * Returns true if there's another job with the same title + company posted within 90 days.
 */
export function detectRepost(
  job: { id: string; title: string; company_id: string; created_at: string },
  allJobs: { id: string; title: string; company_id: string; created_at: string }[]
): boolean {
  const normalizedTitle = job.title.toLowerCase().trim();
  return allJobs.some(
    (other) =>
      other.id !== job.id &&
      other.company_id === job.company_id &&
      other.title.toLowerCase().trim() === normalizedTitle &&
      Math.abs(differenceInDays(new Date(job.created_at), new Date(other.created_at))) <= 90
  );
}

/**
 * Check for evergreen marketing signals in job description.
 */
export function hasEvergreenSignals(description?: string | null): boolean {
  if (!description) return false;
  const d = description.toLowerCase();
  const signals = [
    "we're always looking",
    "general application",
    "talent community",
    "future opportunities",
    "talent pool",
    "pipeline role",
    "ongoing recruitment",
    "expressions of interest",
  ];
  return signals.some((s) => d.includes(s));
}

/**
 * Compute a composite ranking score for a job.
 * Higher score = better ranking position.
 */
export function computeRankingScore(job: {
  is_featured?: boolean;
  salary_range?: string | null;
  created_at: string;
  posted_at?: string | null;
  source_platform?: string | null;
  description?: string | null;
  companies?: { civic_footprint_score?: number } | null;
}, alignmentScore: number = 0): number {
  let score = 0;

  // Featured boost
  if (job.is_featured) score += 100;

  // Salary transparency boost
  if (job.salary_range) score += 25;

  // Clarity score contribution (0-100 mapped to 0-20)
  const clarity = (job.companies as any)?.civic_footprint_score || 0;
  score += (clarity / 100) * 20;

  // Alignment boost (0-5 categories, each worth 8 points)
  score += alignmentScore * 8;

  // Freshness boost
  const quality = evaluateJobQuality(job as any);
  score -= quality.penalty * 5;

  // Evergreen penalty
  if (hasEvergreenSignals(job.description)) {
    score -= 15;
  }

  return score;
}
