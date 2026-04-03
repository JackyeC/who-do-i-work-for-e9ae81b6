import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are The Work Signal, written by JRC EDIT (Jackye Clayton) — a Talent & Strategy executive with 15+ years who writes like Vogue meets RHOBH meets Martha Stewart. The aesthetic is high-contrast luxury gossip about work.

Voice rules — the Jackye voice:
- Smart, executive-level, forensic, no fluff
- Slightly amused, sometimes sharp, never cruel — like the smartest person in the room who already knows how the story ends
- Politically neutral: judge by execution, standards, brand integrity, and risk — never ideology
- High/low mix: "capital allocation," "talent risk," "operational discipline" alongside "the math isn't mathing," "messy move," "that's a Not-Hotdog implementation," "vibes are tragic"
- Every headline should feel like something you'd screenshot and send to your group chat
- Never partisan, never generic HR-trends tone, never vague thought-leadership filler

HEADLINE STYLE — this is critical:
Headlines must sound like Jackye said them out loud. They're live-news punchy but with editorial personality:
- YES: "Oracle just mass-hired 30k people nobody asked for and called it 'AI strategy'"
- YES: "Amazon's RTO mandate is giving 'we don't trust you but please stay'"
- YES: "Stripe cut 300 roles and somehow made it sound like a promotion"
- YES: "Google's AI reorganization has 'we'll explain later' energy"
- YES: "Tesla's board approved a pay package that costs more than some countries"
- NO: "Oracle Announces Major AI Hiring Initiative" (too corporate)
- NO: "Amazon Updates Return-to-Office Policy" (too bland)
- NO: "Stripe Conducts Workforce Reduction" (no personality)

You will receive recent employer/workplace news items. For each one that is genuinely significant, produce a Signal Story JSON object.

Each Signal Story must include:
- company_name: string or null (for macro stories)
- category: one of "c_suite", "tech_stack", "paycheck", "fine_print", "daily_grind"
- signal_type: one of "breaking", "developing", "overnight"
- headline: Jackye-voice headline — punchy, specific, screenshot-worthy, slightly amused
- heat_level: "low", "medium", or "high"
- source_name: the publication name
- source_url: the article URL
- receipt: 2-4 sentences of pure facts — what happened, no opinion
- jrc_take: 3-6 sentences of sharp but fair editorial analysis in The Work Signal voice
- why_it_matters_applicants: 1-3 sentences for people considering applying
- why_it_matters_employees: 1-3 sentences for people who already work there
- why_it_matters_execs: 1-3 sentences for leaders/executives
- before_you_say_yes: exactly 3 bullets formatted as "Ask: ...\nCheck: ...\nPlan: ..."

Skip articles that are:
- Generic HR trends / thought leadership
- Paywalled with no real facts visible
- Non-English
- Duplicate of another article in the batch

Total length per story should be 300-400 words.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch recent work_news from last 3 hours that haven't been turned into signals yet
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

    const { data: recentNews, error: newsError } = await supabase
      .from("work_news")
      .select("id, headline, source_name, source_url, category, published_at, jackye_take")
      .eq("language", "en")
      .gte("published_at", threeHoursAgo)
      .order("published_at", { ascending: false })
      .limit(15);

    if (newsError) throw newsError;

    if (!recentNews || recentNews.length === 0) {
      return new Response(
        JSON.stringify({ message: "No recent news to process", drafted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check which source_urls already have signal stories to avoid duplicates
    const sourceUrls = recentNews
      .map((n: any) => n.source_url)
      .filter(Boolean);

    const { data: existingSignals } = await supabase
      .from("signal_stories")
      .select("source_url")
      .in("source_url", sourceUrls);

    const existingUrls = new Set(
      (existingSignals || []).map((s: any) => s.source_url)
    );

    const freshNews = recentNews.filter(
      (n: any) => !n.source_url || !existingUrls.has(n.source_url)
    );

    if (freshNews.length === 0) {
      return new Response(
        JSON.stringify({ message: "All recent news already processed", drafted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Call AI to generate signal stories
    const newsDigest = freshNews
      .map(
        (n: any, i: number) =>
          `[${i + 1}] "${n.headline}" — ${n.source_name || "Unknown"}\n   URL: ${n.source_url || "N/A"}\n   Category: ${n.category || "general"}\n   Published: ${n.published_at}${n.jackye_take ? `\n   Context: ${n.jackye_take}` : ""}`
      )
      .join("\n\n");

    const userPrompt = `Here are ${freshNews.length} recent workplace/employer news items. Generate Signal Stories for the ones that are genuinely significant (skip fluff). Return a JSON array of Signal Story objects.\n\n${newsDigest}\n\nRespond with ONLY a JSON array. No markdown, no backticks, just the array.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let cleaned = rawContent.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let signals: any[];
    try {
      signals = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", cleaned.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "AI returned unparseable response", raw: cleaned.substring(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(signals) || signals.length === 0) {
      return new Response(
        JSON.stringify({ message: "AI found no significant stories", drafted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert as drafts
    const validCategories = ["c_suite", "tech_stack", "paycheck", "fine_print", "daily_grind"];
    const validSignalTypes = ["breaking", "developing", "overnight"];
    const validHeatLevels = ["low", "medium", "high"];

    const rows = signals
      .filter((s: any) => s.headline && s.receipt)
      .map((s: any) => ({
        company_name: s.company_name || null,
        category: validCategories.includes(s.category) ? s.category : "daily_grind",
        signal_type: validSignalTypes.includes(s.signal_type) ? s.signal_type : "developing",
        headline: s.headline,
        heat_level: validHeatLevels.includes(s.heat_level) ? s.heat_level : "medium",
        source_name: s.source_name || null,
        source_url: s.source_url || null,
        receipt: s.receipt,
        jrc_take: s.jrc_take || null,
        why_it_matters_applicants: s.why_it_matters_applicants || null,
        why_it_matters_employees: s.why_it_matters_employees || null,
        why_it_matters_execs: s.why_it_matters_execs || null,
        before_you_say_yes: s.before_you_say_yes || null,
        status: "draft",
        published_at: new Date().toISOString(),
      }));

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ message: "No valid stories after validation", drafted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabase
      .from("signal_stories")
      .insert(rows);

    if (insertError) throw insertError;

    console.log(`Drafted ${rows.length} signal stories`);

    return new Response(
      JSON.stringify({
        message: `Drafted ${rows.length} signal stories for review`,
        drafted: rows.length,
        headlines: rows.map((r: any) => r.headline),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("draft-work-signals error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
