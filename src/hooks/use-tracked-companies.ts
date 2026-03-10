import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePremium, STRIPE_TIERS } from "@/hooks/use-premium";
import { toast } from "sonner";

export interface TrackedCompany {
  id: string;
  user_id: string;
  company_id: string;
  tracked_at: string;
  untracked_at: string | null;
  is_active: boolean;
  company?: {
    id: string;
    name: string;
    slug: string;
    industry: string;
    civic_footprint_score: number;
    logo_url: string | null;
    state: string;
  };
}

interface UserSubscription {
  user_id: string;
  plan_id: string | null;
  additional_slots: number;
  current_period_end: string | null;
  plan?: { name: string; max_slots: number; monthly_price_cents: number } | null;
}

export function useTrackedCompanies() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const queryClient = useQueryClient();

  // Fetch user subscription with plan details
  const { data: subscription } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_subscriptions")
        .select("*, plan:plans(*)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!user,
  });

  const slotLimit = (subscription?.plan?.max_slots ?? 0) + (subscription?.additional_slots ?? 0);
  const tier = subscription?.plan?.name?.toLowerCase() ?? "free";

  const { data: trackedCompanies = [], isLoading, refetch } = useQuery({
    queryKey: ["tracked-companies", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tracked_companies")
        .select(`
          *,
          company:companies(id, name, slug, industry, civic_footprint_score, logo_url, state)
        `)
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("tracked_at", { ascending: false });
      if (error) throw error;
      return (data || []) as TrackedCompany[];
    },
    enabled: !!user,
  });

  const slotsUsed = trackedCompanies.length;
  const slotsRemaining = Math.max(0, slotLimit - slotsUsed);
  const isAtCapacity = slotLimit > 0 && slotsUsed >= slotLimit;

  const trackCompany = useMutation({
    mutationFn: async (companyId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Upsert: if previously untracked, reactivate
      const { data: existing } = await (supabase as any)
        .from("tracked_companies")
        .select("id, is_active")
        .eq("user_id", user.id)
        .eq("company_id", companyId)
        .maybeSingle();

      if (existing) {
        if (existing.is_active) return existing;
        const { data, error } = await (supabase as any)
          .from("tracked_companies")
          .update({ is_active: true, untracked_at: null, tracked_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      // Insert — server-side trigger enforces slot limit
      const { data, error } = await (supabase as any)
        .from("tracked_companies")
        .insert({ user_id: user.id, company_id: companyId })
        .select()
        .single();
      if (error) {
        if (error.message?.includes("limit")) {
          throw new Error("You've reached your slot limit. Untrack a company to free up a slot.");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-companies"] });
      toast.success("Company tracked successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const untrackCompany = useMutation({
    mutationFn: async (companyId: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await (supabase as any)
        .from("tracked_companies")
        .update({ is_active: false, untracked_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("company_id", companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-companies"] });
      toast.success("Company untracked — slot freed");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isCompanyTracked = (companyId: string): boolean => {
    return trackedCompanies.some((tc) => tc.company_id === companyId);
  };

  return {
    trackedCompanies,
    isLoading,
    slotsUsed,
    slotLimit,
    slotsRemaining,
    isAtCapacity,
    trackCompany,
    untrackCompany,
    isCompanyTracked,
    tier,
    isPremium,
    subscription,
    refetch,
  };
}
