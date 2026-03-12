import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth gate: verify the caller is a real logged-in user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage quota check
    const { createClient: createServiceClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const serviceClient = createServiceClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from("user_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("function_name", "translate-signals")
      .gte("used_at", since);
    const DAILY_LIMIT = 30;
    if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: "Daily usage limit reached. You can run up to " + DAILY_LIMIT + " signal translations per day." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { signals } = await req.json();
    if (!signals || !Array.isArray(signals) || signals.length === 0) {
      return new Response(JSON.stringify({ error: "No signals provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit to 20 signals per batch
    const batch = signals.slice(0, 20);
    const today = new Date().toISOString().split("T")[0];

    const prompt = `Today's date is ${today}.

I have ${batch.length} employer signals detected from public records. For each one, do two things:

1. **Translate** the technical signal into a plain-English sentence that a high school student would understand. Don't use jargon. Be specific about what was found.
2. **Verify freshness** — based on the scan_timestamp, is this actually recent (within the last 7 days)? If it's older than 7 days, flag it.

Here are the signals:
${batch.map((s: any, i: number) => `
Signal ${i + 1}:
- Company: ${s.companyName || "Unknown"}
- Category: ${s.signal_category}
- Type: ${s.signal_type}
- Value: ${s.signal_value || "none"}
- Scanned: ${s.scan_timestamp}
- Source: ${s.source_url || "none"}
`).join("")}

Return your analysis using the provided tool.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You translate technical corporate/political signals into plain English for everyday people. Be direct, specific, and honest. If a signal is stale or misleading, say so." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "signal_translations",
            description: "Return plain-English translations and freshness checks for each signal",
            parameters: {
              type: "object",
              properties: {
                translations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number", description: "0-based index matching the input signal" },
                      plain_summary: { type: "string", description: "1-2 sentence plain-English explanation of what this signal means for workers" },
                      is_fresh: { type: "boolean", description: "true if scanned within the last 7 days" },
                      freshness_note: { type: "string", description: "e.g. 'Detected 2 days ago' or 'This is 3 weeks old — may be outdated'" },
                    },
                    required: ["index", "plain_summary", "is_fresh", "freshness_note"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "signal_translations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI translation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned");

    const result = JSON.parse(toolCall.function.arguments);

    // Log usage
    await serviceClient.from("user_usage").insert({ user_id: user.id, function_name: "translate-signals" });

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("translate-signals error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
