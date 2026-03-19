import { useQuery } from "@tanstack/react-query";

export interface GNewsArticle {
  title: string;
  url: string;
  publishedAt: string;
  source: { name: string; url: string };
}

const GNEWS_URL =
  'https://gnews.io/api/v4/search?q=hiring+OR+%22mission-driven%22+OR+workplace+OR+%22future+of+work%22&lang=en&max=6&token=781e672298f1bc60de93333507c811a2';

export function useGNews() {
  return useQuery({
    queryKey: ["gnews-dashboard"],
    queryFn: async (): Promise<GNewsArticle[]> => {
      const res = await fetch(GNEWS_URL);
      if (!res.ok) return [];
      const json = await res.json();
      return json.articles ?? [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });
}
