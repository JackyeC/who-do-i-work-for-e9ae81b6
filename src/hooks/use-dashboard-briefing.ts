import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDashboardBriefing() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-briefing", user?.id],
    queryFn: async () => {
      const [
        recentViewsRes,
        alertsRes,
        profileRes,
        docsRes,
        newsRes,
        profileNameRes,
      ] = await Promise.all([
        // Recent company views (the new lightweight table)
        (supabase as any)
          .from("user_recent_company_views")
          .select("company_id, company_name, viewed_at")
          .eq("user_id", user!.id)
          .order("viewed_at", { ascending: false })
          .limit(10),
        // Real alerts
        (supabase as any)
          .from("user_alerts")
          .select("id, change_description, change_type, company_name, company_id, signal_category, date_detected, created_at")
          .eq("user_id", user!.id)
          .order("date_detected", { ascending: false })
          .limit(5),
        // Career profile (for resume check)
        (supabase as any)
          .from("user_career_profile")
          .select("skills, seniority_level")
          .eq("user_id", user!.id)
          .maybeSingle(),
        // Documents (resume check)
        supabase
          .from("user_documents")
          .select("id, status, parsed_signals")
          .limit(1),
        // World of work news (last 48h)
        supabase
          .from("work_news")
          .select("id, headline, source_name, category, is_controversy, published_at")
          .eq("language", "en")
          .order("published_at", { ascending: false })
          .limit(5),
        // User profile for name
        (supabase as any)
          .from("profiles")
          .select("full_name, email")
          .eq("id", user!.id)
          .maybeSingle(),
      ]);

      // Enrich recent views with company metadata (scores, slug, industry)
      const recentViews = recentViewsRes.data || [];
      let recentCompanies: any[] = [];

      if (recentViews.length > 0) {
        const companyIds = recentViews.map((v: any) => v.company_id);
        const { data: companiesData } = await supabase
          .from("companies")
          .select("id, name, slug, industry, employer_clarity_score, updated_at")
          .in("id", companyIds);

        const companyMap = new Map((companiesData || []).map((c: any) => [c.id, c]));
        recentCompanies = recentViews
          .map((v: any) => {
            const c = companyMap.get(v.company_id);
            if (!c) return null;
            return {
              name: c.name,
              slug: c.slug,
              industry: c.industry,
              score: c.employer_clarity_score ?? 0,
              updatedAt: v.viewed_at,
            };
          })
          .filter(Boolean);
      }

      const docs = docsRes.data || [];
      const hasResume = docs.length > 0 || localStorage.getItem("wdiwf_resume_uploaded") === "true";
      const parsedSkillsCount = (docs[0]?.parsed_signals as any)?.skills?.length || 0;

      const fullName = profileNameRes.data?.full_name || "";
      const firstName = fullName.split(" ")[0] || "";

      return {
        tracked: recentCompanies,
        alerts: alertsRes.data || [],
        hasResume,
        parsedSkillsCount,
        firstName,
        news: newsRes.data || [],
        profile: profileRes.data,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
