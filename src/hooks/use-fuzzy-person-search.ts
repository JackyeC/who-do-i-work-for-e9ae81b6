import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuzzyPersonResult {
  id: string;
  company_id: string;
  name: string;
  title: string;
  total_donations: number;
  match_type: "nickname_match" | "fuzzy_match";
  match_score: number;
}

/**
 * Hook for fuzzy person search across executives.
 * Uses server-side nickname resolution + Levenshtein distance.
 */
export function useFuzzyPersonSearch(searchTerm: string, limit = 20) {
  return useQuery({
    queryKey: ["fuzzy-person-search", searchTerm, limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fuzzy_person_search", {
        _search_term: searchTerm,
        _limit: limit,
      });
      if (error) throw error;
      return (data || []) as FuzzyPersonResult[];
    },
    enabled: searchTerm.trim().length >= 2,
  });
}

/**
 * Resolves a name to all its nickname variants.
 * Useful for client-side filtering or display.
 */
export function useNameVariants(name: string) {
  return useQuery({
    queryKey: ["name-variants", name],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resolve_name_variants", {
        _name: name,
      });
      if (error) throw error;
      return (data || []) as string[];
    },
    enabled: name.trim().length >= 2,
  });
}

/**
 * Client-side nickname map for instant UI feedback (subset of DB mappings).
 * For comprehensive matching, always use the DB function.
 */
const COMMON_NICKNAMES: Record<string, string[]> = {
  michael: ["mike", "mikey", "mick"],
  andrew: ["andy", "drew"],
  robert: ["bob", "rob", "bobby", "robbie"],
  william: ["bill", "will", "billy", "liam"],
  james: ["jim", "jimmy", "jamie"],
  joseph: ["joe", "joey"],
  thomas: ["tom", "tommy"],
  richard: ["dick", "rick", "rich", "ricky"],
  david: ["dave", "davy"],
  daniel: ["dan", "danny"],
  steven: ["steve", "stevie"],
  christopher: ["chris", "topher"],
  matthew: ["matt"],
  patrick: ["pat", "paddy"],
  anthony: ["tony"],
  edward: ["ed", "eddie", "ned"],
  charles: ["charlie", "chuck"],
  elizabeth: ["liz", "beth", "betty", "liza"],
  katherine: ["kate", "kathy", "katie", "cathy"],
  jennifer: ["jenny", "jen"],
  margaret: ["meg", "maggie", "peggy", "marge"],
  john: ["jack", "johnny", "jon"],
};

/**
 * Expand a first name to all known variants (client-side, instant).
 */
export function expandNameVariants(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const variants = new Set<string>([lower]);

  // Check if input is a canonical name
  if (COMMON_NICKNAMES[lower]) {
    COMMON_NICKNAMES[lower].forEach((n) => variants.add(n));
  }

  // Check if input is a nickname
  for (const [canonical, nicks] of Object.entries(COMMON_NICKNAMES)) {
    if (nicks.includes(lower)) {
      variants.add(canonical);
      nicks.forEach((n) => variants.add(n));
    }
  }

  return Array.from(variants);
}