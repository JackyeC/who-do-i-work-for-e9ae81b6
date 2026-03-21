import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { mode = "single", user_id } = await req.json();
    const today = new Date().toISOString().split("T")[0];

    if (mode === "batch") {
      // Generate briefings for all onboarded users
      const { data: users } = await supabase
        .from("profiles")
        .select("id")
        .eq("news_onboarding_complete", true);

      let generated = 0;
      for (const user of users || []) {
        await generateBriefingForUser(supabase, user.id, today);
        generated++;
      }

      return new Response(
        JSON.stringify({ success: true, mode: "batch", generated }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single user mode
    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for cached briefing
    const { data: cached } = await supabase
      .from("daily_briefings")
      .select("*")
      .eq("user_id", user_id)
      .eq("briefing_date", today)
      .maybeSingle();

    if (cached) {
      // Return cached briefing with news details
      const newsIds = cached.news_ids || [];
      const companyIds = cached.company_rec_ids || [];

      let news: any[] = [];
      if (newsIds.length > 0) {
        const { data } = await supabase
          .from("personalized_news")
          .select("*")
          .in("id", newsIds);
        news = data || [];
        // Preserve order from news_ids
        news.sort((a: any, b: any) => newsIds.indexOf(a.id) - newsIds.indexOf(b.id));
      }

      let companies: any[] = [];
      if (companyIds.length > 0) {
        const { data } = await supabase
          .from("companies")
          .select("id, name, slug, industry, state, civic_footprint_score, career_intelligence_score")
          .in("id", companyIds);
        companies = data || [];
      }

      return new Response(
        JSON.stringify({
          success: true,
          cached: true,
          briefing: {
            date: cached.briefing_date,
            generated_at: cached.generated_at,
            top_values_matched: cached.top_values_matched,
          },
          news,
          companies,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate fresh briefing
    const result = await generateBriefingForUser(supabase, user_id, today);

    return new Response(
      JSON.stringify({ success: true, cached: false, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Briefing generation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateBriefingForUser(supabase: any, userId: string, today: string) {
  // Get personalized news using the scoring function
  const { data: scoredNews } = await supabase.rpc("get_personalized_news", {
    p_user_id: userId,
    p_limit: 20,
  });

  // Get company recommendations
  const { data: companies } = await supabase.rpc("get_company_recommendations", {
    p_user_id: userId,
    p_limit: 5,
  });

  const news = scoredNews || [];
  const recs = companies || [];

  // Get user values for the briefing metadata
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_values")
    .eq("id", userId)
    .maybeSingle();

  const topValues = (profile?.user_values || []).slice(0, 3);

  // Upsert the briefing
  await supabase.from("daily_briefings").upsert({
    user_id: userId,
    briefing_date: today,
    news_ids: news.map((n: any) => n.id),
    company_rec_ids: recs.map((c: any) => c.id),
    top_values_matched: topValues,
    generated_at: new Date().toISOString(),
  }, { onConflict: "user_id,briefing_date" });

  // Update last briefing date
  await supabase
    .from("profiles")
    .update({ last_briefing_date: today })
    .eq("id", userId);

  return {
    briefing: {
      date: today,
      generated_at: new Date().toISOString(),
      top_values_matched: topValues,
    },
    news,
    companies: recs,
  };
}
