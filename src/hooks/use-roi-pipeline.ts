import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import type { ROIPipelineData } from "@/components/ROIPipelineCard";

export function useROIPipeline(companyId: string | undefined, companyName?: string) {
  const queryClient = useQueryClient();
  const [autoScanTriggered, setAutoScanTriggered] = useState(false);
  const [autoScanning, setAutoScanning] = useState(false);
  const [hasBeenScanned, setHasBeenScanned] = useState(false);
  const scanAttempted = useRef(false);

  const query = useQuery({
    queryKey: ["roi-pipeline", companyId],
    enabled: !!companyId,
    refetchInterval: autoScanning ? 8000 : false,
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
        moneyIn: (pipeline.moneyIn || []).map((item: any) => ({
          ...item,
          matched_entity_name: item.matched_entity_name || undefined,
          matched_entity_type: item.matched_entity_type || undefined,
        })),
        network: pipeline.network || [],
        benefitsOut: (pipeline.benefitsOut || []).map((item: any) => ({
          ...item,
          matched_entity_name: item.matched_entity_name || undefined,
          matched_entity_type: item.matched_entity_type || undefined,
        })),
        linkages: pipeline.linkages || [],
        totalSpending: pipeline.totalSpending || 0,
        totalBenefits: pipeline.totalBenefits || 0,
      };
    },
  });

  // Auto-trigger scan when pipeline is empty and we have a company name
  useEffect(() => {
    if (
      !companyId ||
      !companyName ||
      scanAttempted.current ||
      query.isLoading ||
      autoScanTriggered
    ) return;

    const isEmpty = !query.data ||
      (query.data.moneyIn.length === 0 &&
       query.data.network.length === 0 &&
       query.data.benefitsOut.length === 0 &&
       query.data.linkages.length === 0);

    if (!isEmpty) return;

    // Check if a scan has already been run for this company
    supabase
      .from("scan_runs" as any)
      .select("id")
      .eq("company_id", companyId)
      .limit(1)
      .then(({ data: scanRuns }) => {
        if (scanRuns && scanRuns.length > 0) {
          setHasBeenScanned(true);
          return;
        }
        if (scanAttempted.current) return;

        scanAttempted.current = true;
        setAutoScanTriggered(true);
        setAutoScanning(true);

        console.log(`[ROI Pipeline] Auto-triggering scan for ${companyName} (${companyId})`);

        supabase.functions.invoke("company-intelligence-scan", {
          body: { companyId, companyName },
        }).then(({ error }) => {
          // 409 = scan already in progress, not a real error — ignore it
          if (error && !error.message?.includes('409') && !error.message?.includes('already in progress')) {
            console.error("[ROI Pipeline] Auto-scan failed:", error);
          }
          setAutoScanning(false);
          setHasBeenScanned(true);
          queryClient.invalidateQueries({ queryKey: ["roi-pipeline", companyId] });
          queryClient.invalidateQueries({ queryKey: ["influence-chain", companyId] });
          queryClient.invalidateQueries({ queryKey: ["latest-scan-run", companyId] });
        });
      });
  }, [companyId, companyName, query.data, query.isLoading, autoScanTriggered, queryClient]);

  // Manual trigger for the scan button
  const triggerScan = async () => {
    if (!companyId || !companyName) return;
    setAutoScanning(true);
    try {
      const { error } = await supabase.functions.invoke("company-intelligence-scan", {
        body: { companyId, companyName },
      });
      if (error && !error.message?.includes('409') && !error.message?.includes('already in progress')) throw error;
    } catch (e) {
      console.error("[ROI Pipeline] Manual scan failed:", e);
    } finally {
      setAutoScanning(false);
      setHasBeenScanned(true);
      queryClient.invalidateQueries({ queryKey: ["roi-pipeline", companyId] });
      queryClient.invalidateQueries({ queryKey: ["influence-chain", companyId] });
      queryClient.invalidateQueries({ queryKey: ["latest-scan-run", companyId] });
    }
  };

  return {
    ...query,
    autoScanning,
    hasBeenScanned,
    triggerScan,
  };
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
