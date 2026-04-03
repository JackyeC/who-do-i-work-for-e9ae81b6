import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ENABLE_PERSON_ENTITIES } from "@/lib/feature-flags";
import type { Person, PersonSource } from "@/types/person-entity";

interface UseEntityLinkingOptions {
  name: string;
  companyContext?: string;
}

interface EntityLinkResult {
  person: Person | null;
  sources: PersonSource[];
  isLoading: boolean;
  matched: boolean;
}

/**
 * Safe entity linking hook.
 * Strategy:
 *  1. Exact full_name match first
 *  2. Normalized fallback (lowercase trim) only if unambiguous (single result)
 *  3. If multiple matches or uncertainty → no match
 *  4. If feature flag is off → skip entirely
 */
export function useEntityLinking({ name, companyContext }: UseEntityLinkingOptions): EntityLinkResult {
  const trimmedName = name.trim();

  const { data: person, isLoading: personLoading } = useQuery({
    queryKey: ["entity-link-person", trimmedName, companyContext],
    enabled: ENABLE_PERSON_ENTITIES && trimmedName.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Person | null> => {
      // Step 1: exact match
      const { data: exact, error: exactErr } = await supabase
        .from("people")
        .select("*")
        .eq("full_name", trimmedName);

      if (exactErr) {
        console.error("[useEntityLinking] exact query error:", exactErr);
        return null;
      }

      // If company context provided, prefer that match
      if (exact && exact.length === 1) {
        return exact[0] as unknown as Person;
      }
      if (exact && exact.length > 1 && companyContext) {
        const companyMatch = exact.find(
          (p) => p.current_company?.toLowerCase() === companyContext.toLowerCase()
        );
        if (companyMatch) return companyMatch as unknown as Person;
        // Multiple matches, no company disambiguation → no match
        return null;
      }
      if (exact && exact.length > 1) {
        // Ambiguous — return no match
        return null;
      }

      // Step 2: normalized fallback (case-insensitive)
      const normalized = trimmedName.toLowerCase();
      const { data: fuzzy, error: fuzzyErr } = await supabase
        .from("people")
        .select("*")
        .ilike("full_name", normalized);

      if (fuzzyErr) {
        console.error("[useEntityLinking] normalized query error:", fuzzyErr);
        return null;
      }

      if (fuzzy && fuzzy.length === 1) {
        return fuzzy[0] as unknown as Person;
      }

      // Multiple or zero → no match
      return null;
    },
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["entity-link-sources", person?.id],
    enabled: ENABLE_PERSON_ENTITIES && !!person?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PersonSource[]> => {
      const { data, error } = await supabase
        .from("person_sources")
        .select("*")
        .eq("person_id", person!.id)
        .order("collected_at", { ascending: false });

      if (error) {
        console.error("[useEntityLinking] sources query error:", error);
        return [];
      }
      return (data ?? []) as unknown as PersonSource[];
    },
  });

  return {
    person: person ?? null,
    sources,
    isLoading: personLoading || sourcesLoading,
    matched: !!person,
  };
}
