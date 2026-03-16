import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useBetaAgreement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: needsAgreement = false, isLoading } = useQuery({
    queryKey: ["beta-agreement", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("beta_agreement_accepted_at")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return !data?.beta_agreement_accepted_at;
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const { mutateAsync: acceptAgreement, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ beta_agreement_accepted_at: new Date().toISOString() } as any)
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(["beta-agreement", user?.id], false);
    },
  });

  return { needsAgreement, isLoading, acceptAgreement, isPending };
}
