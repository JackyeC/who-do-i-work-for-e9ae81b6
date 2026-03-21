// ============================================================
// WDIWF Edge Function: generate-briefing
// Generates personalized daily briefings for users
// Called by: cron at 8am CT + on-demand when user logs in
// Deploy: supabase functions deploy generate-briefing
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "single"; // 'batch' (cron) or 'single' (user request)
    const userId = body.user_id; // for single mode

    if (mode === "batch") {
      // === BATCH MODE: 8am cron generates briefings for all active users ===
      return await generateBatchBriefings(supabase);
    } else if (mode === "single" && userId) {
      // === SINGLE MODE: user logs in and needs their briefing ===
      return await generateUserBriefing(supabase, userId);
    } else {
      return new Response(
        JSON.stringify({ error: "Provide mode='batch' or mode='single' with user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Briefing generation error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// BATCH: Generate briefings for all users who haven't gotten
// today's briefing yet. Called by 8am cron.
// ============================================================
async function generateBatchBriefings(supabase: any) {
  const today = new Date().toISOString().split("T")[0];

  // Get all users with onboarding complete who don't have today's briefing
  const { data: users, error: userError } = await supabase
    .from("profiles")
    .select("id, user_values, industries, interests, location_state")
    .eq("news_onboarding_complete", true)
    .or(`last_briefing_date.is.null,last_briefing_date.lt.${today}`);

  if (userError) {
    console.error("Error fetching users:", userError);
    return new Response(
      JSON.stringify({ error: userError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let generated = 0;
  let failed = 0;

  for (const user of users || []) {
    try {
      const effectiveUserId = user.id;
      await buildBriefingForUser(supabase, effectiveUserId, user);
      generated++;
    } catch (err) {
      console.error(`Failed briefing for user ${user.id}:`, err);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      mode: "batch", 
      date: today,
      generated, 
      failed,
      total_users: (users || []).length 
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============================================================
// SINGLE: Generate briefing for one user on login
// ============================================================
async function generateUserBriefing(supabase: any, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Check if briefing already exists for today
  const { data: existing } = await supabase
    .from("daily_briefings")
    .select("id, generated_at")
    .eq("user_id", userId)
    .eq("briefing_date", today)
    .maybeSingle();

  if (existing) {
    // Briefing already generated — return it
    return await fetchFullBriefing(supabase, userId, today);
  }

  // Fetch user profile
  const { data: user } = await supabase
    .from("profiles")
    .select("id, user_values, industries, interests, location_state")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    return new Response(
      JSON.stringify({ error: "User not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await buildBriefingForUser(supabase, userId, user);
  return await fetchFullBriefing(supabase, userId, today);
}

// ============================================================
// CORE: Build a briefing for a specific user
// ============================================================
async function buildBriefingForUser(supabase: any, userId: string, userProfile: any) {
  const today = new Date().toISOString().split("T")[0];

  // Use the scoring function to get personalized news
  const { data: scoredNews, error: newsError } = await supabase
    .rpc("get_personalized_news", {
      p_user_id: userId,
      p_limit: 15,
    });

  if (newsError) {
    console.error("Scoring error:", newsError);
    // Fallback: get recent news without personalization
    const { data: fallbackNews } = await supabase
      .from("personalized_news")
      .select("id")
      .eq("is_active", true)
      .gte("published_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order("importance_score", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(15);
    
    const newsIds = (fallbackNews || []).map((n: any) => n.id);
    await upsertBriefing(supabase, userId, today, newsIds, [], []);
    return;
  }

  const newsIds = (scoredNews || []).map((n: any) => n.id);

  // Get company recommendations
  const { data: companyRecs } = await supabase
    .rpc("get_company_recommendations", {
      p_user_id: userId,
      p_limit: 5,
    });

  const companyIds = (companyRecs || []).map((c: any) => c.id);

  // Determine which values drove the ranking
  const topValues = determineTopValues(scoredNews || [], userProfile);

  await upsertBriefing(supabase, userId, today, newsIds, companyIds, topValues);

  // Update user's last briefing date
  await supabase
    .from("profiles")
    .update({ last_briefing_date: today })
    .eq("id", userId);
}

// ============================================================
// UPSERT the briefing record
// ============================================================
async function upsertBriefing(
  supabase: any, userId: string, date: string,
  newsIds: string[], companyIds: string[], topValues: string[]
) {
  const { error } = await supabase
    .from("daily_briefings")
    .upsert({
      user_id: userId,
      briefing_date: date,
      news_ids: newsIds,
      company_rec_ids: companyIds,
      top_values_matched: topValues,
      generated_at: new Date().toISOString(),
    }, { onConflict: "user_id,briefing_date" });

  if (error) {
    console.error("Upsert briefing error:", error);
    throw error;
  }
}

// ============================================================
// FETCH the full briefing with news + companies hydrated
// ============================================================
async function fetchFullBriefing(supabase: any, userId: string, date: string) {
  // Get the briefing record
  const { data: briefing } = await supabase
    .from("daily_briefings")
    .select("*")
    .eq("user_id", userId)
    .eq("briefing_date", date)
    .maybeSingle();

  if (!briefing) {
    return new Response(
      JSON.stringify({ error: "Briefing not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Hydrate news items
  const { data: news } = await supabase
    .from("personalized_news")
    .select("*")
    .in("id", briefing.news_ids || [])
    .eq("is_active", true);

  // Preserve the scored ordering from news_ids
  const newsMap = (news || []).reduce((acc: any, n: any) => { acc[n.id] = n; return acc; }, {});
  const orderedNews = (briefing.news_ids || []).map((id: string) => newsMap[id]).filter(Boolean);

  // Hydrate company recommendations
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, slug, industry, civic_footprint_score, career_intelligence_score, lobbying_spend, state, category_tags")
    .in("id", briefing.company_rec_ids || []);

  return new Response(
    JSON.stringify({
      success: true,
      briefing: {
        date: briefing.briefing_date,
        generated_at: briefing.generated_at,
        top_values_matched: briefing.top_values_matched,
      },
      news: orderedNews,
      companies: companies || [],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ============================================================
// HELPER: Determine which user values most influenced ranking
// ============================================================
function determineTopValues(scoredNews: any[], userProfile: any): string[] {
  const userValues = userProfile.user_values || [];
  if (userValues.length === 0) return [];

  const valueCounts: Record<string, number> = {};

  for (const news of scoredNews) {
    const valueTags = news.value_tags || [];
    for (const tag of valueTags) {
      if (userValues.includes(tag)) {
        valueCounts[tag] = (valueCounts[tag] || 0) + 1;
      }
    }
  }

  return Object.entries(valueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}
