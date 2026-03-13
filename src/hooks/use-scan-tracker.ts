import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Logs a scan event when a company profile is viewed.
 * Used for social proof on the landing page.
 */
export function useScanTracker(companyId: string | undefined, companyName: string | undefined) {
  useEffect(() => {
    if (!companyId || !companyName) return;

    // Debounce: only log once per company per session
    const sessionKey = `scan_logged_${companyId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    supabase.from("company_scan_events").insert({
      company_id: companyId,
      company_name: companyName,
    }).then(() => {
      sessionStorage.setItem(sessionKey, "1");
    });
  }, [companyId, companyName]);
}
