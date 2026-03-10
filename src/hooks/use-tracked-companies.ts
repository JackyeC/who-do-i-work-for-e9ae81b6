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

const TIER_SLOT_LIMITS: Record<string, number> = {
  free: 0,
  starter: 3,
  pro: 25,
  team: 100,
};

const ADD_ON_PRICE_PER_COMPANY = 12; // $12/company/month

export function getSlotLimit(tier: string): number {
  return TIER_SLOT_LIMITS[tier] ?? 0;
}

export function useTrackedCompanies() {
  const { user } = useAuth();
  const { tier, isPremium } = usePremium();

  const slotLimit = getSlotLimit(tier);

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
  const isAtCapacity = slotsUsed >= slotLimit;

  const queryClient = useQueryClient();

  const trackCompany = useMutation({
    mutationFn: async (companyId: string) => {
      if (!user) throw new Error("Must be logged in");
      if (!isPremium) throw new Error("Subscription required");
      if (isAtCapacity) throw new Error("No slots available. Untrack a company or upgrade your plan.");

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

      const { data, error } = await (supabase as any)
        .from("tracked_companies")
        .insert({ user_id: user.id, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
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
    refetch,
  };
}
