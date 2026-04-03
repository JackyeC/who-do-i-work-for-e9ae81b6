import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FREE_SCAN_LIMIT = 3;
const SESSION_KEY = "wdiwf_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useScanUsage() {
  const { user } = useAuth();
  const [scanCount, setScanCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const sessionId = getSessionId();

  const fetchCount = useCallback(async () => {
    try {
      const query = supabase
        .from("scan_usage" as any)
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId);

      const { count } = await query;
      setScanCount(count || 0);
    } catch {
      setScanCount(0);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const recordScan = useCallback(async (scanType: string, companyName?: string) => {
    await supabase.from("scan_usage" as any).insert({
      user_id: user?.id || null,
      session_id: sessionId,
      scan_type: scanType,
      company_name: companyName || null,
    });
    setScanCount(prev => prev + 1);
  }, [user, sessionId]);

  const hasScansRemaining = user !== null || scanCount < FREE_SCAN_LIMIT;
  const scansRemaining = Math.max(0, FREE_SCAN_LIMIT - scanCount);

  return {
    scanCount,
    scansRemaining,
    hasScansRemaining,
    recordScan,
    loading,
    FREE_SCAN_LIMIT,
  };
}
