import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ROIPipelineData } from "@/components/ROIPipelineCard";

export function useROIPipeline(companyId: string | undefined) {
  return useQuery({
    queryKey: ["roi-pipeline", companyId],
    enabled: !!companyId,
    queryFn: async (): Promise<ROIPipelineData | null> => {
      if (!companyId) return null;

      const { data, error } = await supabase.rpc("get_company_roi_pipeline", {
        _company_id: companyId,
      } as any);

      if (error) {
        console.error("ROI pipeline query error:", error);
        return null;
      }

      if (!data) return null;

      const pipeline = data as any;
      return {
        moneyIn: pipeline.moneyIn || [],
        network: pipeline.network || [],
        benefitsOut: pipeline.benefitsOut || [],
        linkages: pipeline.linkages || [],
        totalSpending: pipeline.totalSpending || 0,
        totalBenefits: pipeline.totalBenefits || 0,
      };
    },
  });
}

export function useInfluenceChain(companyId: string | undefined) {
  return useQuery({
    queryKey: ["influence-chain", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase.rpc("trace_influence_chain", {
        _company_id: companyId,
      } as any);

      if (error) {
        console.error("Influence chain query error:", error);
        return [];
      }

      return (data as any[]) || [];
    },
  });
}
