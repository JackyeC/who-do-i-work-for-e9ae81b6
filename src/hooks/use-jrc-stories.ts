import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { JrcStory } from "@/lib/jrc-story-schema";

export function useJrcStories(limit = 20) {
  return useQuery({
    queryKey: ["jrc-stories", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("jrc_stories")
        .select("*")
        .eq("language", "en")
        .order("published_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as JrcStory[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useJrcStory(slug: string) {
  return useQuery({
    queryKey: ["jrc-story", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("jrc_stories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as JrcStory | null;
    },
    enabled: !!slug,
  });
}

export function useJrcStoriesByCompany(companySlug: string) {
  return useQuery({
    queryKey: ["jrc-stories-company", companySlug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("jrc_stories")
        .select("*")
        .eq("language", "en")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as JrcStory[]).filter((s) =>
        s.companies.some((c) => c.slug === companySlug)
      );
    },
    enabled: !!companySlug,
  });
}

export function useJrcStoriesByPerson(personSlug: string) {
  return useQuery({
    queryKey: ["jrc-stories-person", personSlug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("jrc_stories")
        .select("*")
        .eq("language", "en")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as JrcStory[]).filter((s) =>
        s.people.some((p) => p.slug === personSlug)
      );
    },
    enabled: !!personSlug,
  });
}