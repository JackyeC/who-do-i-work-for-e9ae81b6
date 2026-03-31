import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useReceiptsFeed() {
  return useQuery({
    queryKey: ["receipts-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts_enriched")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReceiptArticle[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
