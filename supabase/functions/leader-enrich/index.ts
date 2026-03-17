import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

import { resilientSearch } from "../_shared/resilient-search.ts";

async function findHeadshot(name: string, company: string, firecrawlKey: string): Promise<string | null> {
  try {
    const query = `${name} ${company} headshot portrait photo`;
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        limit: 5,
        lang: "en",
        country: "us",
        scrapeOptions: { formats: ["links"] },
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const results = data.data || [];
    for (const r of results) {
      const links: string[] = r.links || [];
      for (const link of links) {
        if (/\.(jpg|jpeg|png|webp)/i.test(link) && !/logo|icon|banner|favicon/i.test(link)) {
          return link;
        }
      }
      if (r.url && /\.(jpg|jpeg|png|webp)/i.test(r.url)) {
        return r.url;
      }
    }
  } catch (e) {
    console.error("Headshot search error:", e);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth gate: require service-role key
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  if (token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { leader_id, leader_type, leader_name, leader_title, company_id, company_name, company_industry } = await req.json();

    if (!leader_id || !leader_name) {
      return new Response(JSON.stringify({ error: "leader_id and leader_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check cache (enriched in last 30 days)
    const { data: existing } = await supabase
      .from("leader_enrichments")
      .select("*")
      .eq("leader_id", leader_id)
      .eq("leader_type", leader_type || "executive")
      .maybeSingle();

    if (existing && existing.enriched_at) {
      const age = Date.now() - new Date(existing.enriched_at).getTime();
      if (age < 30 * 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ enrichment: existing, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parallel: scrape bio data + search for headshot
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    let scrapedBio = "";
    let photoUrl: string | null = null;

    // Bio search via resilientSearch (works with or without Firecrawl)
    const bioQueries = [`${leader_name} ${company_name || ""} executive leadership biography`];
    const [bioSearchResult, headshot] = await Promise.all([
      resilientSearch(bioQueries, FIRECRAWL_API_KEY, LOVABLE_API_KEY),
      FIRECRAWL_API_KEY ? findHeadshot(leader_name, company_name || "", FIRECRAWL_API_KEY) : Promise.resolve(null),
    ]);

    for (const r of bioSearchResult.results) {
      if (r.markdown && r.markdown.length > 100) {
        scrapedBio += r.markdown.slice(0, 2000) + "\n\n";
      }
    }
    scrapedBio = scrapedBio.slice(0, 4000);
    photoUrl = headshot;

    // AI dossier generation
    const aiPrompt = `You are an intelligence analyst creating a leader dossier for a career intelligence platform.

LEADER: ${leader_name}
TITLE: ${leader_title || "Unknown"}
COMPANY (raw): ${company_name || "Unknown"}
INDUSTRY: ${company_industry || "Unknown"}

${scrapedBio ? `SCRAPED PUBLIC INFORMATION:\n${scrapedBio}` : "No scraped data available."}

Generate a comprehensive leader intelligence brief. Return JSON with these exact fields:
{
  "normalized_company_name": "The correct, clean company name (e.g., 'Home Depot (DB)' should be 'The Home Depot', 'AMAZON COM INC' should be 'Amazon')",
  "bio": "A 2-3 sentence professional biography",
  "education": "Known education background or 'Not publicly available'",
  "career_highlights": ["Array of 3-5 key career milestones or notable facts"],
  "ai_narrative": "A 3-4 paragraph intelligence narrative covering: 1) Professional background and rise to current role, 2) Strategic significance of their position, 3) Notable patterns in their public activity (donations, board seats, etc), 4) What job seekers and stakeholders should know about this leader's influence"
}

Be factual. If information is uncertain, say so. Never fabricate specific dates, numbers, or credentials that aren't supported by the data.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a corporate intelligence analyst. Return only valid JSON, no markdown fences." },
          { role: "user", content: aiPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_leader_dossier",
              description: "Create a structured leader intelligence dossier",
              parameters: {
                type: "object",
                properties: {
                  normalized_company_name: { type: "string" },
                  bio: { type: "string" },
                  education: { type: "string" },
                  career_highlights: { type: "array", items: { type: "string" } },
                  ai_narrative: { type: "string" },
                },
                required: ["normalized_company_name", "bio", "education", "career_highlights", "ai_narrative"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_leader_dossier" } },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      console.error("AI error:", status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    let dossier: any;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      dossier = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        dossier = JSON.parse(content.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      } catch {
        console.error("Failed to parse AI response:", content);
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Upsert enrichment
    const enrichment = {
      leader_id,
      leader_type: leader_type || "executive",
      company_id: company_id || null,
      normalized_company_name: dossier.normalized_company_name,
      bio: dossier.bio,
      education: dossier.education,
      career_highlights: dossier.career_highlights || [],
      ai_narrative: dossier.ai_narrative,
      photo_url: photoUrl,
      enrichment_source: scrapedBio ? "firecrawl+ai" : "ai",
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: upserted, error: upsertErr } = await supabase
      .from("leader_enrichments")
      .upsert(enrichment, { onConflict: "leader_id,leader_type" })
      .select()
      .single();

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return new Response(JSON.stringify({ error: "Failed to save enrichment" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also update the leader's photo_url if we found one and they don't have one
    if (photoUrl) {
      const table = leader_type === "board_member" ? "board_members" : "company_executives";
      await supabase.from(table).update({ photo_url: photoUrl }).eq("id", leader_id).is("photo_url", null);
    }

    return new Response(JSON.stringify({ enrichment: upserted, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("leader-enrich error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
