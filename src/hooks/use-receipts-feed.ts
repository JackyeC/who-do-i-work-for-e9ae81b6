import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { decodeEscapes, isLikelyEnglish, isUSOrEmployerRelevant } from "@/lib/ticker-filters";

// US-first sort: American stories float to top, international below
const NON_US_DOMAINS = new Set([
  "bbc.com","telegraph.co.uk","independent.co.uk","mirror.co.uk",
  "dailymail.co.uk","metro.co.uk","standard.co.uk","sky.com","itv.com",
  "abc.net.au","smh.com.au","theaustralian.com.au","stuff.co.nz",
  "cbc.ca","globalnews.ca","thestar.com","nationalpost.com",
  "scmp.com","straitstimes.com","japantimes.co.jp","hindustantimes.com",
  "timesofindia.com","ndtv.com","aljazeera.com","theguardian.com",
  "lemonde.fr","elpais.com","spiegel.de","corriere.it","repubblica.it",
  "bbc.co.uk","hcamag.com","channelnewsasia.com",
]);
function isUSSource(sourceName: string | null): boolean {
  if (!sourceName) return true;
  const domain = sourceName.toLowerCase().replace(/^www\./, "");
  return !NON_US_DOMAINS.has(domain);
}

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
        .order("published_at", { ascending: false })
        .limit(200);
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
      // US-first sort: American stories at top, then international
      unique.sort((a, b) => {
        const aUS = isUSSource(a.source_name) ? 0 : 1;
        const bUS = isUSSource(b.source_name) ? 0 : 1;
        if (aUS !== bUS) return aUS - bUS;
        // Within same group, keep chronological (newest first)
        const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
        const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
        return bTime - aTime;
      });
      return unique;
    },
    staleTime: 1000 * 60 * 5,
  });
}
