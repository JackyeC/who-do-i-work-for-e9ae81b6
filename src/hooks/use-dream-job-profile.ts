import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DreamJobProfileV1 } from "@/domain/career/dream-job-profile";
import { syncDreamJobProfileRemote } from "@/domain/career/sync-dream-job-profile";
import { isLikelyMissingSchemaObject } from "@/lib/supabase-errors";
import { friendlyErrorMessage } from "@/lib/user-friendly-error";
import { useToast } from "@/hooks/use-toast";

export function useDreamJobProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["dream-job-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("dream_job_profile, dream_job_profile_version")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) {
        if (isLikelyMissingSchemaObject(error)) {
          console.warn("[dream_job_profile] column missing — run migrations:", error);
          return {
            dream_job_profile: null,
            dream_job_profile_version: 0,
            __schemaFallback: true as const,
          };
        }
        throw error;
      }
      return { ...data, __schemaFallback: false as const };
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      return syncDreamJobProfileRemote(supabase, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dream-job-profile"] });
    },
    onError: (err: unknown) => {
      if (isLikelyMissingSchemaObject(err)) {
        toast({
          title: "Dream Job Profile not available yet",
          description: "Deploy the migration that adds dream_job_profile to profiles, then try Sync again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Could not sync profile",
        description: friendlyErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const parsed =
    query.data?.dream_job_profile && typeof query.data.dream_job_profile === "object"
      ? (query.data.dream_job_profile as unknown as DreamJobProfileV1)
      : null;

  return {
    profile: parsed,
    version: query.data?.dream_job_profile_version ?? 0,
    schemaFallback: query.data?.__schemaFallback === true,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    syncDreamJobProfile: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
  };
}
