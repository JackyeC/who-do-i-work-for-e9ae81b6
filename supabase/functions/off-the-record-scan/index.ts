import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { resilientSearch } from "../_shared/resilient-search.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: "companyId and companyName required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check cache (7-day TTL)
    const { data: cached } = await supabase
      .from("social_media_scans")
      .select("results, ai_summary, created_at")
      .eq("company_id", companyId)
      .eq("scan_type", "off_the_record")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (cacheAge < SEVEN_DAYS && cached.results) {
        const themes = (cached.results as any)?.themes || [];
        return new Response(JSON.stringify({
          success: true,
          themes,
          insufficient: themes.length === 0,
          source: "cache",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    // Forum-targeted search queries
    const queries = [
      `site:reddit.com "${companyName}" (layoffs OR PIP OR culture OR RTO OR burnout OR interview)`,
      `site:teamblind.com OR site:fishbowlapp.com "${companyName}" (culture OR compensation OR management OR hiring freeze)`,
      `"${companyName}" employee review forum (toxic OR work-life balance OR leadership OR layoffs)`,
    ];

    const searchResponse = await resilientSearch(queries, firecrawlKey, lovableKey, {
      batchSize: 3,
      maxResultsPerQuery: 5,
    });

    const allContent = searchResponse.results
      .map(r => `[Source: ${r.title}]\n${r.description}\n${r.markdown}`.slice(0, 1500))
      .join("\n---\n")
      .slice(0, 12000);

    if (!allContent || allContent.length < 100) {
      // Store empty result to cache
      await supabase.from("social_media_scans").insert({
        company_id: companyId,
        scan_type: "off_the_record",
        query_used: queries.join(" | "),
        results: { themes: [] },
        ai_summary: "Insufficient public discussion found.",
        sources: searchResponse.results.map(r => ({ title: r.title, url: r.url })),
      });

      return new Response(JSON.stringify({
        success: true, themes: [], insufficient: true, source: searchResponse.source,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // LLM summarization via Lovable AI Gateway
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an employment intelligence analyst. You extract recurring discussion themes from public forum content about a specific company. Rules:
- Only return themes supported by at least 3 independent mentions
- Never assign "high" confidence — only "low" or "medium"
- Use professional, clean language — no slang, memes, or usernames
- Each theme must be recent (within the last 90 days preferred, 6 months max)
- If fewer than 3 independent mentions support any theme, return an empty array
- Return 2–4 themes maximum
- Be conservative — do not fabricate or overfit patterns
Return valid JSON only.`,
          },
          {
            role: "user",
            content: `Analyze the following public forum discussions about "${companyName}" and extract recurring themes.

${allContent}

Return a JSON array of themes. Each theme must have:
- "label": short clean title (e.g., "RTO frustration increasing")
- "summary": one professional sentence explaining the pattern
- "confidence": "low" or "medium" only
- "recency": "Last 30 days" or "Last 30–60 days" or "Last 60–90 days" or "Last 3–6 months"
- "mentionCount": approximate number of independent mentions (integer)
- "sentimentDirection": "negative" or "neutral" or "mixed"

If insufficient signal exists (fewer than 3 independent mentions for any theme), return [].
Return format: [{"label":"...","summary":"...","confidence":"...","recency":"...","mentionCount":0,"sentimentDirection":"..."}]`,
          },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: status === 429 ? "Rate limited" : "Payment required" }), {
          status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error(`[off-the-record-scan] AI gateway error: ${status}`);
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";

    let themes: any[] = [];
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (Array.isArray(parsed)) {
        themes = parsed
          .filter((t: any) => t.label && t.summary && (t.mentionCount || 0) >= 3)
          .slice(0, 4)
          .map((t: any) => ({
            label: t.label,
            summary: t.summary,
            confidence: t.confidence === "low" ? "low" : "medium",
            recency: t.recency || "Last 30–60 days",
            mentionCount: t.mentionCount || 3,
            sentimentDirection: t.sentimentDirection || "mixed",
          }));
      }
    } catch {
      console.error("[off-the-record-scan] Failed to parse AI response");
    }

    const sourceUrls = searchResponse.results
      .filter(r => r.url)
      .map(r => ({ title: r.title, url: r.url }))
      .slice(0, 10);

    // Cache results
    await supabase.from("social_media_scans").insert({
      company_id: companyId,
      scan_type: "off_the_record",
      query_used: queries.join(" | "),
      results: { themes, sourceUrls },
      ai_summary: themes.length > 0
        ? themes.map(t => `${t.label}: ${t.summary}`).join("; ")
        : "Insufficient public discussion found.",
      sources: sourceUrls,
    });

    return new Response(JSON.stringify({
      success: true,
      themes,
      insufficient: themes.length === 0,
      source: searchResponse.source,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("[off-the-record-scan] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
