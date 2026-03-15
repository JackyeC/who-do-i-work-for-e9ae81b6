import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface WorkNewsArticle {
  id: string;
  headline: string;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  sentiment_score: number | null;
  tone_label: string | null;
  themes: string[];
  category: string;
  is_controversy: boolean;
  controversy_type: string | null;
  jackye_take: string | null;
  jackye_take_approved: boolean;
  created_at: string;
}

export function useWorkNews(limit = 50) {
  return useQuery({
    queryKey: ["work-news", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_news")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as WorkNewsArticle[]) ?? [];
    },
    staleTime: 1000 * 60 * 15, // 15 min
  });
}

export function useWorkNewsCount() {
  return useQuery({
    queryKey: ["work-news-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("work_news")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkNewsTicker() {
  return useQuery({
    queryKey: ["work-news-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_news")
        .select("id, headline, source_name, category, is_controversy, published_at")
        .order("published_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as Pick<WorkNewsArticle, "id" | "headline" | "source_name" | "category" | "is_controversy" | "published_at">[]) ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
}
