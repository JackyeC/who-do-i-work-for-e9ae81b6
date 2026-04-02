import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReviewSignal {
  id: string;
  source: string;
  signal_type: string;
  label: string;
  value: string | null;
  numeric_value: number | null;
  detail: string | null;
  source_url: string | null;
  badge_label: string;
  fetched_at: string;
}

interface ReviewData {
  signals: ReviewSignal[];
  reviewCarefully: boolean;
  lastFetched: string | null;
}

const CACHE_HOURS = 24;

export function useCompanyReviews(companyId: string, companyName: string, state?: string) {
  return useQuery<ReviewData>({
    queryKey: ["company-reviews", companyId],
    queryFn: async (): Promise<ReviewData> => {
      if (!companyId || !companyName) {
        return { signals: [], reviewCarefully: false, lastFetched: null };
      }

      // Check if we have fresh cached data
      const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
      const { data: cached } = await (supabase as any)
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .in("source", ["Indeed", "Better Business Bureau"])
        .gte("fetched_at", cutoff);

      if (cached && cached.length > 0) {
        const mgmt = cached.find(
          (s: any) => s.signal_type === "sub_score_management"
        );
        const accredited = cached.find(
          (s: any) => s.signal_type === "accreditation"
        );
        const complaints = cached.find(
          (s: any) => s.signal_type === "complaints"
        );

        const reviewCarefully =
          (mgmt?.numeric_value != null && mgmt.numeric_value < 2.5) ||
          (accredited?.numeric_value === 0 && (complaints?.numeric_value ?? 0) >= 10);

        return {
          signals: cached as ReviewSignal[],
          reviewCarefully,
          lastFetched: cached[0]?.fetched_at || null,
        };
      }

      // Call edge function for fresh data
      try {
        const { data, error } = await supabase.functions.invoke(
          "fetch-company-reviews",
          {
            body: { companyId, companyName, state: state || "" },
          }
        );

        if (error) {
          console.error("fetch-company-reviews error:", error);
          return { signals: [], reviewCarefully: false, lastFetched: null };
        }

        return {
          signals: data?.signals || [],
          reviewCarefully: data?.reviewCarefully || false,
          lastFetched: data?.fetchedAt || null,
        };
      } catch {
        return { signals: [], reviewCarefully: false, lastFetched: null };
      }
    },
    enabled: !!companyId && !!companyName,
    staleTime: CACHE_HOURS * 60 * 60 * 1000,
    retry: false,
  });
}
