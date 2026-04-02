import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * jackye-contextual-take
 * ─────────────────────────────────────────────
 * Generates contextual Jackye Clayton commentary for a specific
 * company section (insider_brief, structured_signals, accountability).
 *
 * Caches results in `jackye_contextual_takes` so we only call AI once
 * per company × section until the data changes.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName, section, signals } = await req.json();

    if (!companyId || !companyName || !section) {
      return new Response(
        JSON.stringify({ error: "companyId, companyName, and section required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Check cache ──
    const { data: cached } = await supabase
      .from("jackye_contextual_takes")
      .select("take_text, created_at")
      .eq("company_id", companyId)
      .eq("section_key", section)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      const ageHours = (Date.now() - new Date(cached.created_at).getTime()) / 3_600_000;
      if (ageHours < 72) {
        return new Response(
          JSON.stringify({ take: cached.take_text, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Build prompt ──
    const sectionPrompts: Record<string, string> = {
      insider_brief: `You're looking at the Insider Brief for ${companyName}. Key signals: ${JSON.stringify(signals || [])}. What should a smart candidate notice here? What pattern is emerging?`,
      structured_signals: `You're reviewing the structured signals for ${companyName}. Signals: ${JSON.stringify(signals || [])}. What's the real story behind these numbers? What should someone pay attention to before interviewing?`,
      accountability: `You're reviewing the Accountability Signals for ${companyName}. Signals: ${JSON.stringify(signals || [])}. What pattern should workers see? What does the documented record actually tell us about how power operates here?`,
    };

    const sectionPrompt = sectionPrompts[section] || sectionPrompts.insider_brief;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are Jackye Clayton, a talent acquisition expert and workplace intelligence analyst. Your voice is 'Facts Over Feelings + Controlled Side-Eye' — calm, sharp, slightly amused, grounded in observable behavior.

RULES:
- Maximum 3 sentences. Period.
- Structure: 1) What's happening (simple observation), 2) What it actually is (pointed pattern translation), 3) Why it matters (calm factual conclusion).
- No filler phrases like "the underlying labor signal indicates" or "This is not a strategy; it is..."
- No performative language. If it sounds like it's trying to impress, rewrite it as if telling the truth to a smart friend.
- No stereotyped or folksy vernacular (no "chile", "honey", etc.).
- No moral verdicts. Describe patterns, not people's character.
- Allegation ≠ conviction. Be precise about status.
- Write like a text message from someone who's seen everything and isn't surprised anymore, but still cares enough to tell you.`,
            },
            {
              role: "user",
              content: sectionPrompt,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again shortly" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const takeText = aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!takeText) {
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Cache the result ──
    await supabase.from("jackye_contextual_takes").upsert(
      {
        company_id: companyId,
        section_key: section,
        take_text: takeText,
        created_at: new Date().toISOString(),
      },
      { onConflict: "company_id,section_key" }
    );

    return new Response(
      JSON.stringify({ take: takeText, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("jackye-contextual-take error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
