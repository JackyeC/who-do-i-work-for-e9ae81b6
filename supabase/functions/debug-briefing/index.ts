// Temporary diagnostic function to debug the Daily Briefing pipeline
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const diagnostics: Record<string, any> = {};

  // 1. Count total articles in personalized_news
  const { count: totalNews } = await supabase
    .from("personalized_news")
    .select("*", { count: "exact", head: true });
  diagnostics.total_personalized_news = totalNews;

  // 2. Count active articles
  const { count: activeNews } = await supabase
    .from("personalized_news")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  diagnostics.active_news = activeNews;

  // 3. Count articles within 48h window
  const { count: recentNews } = await supabase
    .from("personalized_news")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .gte("published_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  diagnostics.recent_48h_news = recentNews;

  // 4. Get 3 sample articles with their dates
  const { data: sampleNews } = await supabase
    .from("personalized_news")
    .select("id, title, published_at, fetched_at, is_active, category")
    .eq("is_active", true)
    .order("fetched_at", { ascending: false })
    .limit(3);
  diagnostics.sample_articles = sampleNews;

  // 5. Check profiles with news_onboarding_complete
  const { count: onboardedUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("news_onboarding_complete", true);
  diagnostics.onboarded_users = onboardedUsers;

  // 6. List all profiles with their onboarding status
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, news_onboarding_complete, last_briefing_date, user_values, industries, interests, location_state")
    .limit(10);
  diagnostics.profiles = (profiles || []).map((p: any) => ({
    id: p.id?.slice(0, 8) + "...",
    email: p.email,
    onboarding: p.news_onboarding_complete,
    last_briefing: p.last_briefing_date,
    has_values: (p.user_values || []).length > 0,
    has_industries: (p.industries || []).length > 0,
    has_interests: (p.interests || []).length > 0,
    state: p.location_state,
  }));

  // 7. Count existing daily briefings
  const { count: briefingCount } = await supabase
    .from("daily_briefings")
    .select("*", { count: "exact", head: true });
  diagnostics.total_briefings = briefingCount;

  // 8. Check NEWS_API_KEY
  diagnostics.has_news_api_key = !!Deno.env.get("NEWS_API_KEY");
  diagnostics.news_api_provider = Deno.env.get("NEWS_API_PROVIDER") || "newsdata (default)";

  // 9. Current timestamp for reference
  diagnostics.server_time = new Date().toISOString();
  diagnostics.cutoff_48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  return new Response(
    JSON.stringify(diagnostics, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
