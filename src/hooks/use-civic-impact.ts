import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface CivicImpactCounts {
  /** Rows in user_alerts — surfaced employer/signal changes */
  signalsUncovered: number;
  /** Active tracked employers */
  employersTracked: number;
  /** Usage events (scans, gated actions, etc.) */
  intelligenceActions: number;
}

export function useCivicImpact() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["civic-impact", user?.id],
    queryFn: async (): Promise<CivicImpactCounts> => {
      const uid = user!.id;
      const [alerts, tracked, usage] = await Promise.all([
        (supabase as any)
          .from("user_alerts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
        (supabase as any)
          .from("tracked_companies")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid)
          .eq("is_active", true),
        (supabase as any)
          .from("user_usage")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
      ]);

      return {
        signalsUncovered: alerts.count ?? 0,
        employersTracked: tracked.count ?? 0,
        intelligenceActions: usage.count ?? 0,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
