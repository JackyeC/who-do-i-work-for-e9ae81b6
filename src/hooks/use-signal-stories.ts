import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SignalStory } from "@/lib/work-signal-schema";

export function useSignalStories(limit = 20) {
  return useQuery({
    queryKey: ["signal-stories", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("signal_stories")
        .select("*")
        .eq("status", "live")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as SignalStory[];
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useDailyWrap() {
  return useQuery({
    queryKey: ["daily-wrap-latest"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daily_wraps")
        .select("*")
        .eq("status", "live")
        .order("wrap_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as import("@/lib/work-signal-schema").DailyWrap | null;
    },
    staleTime: 300_000,
  });
}
