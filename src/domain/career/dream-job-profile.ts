/**
 * Dream Job Profile — domain model (stored in profiles.dream_job_profile JSONB).
 * Populated from: values preferences, quiz/persona, games, resume parser output, job preferences.
 */
export type DreamJobProfileSource =
  | "manual"
  | "quiz"
  | "game"
  | "resume"
  | "job_preferences"
  | "values_search"
  | "system";

export interface DreamJobAdjacentRole {
  title: string;
  rationale?: string;
  confidence?: number;
}

export interface DreamJobProfileV1 {
  version: 1;
  updatedAt: string;
  /** Primary titles the user is pursuing */
  targetTitles: string[];
  /** Roles the matcher should surface as “adjacent” */
  adjacentRoles: DreamJobAdjacentRole[];
  /** Normalized facets for matching (skills, industries, constraints) */
  facets: {
    skills: string[];
    industries: string[];
    valuesTags: string[];
    minSalary?: number | null;
    locations?: string[];
    remotePreference?: "remote" | "hybrid" | "onsite" | "any";
  };
  /** Provenance for transparency (“facts over feelings”) */
  sources: Partial<Record<DreamJobProfileSource, string | undefined>>;
}

export type DreamJobProfile = DreamJobProfileV1;

function mergeStringArraysPreferExisting(
  existing: string[] | undefined,
  incoming: string[] | undefined,
  max: number
): string[] {
  const a = existing || [];
  const b = incoming || [];
  if (a.length >= 3 && b.length === 0) return a.slice(0, max);
  const set = new Set<string>();
  for (const s of [...a, ...b]) {
    const t = String(s).trim();
    if (t) set.add(t);
  }
  return [...set].slice(0, max);
}

function pickHigherSalary(
  a: number | null | undefined,
  b: number | null | undefined
): number | null | undefined {
  const nums = [a, b].filter((x): x is number => typeof x === "number" && !Number.isNaN(x));
  if (nums.length === 0) return (a ?? b ?? null) as number | null | undefined;
  return Math.max(...nums);
}

function mergeAdjacent(
  existing: DreamJobAdjacentRole[] | undefined,
  incoming: DreamJobAdjacentRole[] | undefined,
  max: number
): DreamJobAdjacentRole[] {
  const a = existing || [];
  const b = incoming || [];
  if (a.length >= 2 && b.length === 0) return a.slice(0, max);
  const byTitle = new Map<string, DreamJobAdjacentRole>();
  for (const x of [...a, ...b]) {
    if (!x?.title?.trim()) continue;
    const k = x.title.trim().toLowerCase();
    if (!byTitle.has(k)) byTitle.set(k, x);
  }
  return [...byTitle.values()].slice(0, max);
}

export function emptyDreamJobProfile(): DreamJobProfileV1 {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    targetTitles: [],
    adjacentRoles: [],
    facets: { skills: [], industries: [], valuesTags: [] },
    sources: {},
  };
}

/** Merge server/client fragments without dropping unknown keys (forward-compatible). */
export function mergeDreamJobProfile(
  base: Record<string, unknown> | null | undefined,
  patch: Partial<DreamJobProfileV1>
): DreamJobProfileV1 {
  const b = (base && typeof base === "object" ? base : {}) as Partial<DreamJobProfileV1>;
  const merged: DreamJobProfileV1 = {
    version: 1,
    updatedAt: new Date().toISOString(),
    targetTitles: mergeStringArraysPreferExisting(b.targetTitles, patch.targetTitles, 24),
    adjacentRoles: mergeAdjacent(b.adjacentRoles, patch.adjacentRoles, 12),
    facets: {
      skills: mergeStringArraysPreferExisting(b.facets?.skills, patch.facets?.skills, 64),
      industries: mergeStringArraysPreferExisting(b.facets?.industries, patch.facets?.industries, 24),
      valuesTags: mergeStringArraysPreferExisting(b.facets?.valuesTags, patch.facets?.valuesTags, 48),
      minSalary: pickHigherSalary(b.facets?.minSalary ?? null, patch.facets?.minSalary ?? null),
      locations: mergeStringArraysPreferExisting(b.facets?.locations, patch.facets?.locations, 16),
      remotePreference: patch.facets?.remotePreference ?? b.facets?.remotePreference,
    },
    sources: { ...b.sources, ...patch.sources },
  };
  return merged;
}
