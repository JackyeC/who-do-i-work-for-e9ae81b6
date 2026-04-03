import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { mergeDreamJobProfile, type DreamJobProfileV1 } from "./dream-job-profile";
import type { ParsedResume } from "@/lib/resume-parser";
import type { PersonaId } from "@/hooks/use-persona";
import { getPersonaState, PERSONA_NAMES } from "@/hooks/use-persona";
import type { JobPreferences } from "@/hooks/use-job-preferences";
import { topValuesLensLabelsFromUvp } from "@/lib/valueLensFromUvp";

type Db = SupabaseClient<Database>;

function mapRemotePref(
  p: JobPreferences["remote_preference"] | undefined
): DreamJobProfileV1["facets"]["remotePreference"] {
  if (!p) return "any";
  if (p === "remote_only") return "remote";
  if (p === "hybrid_ok") return "hybrid";
  if (p === "onsite_ok") return "onsite";
  return "any";
}

/** Build a patch from structured inputs (quiz, prefs, profile row, resume parse). */
export function buildDreamJobProfilePatch(input: {
  existing: Json | null;
  persona?: PersonaId | null;
  personaLabel?: string | null;
  jobPrefs?: Partial<JobPreferences> | null;
  matchPrefs?: { signal_key: string; signal_label: string }[] | null;
  profileRow?: {
    target_job_titles?: string[] | null;
    skills?: string[] | null;
    user_values?: string[] | null;
    resume_keywords?: string[] | null;
    min_salary?: number | null;
    persona_type?: string | null;
  } | null;
  resumeParsed?: ParsedResume | null;
  gameFingerprint?: string | null;
  /** From user_values_profile — top weighted lenses */
  valuesLensLabels?: string[] | null;
  workplaceFromUvp?: { companySize?: string | null; stage?: string | null } | null;
}): DreamJobProfileV1 {
  const base = (input.existing && typeof input.existing === "object"
    ? input.existing
    : {}) as Record<string, unknown>;

  const valuesTags = [
    ...(input.profileRow?.user_values || []),
    ...(input.matchPrefs || []).map((m) => m.signal_label),
    ...(input.valuesLensLabels || []),
  ];
  if (input.workplaceFromUvp?.companySize && input.workplaceFromUvp.companySize !== "no_preference") {
    valuesTags.push(`Company size: ${input.workplaceFromUvp.companySize}`);
  }
  if (input.workplaceFromUvp?.stage && input.workplaceFromUvp.stage !== "no_preference") {
    valuesTags.push(`Org stage: ${input.workplaceFromUvp.stage}`);
  }
  const uniqueValues = [...new Set(valuesTags.map((v) => v.trim()).filter(Boolean))];

  const targetTitles = [
    ...(input.profileRow?.target_job_titles || []),
    ...(input.resumeParsed?.inferredTitles || []),
  ];
  const uniqueTitles = [...new Set(targetTitles.map((t) => t.trim()).filter(Boolean))];

  const skills = [
    ...(input.profileRow?.skills || []),
    ...(input.profileRow?.resume_keywords || []),
    ...(input.resumeParsed?.inferredSkills || []),
  ];
  const uniqueSkills = [...new Set(skills.map((s) => String(s).trim()).filter(Boolean))];

  const industries = [...(input.jobPrefs?.industry_preferences || [])].filter(Boolean);

  const adjacentRoles = (input.jobPrefs?.preferred_functions || [])
    .filter(Boolean)
    .map((title) => ({ title, rationale: "From your stated function preferences." }));

  const patch: Partial<DreamJobProfileV1> = {
    targetTitles: uniqueTitles.slice(0, 24),
    adjacentRoles: adjacentRoles.slice(0, 12),
    facets: {
      skills: uniqueSkills.slice(0, 64),
      industries: industries.slice(0, 24),
      valuesTags: uniqueValues.slice(0, 48),
      minSalary: input.jobPrefs?.minimum_compensation ?? input.profileRow?.min_salary ?? null,
      locations: input.jobPrefs?.preferred_locations?.length
        ? input.jobPrefs.preferred_locations
        : undefined,
      remotePreference: mapRemotePref(input.jobPrefs?.remote_preference),
    },
    sources: {
      quiz: input.persona
        ? `Workplace DNA / persona: ${input.personaLabel ?? PERSONA_NAMES[input.persona] ?? String(input.persona)}`
        : undefined,
      job_preferences: input.jobPrefs ? "Saved job preferences" : undefined,
      values_search: input.matchPrefs?.length ? "Signal requirements (aligned jobs)" : undefined,
      resume: input.resumeParsed ? "Resume text parse" : undefined,
      game: input.gameFingerprint || undefined,
      manual:
        input.valuesLensLabels?.length || input.workplaceFromUvp
          ? "Values slider profile (dashboard)"
          : undefined,
    },
  };

  return mergeDreamJobProfile(base, patch);
}

/** Full server + local merge; increments dream_job_profile_version. */
export async function syncDreamJobProfileRemote(supabase: Db, userId: string): Promise<DreamJobProfileV1> {
  const [{ data: profileRow, error: pErr }, { data: jobPrefs }, { data: matchPrefs }, { data: uvp }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "dream_job_profile, dream_job_profile_version, target_job_titles, skills, user_values, resume_keywords, min_salary, persona_type"
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("job_preferences").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("job_match_preferences").select("signal_key, signal_label").eq("user_id", userId),
      supabase.from("user_values_profile").select("*").eq("user_id", userId).maybeSingle(),
    ]);

  if (pErr) throw pErr;

  const personaState = getPersonaState();
  const lensLabels = topValuesLensLabelsFromUvp(uvp as Record<string, unknown> | null);
  const merged = buildDreamJobProfilePatch({
    existing: profileRow?.dream_job_profile ?? null,
    persona: personaState.persona,
    jobPrefs: (jobPrefs || null) as JobPreferences | null,
    matchPrefs: matchPrefs || [],
    valuesLensLabels: lensLabels,
    workplaceFromUvp: uvp
      ? {
          companySize: (uvp as { company_size_preference?: string | null }).company_size_preference ?? null,
          stage: (uvp as { startup_vs_enterprise_preference?: string | null }).startup_vs_enterprise_preference ?? null,
        }
      : null,
    profileRow: profileRow
      ? {
          target_job_titles: profileRow.target_job_titles,
          skills: profileRow.skills,
          user_values: profileRow.user_values,
          resume_keywords: profileRow.resume_keywords,
          min_salary: profileRow.min_salary,
          persona_type: profileRow.persona_type,
        }
      : null,
  });

  const nextVersion = (profileRow?.dream_job_profile_version ?? 0) + 1;

  const { error: upErr } = await supabase
    .from("profiles")
    .update({
      dream_job_profile: merged as unknown as Json,
      dream_job_profile_version: nextVersion,
      persona_type: personaState.persona ?? profileRow?.persona_type ?? null,
    })
    .eq("id", userId);

  if (upErr) throw upErr;
  return merged;
}

/** Merge heuristic resume parse into the stored profile (call after plain-text parse). */
export async function applyResumeParsedToDreamJobProfile(
  supabase: Db,
  userId: string,
  parsed: ParsedResume
): Promise<DreamJobProfileV1> {
  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "dream_job_profile, dream_job_profile_version, target_job_titles, skills, user_values, resume_keywords, min_salary, persona_type"
    )
    .eq("id", userId)
    .maybeSingle();

  const merged = buildDreamJobProfilePatch({
    existing: profileRow?.dream_job_profile ?? null,
    resumeParsed: parsed,
    profileRow: profileRow
      ? {
          target_job_titles: profileRow.target_job_titles,
          skills: profileRow.skills,
          user_values: profileRow.user_values,
          resume_keywords: profileRow.resume_keywords,
          min_salary: profileRow.min_salary,
          persona_type: profileRow.persona_type,
        }
      : null,
  });

  const nextVersion = (profileRow?.dream_job_profile_version ?? 0) + 1;

  const { error } = await supabase
    .from("profiles")
    .update({
      dream_job_profile: merged as unknown as Json,
      dream_job_profile_version: nextVersion,
      resume_keywords: merged.facets.skills.slice(0, 64),
    })
    .eq("id", userId);

  if (error) throw error;
  return merged;
}
