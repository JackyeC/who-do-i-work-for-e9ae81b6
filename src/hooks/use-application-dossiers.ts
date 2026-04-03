import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { isLikelyMissingSchemaObject } from "@/lib/supabase-errors";

export type ApplicationEmailDossierRow = Tables<"application_email_dossiers">;

export function useApplicationDossiers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["application-email-dossiers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_email_dossiers")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) {
        if (isLikelyMissingSchemaObject(error)) {
          console.warn("[application_email_dossiers] table or policy missing — run migrations:", error);
          return [] as ApplicationEmailDossierRow[];
        }
        throw error;
      }
      return data as ApplicationEmailDossierRow[];
    },
    enabled: !!user,
    staleTime: 20_000,
  });
}

export function dossierForApplication(
  rows: ApplicationEmailDossierRow[] | undefined,
  applicationId: string
) {
  return rows?.find((d) => d.application_id === applicationId);
}
