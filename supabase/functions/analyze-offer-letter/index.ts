import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an offer letter analyst for WDIWF (Who Do I Work For?), a career intelligence platform.

Analyze the offer letter and return a JSON object with EXACTLY this shape:
{
  "company": "string — company name",
  "role": "string — job title",
  "summary": "string — 2-3 sentence plain-English summary of the offer's strengths and weaknesses",
  "red_flags": [{ "flag": "short label", "detail": "why this matters" }],
  "missing_terms": ["string — important terms not included in the offer"],
  "negotiate_these": [{ "item": "what to negotiate", "why": "leverage or reasoning" }],
  "green_flags": ["string — positive aspects of the offer"],
  "power_move": "string — one specific, actionable step the candidate should take before signing"
}

Rules:
- Be direct and specific. No corporate fluff.
- Red flags: look for non-competes, clawbacks, at-will gotchas, vague equity terms, below-market comp, missing benefits.
- Missing terms: PTO policy, severance, IP assignment scope, remote/hybrid clarity, bonus structure.
- Negotiate these: identify 2-3 items with real leverage.
- Green flags: acknowledge genuinely good terms.
- Power move: one concrete action (e.g., "Ask for the vesting schedule in writing before you sign").
- Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contentType = req.headers.get("content-type") || "";
    let userContent: any[];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (file) {
        // Send the file directly to Gemini as base64 — it handles PDF/DOCX natively
        const buffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(buffer).reduce((s, b) => s + String.fromCharCode(b), "")
        );

        const mimeType = file.type || getMimeFromName(file.name);

        userContent = [
          {
            type: "text",
            text: "Analyze this offer letter document. Extract all terms, compensation, benefits, and conditions. Return the analysis as JSON.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ];
      } else if (text) {
        userContent = [
          {
            type: "text",
            text: `Analyze this offer letter text. Extract all terms, compensation, benefits, and conditions. Return the analysis as JSON.\n\n---\n\n${text}`,
          },
        ];
      } else {
        throw new Error("No file or text provided");
      }
    } else {
      // JSON body fallback
      const body = await req.json();
      if (!body.text) throw new Error("No text provided");
      userContent = [
        {
          type: "text",
          text: `Analyze this offer letter text. Extract all terms, compensation, benefits, and conditions. Return the analysis as JSON.\n\n---\n\n${body.text}`,
        },
      ];
    }

    // Call Gemini via Lovable AI proxy
    const aiRes = await fetch("https://ai.lovable.dev/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[analyze-offer-letter] AI error:", aiRes.status, errText);
      throw new Error(`AI service error: ${aiRes.status}`);
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty AI response");

    // Parse and validate
    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        analysis = JSON.parse(match[1].trim());
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[analyze-offer-letter] Error:", e.message);
    return new Response(
      JSON.stringify({ error: e.message || "Analysis failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getMimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    rtf: "application/rtf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };
  return map[ext] || "application/octet-stream";
}
