import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EEOCDroppedCase {
  id: string;
  company_name: string;
  company_id: string | null;
  case_name: string;
  case_number: string | null;
  discrimination_type: string;
  discrimination_category: string;
  action_type: string;
  status: string;
  state: string | null;
  summary: string | null;
  source_url: string | null;
  confidence: string;
  created_at: string;
}

export function useEEOCDroppedCases(companyId?: string) {
  return useQuery({
    queryKey: ["eeoc-dropped-cases", companyId || "all"],
    queryFn: async () => {
      let query = (supabase as any)
        .from("eeoc_dropped_cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data } = await query;
      return (data || []) as EEOCDroppedCase[];
    },
  });
}

/** Search by company name (fuzzy match for companies not yet linked by ID) */
export function useEEOCByCompanyName(companyName?: string) {
  return useQuery({
    queryKey: ["eeoc-dropped-cases-name", companyName],
    queryFn: async () => {
      if (!companyName) return [];
      // Clean the name for matching
      const clean = companyName.replace(/,?\s*(LP|LLC|Inc\.?|Corp\.?|Co\.?|\(DB\))$/gi, "").trim();
      const { data } = await (supabase as any)
        .from("eeoc_dropped_cases")
        .select("*")
        .or(`company_name.ilike.%${clean}%`);
      return (data || []) as EEOCDroppedCase[];
    },
    enabled: !!companyName,
  });
}
