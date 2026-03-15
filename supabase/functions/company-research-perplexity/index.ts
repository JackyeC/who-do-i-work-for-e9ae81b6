/**
 * Company Research via Perplexity AI
 * 
 * Single-query, cost-optimized research for unknown companies.
 * Saves AI draft to pending_company_reviews for Jackye's approval.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");

    if (!perplexityKey) {
      return new Response(JSON.stringify({ error: "Perplexity API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userSb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user }, error: authErr } = await userSb.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { companyName, requesterNote } = await req.json();
    if (!companyName?.trim()) {
      return new Response(JSON.stringify({ error: "companyName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Check if already requested
    const { data: existing } = await sb
      .from("pending_company_reviews")
      .select("id, status, ai_summary")
      .eq("company_name", companyName.trim())
      .in("status", ["pending", "reviewing", "approved"])
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        reviewId: existing.id,
        status: existing.status,
        alreadyExists: true,
        summary: existing.ai_summary,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Single Perplexity query — cost-optimized
    const perplexityRes = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are an investigative corporate intelligence analyst. Return a structured analysis in exactly this format:

## Summary
[2-3 sentence overview of the company, industry, size, and HQ]

## Leadership & Board
[Key executives and board members with titles. Note any notable previous roles or affiliations]

## Political Activity & Donations
[PAC activity, executive donations, lobbying spend, trade association memberships. If none found, say "No political activity detected"]

## Controversies & Red Flags
[Lawsuits, regulatory actions, workplace complaints, scandals. If none found, say "No major controversies detected"]

Be factual, cite-worthy, and concise. Focus on information relevant to job seekers and employees.`,
          },
          {
            role: "user",
            content: `Research this company for our employer intelligence platform: "${companyName}". Include leadership, board of directors, corporate political donations, lobbying activity, and any workplace controversies or regulatory issues.`,
          },
        ],
        search_recency_filter: "year",
      }),
    });

    if (!perplexityRes.ok) {
      const errText = await perplexityRes.text();
      console.error("Perplexity error:", perplexityRes.status, errText);

      if (perplexityRes.status === 429) {
        return new Response(JSON.stringify({ error: "Research rate limit reached. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`Perplexity API error: ${perplexityRes.status}`);
    }

    const aiData = await perplexityRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const citations = aiData.citations || [];

    // Parse sections from the structured response
    const sections = {
      summary: extractSection(content, "Summary"),
      leadership: extractSection(content, "Leadership & Board"),
      political: extractSection(content, "Political Activity & Donations"),
      controversies: extractSection(content, "Controversies & Red Flags"),
    };

    // Save to pending reviews
    const { data: review, error: insertErr } = await sb
      .from("pending_company_reviews")
      .insert({
        company_name: companyName.trim(),
        requested_by: user.id,
        requester_email: user.email,
        requester_note: requesterNote || null,
        ai_summary: sections.summary || content,
        ai_leadership: sections.leadership,
        ai_political_activity: sections.political,
        ai_controversies: sections.controversies,
        ai_citations: citations,
        ai_model_used: "perplexity/sonar",
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      throw insertErr;
    }

    return new Response(JSON.stringify({
      success: true,
      reviewId: review.id,
      draft: {
        summary: sections.summary,
        leadership: sections.leadership,
        political: sections.political,
        controversies: sections.controversies,
        citations,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("company-research-perplexity error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractSection(content: string, heading: string): string | null {
  const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = content.match(regex);
  return match?.[1]?.trim() || null;
}
