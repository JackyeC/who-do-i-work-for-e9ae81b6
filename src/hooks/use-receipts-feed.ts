import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decodeEscapes, isLikelyEnglish, isUSOrEmployerRelevant } from "@/lib/ticker-filters";

export interface ReceiptArticle {
  id: string;
  work_news_id: string;
  headline: string;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  sentiment_score: number | null;
  tone_label: string | null;
  themes: string[] | null;
  category: string | null;
  is_controversy: boolean | null;
  controversy_type: string | null;
  jackye_take: string;
  debate_prompt: string;
  debate_sides: string[];
  receipt_connection: string;
  spice_level: number;
  why_it_matters: string[] | null;
  poster_url: string | null;
  poster_data: {
    bg: string;
    accent: string;
    dark: string;
    emoji: string;
    bigTxt: string;
    sub: string;
    tag: string;
    copy: string;
    fine: string;
  };
  created_at: string | null;
}

const QUERY_KEY = ["receipts-feed"];

export function useReceiptsFeed() {
  const queryClient = useQueryClient();

  // Subscribe to realtime inserts on receipts_enriched
  useEffect(() => {
    const channel = supabase
      .channel("receipts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "receipts_enriched" },
        (payload) => {
          // Prepend the new article to the cached list
          queryClient.setQueryData<ReceiptArticle[]>(QUERY_KEY, (old) => {
            if (!old) return [payload.new as unknown as ReceiptArticle];
            // Avoid duplicates
            if (old.some((a) => a.id === (payload.new as any).id)) return old;
            return [payload.new as unknown as ReceiptArticle, ...old];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts_enriched")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      // Deduplicate by headline — keep the newest entry
      const seen = new Set<string>();
      const unique = ((data ?? []) as unknown as ReceiptArticle[])
        .map(a => ({
          ...a,
          headline: a.headline ? decodeEscapes(a.headline) : a.headline,
          source_name: a.source_name ? decodeEscapes(a.source_name) : a.source_name,
        }))
        .filter((a) => {
          const key = a.headline?.toLowerCase().trim();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          // English-only + US/AI/world-scale relevance gate
          if (!isLikelyEnglish(a.headline)) return false;
          if (!isUSOrEmployerRelevant(a.headline, a.source_name, true)) return false;
          return true;
        });
      return unique;
    },
    staleTime: 1000 * 60 * 5,
  });
}
