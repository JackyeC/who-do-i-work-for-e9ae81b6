import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { VerificationData } from "@/components/SourceTransparencyPanel";

/**
 * Fetch verification status for a specific signal.
 * Returns null if no verification record exists yet.
 */
export function useSignalVerification(signalTable?: string, signalId?: string) {
  return useQuery({
    queryKey: ["signal-verification", signalTable, signalId],
    queryFn: async (): Promise<VerificationData | null> => {
      if (!signalTable || !signalId) return null;

      const { data, error } = await (supabase as any)
        .from("signal_verifications")
        .select("*")
        .eq("signal_table", signalTable)
        .eq("signal_id", signalId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching verification:", error);
        return null;
      }

      return data as VerificationData | null;
    },
    enabled: !!signalTable && !!signalId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch all verifications for a company.
 */
export function useCompanyVerifications(companyId?: string) {
  return useQuery({
    queryKey: ["company-verifications", companyId],
    queryFn: async (): Promise<VerificationData[]> => {
      if (!companyId) return [];

      const { data, error } = await (supabase as any)
        .from("signal_verifications")
        .select("*")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching company verifications:", error);
        return [];
      }

      return (data || []) as VerificationData[];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
