import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MatchedJob {
  job_id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  url: string | null;
  salary_range: string | null;
  scraped_at: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  civic_footprint_score: number;
  industry: string;
  state: string;
  alignment_score: number;
  matched_signals: string[];
  meets_requirements: boolean;
}

export function useJobMatcher() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["values-job-matches"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("values-job-matcher", {
        body: { limit: 100 },
      });
      if (error) throw error;
      return data as { matches: MatchedJob[]; total: number; preferences_applied: number };
    },
    enabled: !!session,
    staleTime: 60_000,
  });
}

export interface JobPreference {
  id?: string;
  signal_key: string;
  signal_label: string;
  min_score: number;
  is_required: boolean;
}

export function useJobPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["job-match-preferences", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_match_preferences")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (pref: JobPreference) => {
      const { error } = await supabase
        .from("job_match_preferences")
        .upsert({
          user_id: user!.id,
          signal_key: pref.signal_key,
          signal_label: pref.signal_label,
          min_score: pref.min_score,
          is_required: pref.is_required,
        }, { onConflict: "user_id,signal_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-match-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["values-job-matches"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (signalKey: string) => {
      const { error } = await supabase
        .from("job_match_preferences")
        .delete()
        .eq("user_id", user!.id)
        .eq("signal_key", signalKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-match-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["values-job-matches"] });
    },
  });

  return { preferences: query.data || [], isLoading: query.isLoading, upsert, remove };
}

export function useApplicationsTracker() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["applications-tracker", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications_tracker")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const trackApplication = useMutation({
    mutationFn: async (app: {
      company_id: string;
      job_id?: string;
      job_title: string;
      company_name: string;
      application_link?: string;
      alignment_score?: number;
      matched_signals?: string[];
      status?: string;
    }) => {
      const { error } = await supabase.from("applications_tracker").insert({
        user_id: user!.id,
        company_id: app.company_id,
        job_id: app.job_id || null,
        job_title: app.job_title,
        company_name: app.company_name,
        application_link: app.application_link || null,
        alignment_score: app.alignment_score || 0,
        matched_signals: app.matched_signals || [],
        status: app.status || "Draft",
        applied_at: app.status === "Submitted" ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications-tracker"] });
      toast({ title: "Application tracked!" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "Submitted") updates.applied_at = new Date().toISOString();
      const { error } = await supabase
        .from("applications_tracker")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications-tracker"] });
    },
  });

  const deleteApp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("applications_tracker")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications-tracker"] });
    },
  });

  return {
    applications: query.data || [],
    isLoading: query.isLoading,
    trackApplication,
    updateStatus,
    deleteApp,
  };
}
