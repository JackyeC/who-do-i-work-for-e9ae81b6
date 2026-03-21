import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RefreshState {
  needsRefresh: boolean;
  lastBriefingDate: string | null;
  triggerRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function useBriefingRefresh(userId: string | null): RefreshState {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [lastBriefingDate, setLastBriefingDate] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkBriefingStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("last_briefing_date, news_onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (!profile || !profile.news_onboarding_complete) {
        setNeedsRefresh(false);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const lastDate = profile.last_briefing_date;
      setLastBriefingDate(lastDate);
      setNeedsRefresh(!lastDate || lastDate < today);
    } catch (err) {
      console.error("[Briefing] Status check error:", err);
    }
  }, [userId]);

  const triggerRefresh = useCallback(async () => {
    if (!userId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await supabase.functions.invoke("generate-briefing", {
        body: { mode: "single", user_id: userId },
      });
      setNeedsRefresh(false);
      setLastBriefingDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error("[Briefing] Refresh error:", err);
    }
    setIsRefreshing(false);
  }, [userId, isRefreshing]);

  useEffect(() => {
    checkBriefingStatus();
  }, [checkBriefingStatus]);

  // 8am auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 8 && now.getMinutes() === 0) {
        checkBriefingStatus().then(() => {
          if (needsRefresh) triggerRefresh();
        });
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [checkBriefingStatus, triggerRefresh, needsRefresh]);

  // Auto-trigger on login if needed
  useEffect(() => {
    if (needsRefresh && userId) {
      triggerRefresh();
    }
  }, [needsRefresh, userId, triggerRefresh]);

  return { needsRefresh, lastBriefingDate, triggerRefresh, isRefreshing };
}
