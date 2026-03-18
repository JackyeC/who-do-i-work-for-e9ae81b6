import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface JobPreferences {
  id?: string;
  preferred_locations: string[];
  remote_preference: "remote_only" | "hybrid_ok" | "onsite_ok";
  commute_tolerance: "short" | "moderate" | "long" | "any";
  willing_to_relocate: boolean;
  target_compensation: number | null;
  minimum_compensation: number | null;
  preferred_functions: string[];
  seniority_level: string | null;
  employment_type: string | null;
  industry_preferences: string[];
  company_stage_preference: string | null;
  sponsorship_required: boolean;
  timezone_preference: string | null;
  travel_tolerance: "none" | "minimal" | "moderate" | "heavy";
  search_urgency: "urgent" | "active" | "exploring" | "passive";
  dealbreakers: string[];
  stretch_preference: boolean;
}

const DEFAULTS: JobPreferences = {
  preferred_locations: [],
  remote_preference: "hybrid_ok",
  commute_tolerance: "moderate",
  willing_to_relocate: false,
  target_compensation: null,
  minimum_compensation: null,
  preferred_functions: [],
  seniority_level: null,
  employment_type: null,
  industry_preferences: [],
  company_stage_preference: null,
  sponsorship_required: false,
  timezone_preference: null,
  travel_tolerance: "minimal",
  search_urgency: "exploring",
  dealbreakers: [],
  stretch_preference: false,
};

export function useJobPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["job-preferences", user?.id],
    queryFn: async () => {
      if (!user) return DEFAULTS;
      const { data } = await (supabase as any)
        .from("job_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data ? { ...DEFAULTS, ...data } as JobPreferences : DEFAULTS;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (prefs: Partial<JobPreferences>) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...prefs, user_id: user.id, updated_at: new Date().toISOString() };
      const { error } = await (supabase as any)
        .from("job_preferences")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["job-preferences"] });
      toast({ title: "Preferences saved" });
    },
    onError: () => {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    },
  });

  return {
    preferences: preferences ?? DEFAULTS,
    isLoading,
    savePreferences: mutation.mutate,
    isSaving: mutation.isPending,
  };
}
