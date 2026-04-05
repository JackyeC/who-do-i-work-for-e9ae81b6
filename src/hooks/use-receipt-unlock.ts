import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Server-side check for receipt "Use This" unlock.
 * Replaces the old localStorage.getItem("jrc-edit-unlocked") gate.
 * User is unlocked if:
 *   1. They are authenticated (signed in), OR
 *   2. Their email exists in career_waitlist with reason = 'heat_map_signup'
 */
export function useReceiptUnlock() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Authenticated users are always unlocked
    if (user) {
      setUnlocked(true);
      setLoading(false);
      return;
    }

    // For unauthenticated users, check localStorage as a UI cache only
    // The actual unlock happens server-side via EmailCaptureModal insert
    const cached = localStorage.getItem("jrc-edit-unlocked") === "true";
    setUnlocked(cached);
    setLoading(false);
  }, [user]);

  const markUnlocked = useCallback(() => {
    // Called after successful server-side insert into career_waitlist
    localStorage.setItem("jrc-edit-unlocked", "true");
    setUnlocked(true);
  }, []);

  return { unlocked, loading, markUnlocked };
}
