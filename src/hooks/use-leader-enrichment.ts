import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnrichmentData {
  id: string;
  leader_id: string;
  leader_type: string;
  company_id: string | null;
  normalized_company_name: string | null;
  bio: string | null;
  education: string | null;
  career_highlights: string[] | null;
  ai_narrative: string | null;
  photo_url: string | null;
  enrichment_source: string | null;
  enriched_at: string;
}

export function useLeaderEnrichment(leaderId: string | undefined, leaderType: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: enrichment, isLoading } = useQuery({
    queryKey: ["leader-enrichment", leaderId, leaderType],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("leader_enrichments")
        .select("*")
        .eq("leader_id", leaderId!)
        .eq("leader_type", leaderType)
        .maybeSingle();
      return data as EnrichmentData | null;
    },
    enabled: !!leaderId,
  });

  const enrichMutation = useMutation({
    mutationFn: async (params: {
      leader_name: string;
      leader_title: string;
      company_id?: string;
      company_name?: string;
      company_industry?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("leader-enrich", {
        body: {
          leader_id: leaderId,
          leader_type: leaderType,
          ...params,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-enrichment", leaderId, leaderType] });
      toast({ title: "Dossier Generated", description: "AI intelligence brief is now available." });
    },
    onError: (err: any) => {
      toast({ title: "Enrichment Failed", description: err.message || "Could not generate dossier.", variant: "destructive" });
    },
  });

  return {
    enrichment,
    isLoading,
    enrich: enrichMutation.mutate,
    isEnriching: enrichMutation.isPending,
  };
}
