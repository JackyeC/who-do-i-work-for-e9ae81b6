import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCredits() {
  const { user } = useAuth();

  const { data: credits, refetch } = useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_credits")
        .select("credits_remaining, credits_purchased")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { credits_remaining: number; credits_purchased: number } | null;
    },
    enabled: !!user,
  });

  return {
    creditsRemaining: credits?.credits_remaining ?? 0,
    totalPurchased: credits?.credits_purchased ?? 0,
    hasCredits: (credits?.credits_remaining ?? 0) > 0,
    refetchCredits: refetch,
  };
}
