import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TickerItem {
  id: string;
  company_name: string | null;
  company_slug: string | null;
  message: string;
  source_tag: string | null;
  item_type: string;
  is_pinned: boolean;
  created_at: string;
}

const ITEM_TYPE_COLORS: Record<string, string> = {
  pac_political: "#ff4d6d",
  lobbying: "#ff4d6d",
  donation: "#ff4d6d",
  warn_act: "#ffb347",
  nlrb: "#ffb347",
  osha: "#ffb347",
  ghost_posting: "#ffb347",
  institutional_link: "#ff6b35",
  government_contract: "#7eb8f7",
  score_update: "#f0c040",
  news: "#7a7590",
  general: "#7a7590",
};

export function getTickerItemColor(itemType: string): string {
  return ITEM_TYPE_COLORS[itemType] || "#7a7590";
}

export function useTickerItems() {
  return useQuery({
    queryKey: ["ticker-items"],
    queryFn: async () => {
      const [tickerRes, slugRes] = await Promise.all([
        (supabase as any)
          .from("ticker_items")
          .select("id, company_name, message, source_tag, item_type, is_pinned, created_at")
          .eq("is_hidden", false)
          .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("companies")
          .select("name, slug")
          .limit(1000),
      ]);

      if (tickerRes.error) throw tickerRes.error;

      const slugMap = new Map<string, string>();
      (slugRes.data || []).forEach((c: any) => {
        slugMap.set(c.name, c.slug);
      });

      return ((tickerRes.data as any[]) ?? []).map((item): TickerItem => ({
        ...item,
        company_slug: item.company_name ? (slugMap.get(item.company_name) || null) : null,
      }));
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
