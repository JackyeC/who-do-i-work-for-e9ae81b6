import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReviewSignal {
  id?: string;
  source: string;
  signal_type: string;
  label: string;
  value: string | null;
  numeric_value: number | null;
  detail: string | null;
  source_url: string | null;
  badge_label: string;
  fetched_at?: string;
  confidence_score?: number;
  company_match_method?: string;
  raw_company_name?: string | null;
}

export interface ReviewDebugInfo {
  cacheHit: boolean;
  companyName?: string;
  normalizedName?: string;
  state?: string | null;
  indeedCount?: number;
  bbbCount?: number;
  glassdoorCount?: number;
  totalSignals?: number;
  confidences?: Array<{
    source: string;
    type: string;
    confidence: number;
    method: string;
    rawName: string | null;
  }>;
  fetchedAt?: string;
  cutoff?: string;
}

export interface ReviewData {
  signals: ReviewSignal[];
  reviewCarefully: boolean;
  lastFetched: string | null;
  loading: boolean;
  debug: ReviewDebugInfo | null;
}

const CACHE_HOURS = 24;

export function useCompanyReviews(companyId: string, companyName: string, state?: string) {
  const queryClient = useQueryClient();

  // Step 1: Check for cached data in DB
  const cacheQuery = useQuery({
    queryKey: ["community-signals-cache", companyId],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from("company_community_signals")
        .select("*")
        .eq("company_id", companyId)
        .in("source", ["Indeed", "Better Business Bureau", "Glassdoor"])
        .gte("fetched_at", cutoff);

      return (data || []) as ReviewSignal[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // Step 2: Trigger background fetch if cache is empty
  const fetchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-company-reviews", {
        body: { companyId, companyName, state: state || "" },
      });
      if (error) throw error;
      return data as { signals: ReviewSignal[]; reviewCarefully: boolean; debug: ReviewDebugInfo; cached: boolean };
    },
    onSuccess: () => {
      // Invalidate cache query to reload fresh data
      queryClient.invalidateQueries({ queryKey: ["community-signals-cache", companyId] });
      queryClient.invalidateQueries({ queryKey: ["community-signals", companyId] });
    },
  });

  // Auto-trigger fetch when cache is empty and we have a company name
  const hasCachedData = (cacheQuery.data?.length ?? 0) > 0;
  const shouldFetch = !hasCachedData && !cacheQuery.isLoading && !!companyName && !fetchMutation.isPending && !fetchMutation.isSuccess && !fetchMutation.isError;

  if (shouldFetch) {
    fetchMutation.mutate();
  }

  // Compute review flag from available data
  const signals = hasCachedData ? cacheQuery.data! : (fetchMutation.data?.signals || []);
  const mgmt = signals.find((s) => s.signal_type === "sub_score_management");
  const accredited = signals.find((s) => s.signal_type === "accreditation");
  const complaints = signals.find((s) => s.signal_type === "complaints");

  const reviewCarefully =
    fetchMutation.data?.reviewCarefully ??
    ((mgmt?.numeric_value != null && mgmt.numeric_value < 2.5) ||
      (accredited?.numeric_value === 0 && (complaints?.numeric_value ?? 0) >= 10));

  const lastFetched = signals
    .map((s) => s.fetched_at)
    .filter(Boolean)
    .sort()
    .pop() || null;

  return {
    data: {
      signals,
      reviewCarefully,
      lastFetched,
      loading: cacheQuery.isLoading || fetchMutation.isPending,
      debug: fetchMutation.data?.debug || null,
    } as ReviewData,
    isLoading: cacheQuery.isLoading || fetchMutation.isPending,
    isFetching: fetchMutation.isPending,
    hasCachedData,
  };
}
