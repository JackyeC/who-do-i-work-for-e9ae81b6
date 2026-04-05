import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Logs a view event when a company profile/dossier/check is viewed.
 * Writes to user_recent_company_views (per-user, RLS-protected).
 * Only tracks for authenticated users, once per company per browser session.
 */
export function useScanTracker(companyId: string | undefined, companyName: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!companyId || !companyName || !user) return;

    const sessionKey = `scan_logged_${companyId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    (supabase as any)
      .from("user_recent_company_views")
      .upsert(
        {
          user_id: user.id,
          company_id: companyId,
          company_name: companyName,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,company_id" }
      )
      .then(({ error }: any) => {
        if (!error) {
          sessionStorage.setItem(sessionKey, "1");
          queryClient.invalidateQueries({ queryKey: ["dashboard-briefing"] });
        }
      });
  }, [companyId, companyName, user, queryClient]);
}
