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

/** Extract readable text from a PDF buffer using multiple strategies */
function extractPdfText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const textBlocks: string[] = [];

  // Strategy 1: BT/ET text objects with Tj/TJ operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    // Tj operator
    const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
    if (tjMatches) {
      for (const t of tjMatches) {
        const inner = t.match(/\(([^)]*)\)/);
        if (inner) textBlocks.push(inner[1]);
      }
    }
    // TJ array operator
    const tjArrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g);
    if (tjArrayMatches) {
      for (const t of tjArrayMatches) {
        const parts = t.match(/\(([^)]*)\)/g);
        if (parts) {
          for (const p of parts) {
            const inner = p.match(/\(([^)]*)\)/);
            if (inner) textBlocks.push(inner[1]);
          }
        }
      }
    }
  }

  if (textBlocks.length > 10) {
    return textBlocks.join(" ").replace(/\s+/g, " ").trim().slice(0, 30000);
  }

  // Strategy 2: Look for readable text in streams
  const streamParts = raw
    .split(/stream[\r\n]|endstream/)
    .filter(s => s.length > 50)
    .map(s => s.replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s+/g, " ").trim())
    .filter(s => s.length > 20 && /[a-zA-Z]{3,}/.test(s));

  if (streamParts.length > 0) {
    return streamParts.join(" ").slice(0, 30000);
  }

  // Strategy 3: Grab any readable ASCII from the whole file
  const readable = raw
    .replace(/[^\x20-\x7E\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Filter out PDF syntax noise
  const words = readable.split(" ").filter(w => 
    w.length > 2 && 
    !/^[0-9]+$/.test(w) && 
    !/^(obj|endobj|stream|endstream|xref|trailer|startxref)$/i.test(w)
  );

  return words.join(" ").slice(0, 30000);
}

/** OCR a PDF using Gemini vision when native extraction fails */
async function ocrPdfWithVision(buffer: ArrayBuffer, apiKey: string): Promise<string> {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  console.log("[analyze-offer-letter] Native extraction poor, falling back to Gemini OCR...");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract ALL text from this document exactly as written. Return only the extracted text, no commentary." },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error("[analyze-offer-letter] OCR API error:", res.status, await res.text());
    return "";
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

/** Extract readable text from a DOCX file */
function extractDocxText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4B) return "";
  
  const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const xmlMatches = rawText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (xmlMatches && xmlMatches.length > 0) {
    return xmlMatches
      .map(m => m.replace(/<[^>]+>/g, ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  return rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 20000);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contentType = req.headers.get("content-type") || "";
    let offerText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const text = formData.get("text") as string | null;

      if (file) {
        const buffer = await file.arrayBuffer();
        const name = file.name.toLowerCase();

        if (name.endsWith(".pdf")) {
          offerText = extractPdfText(buffer);
        } else if (name.endsWith(".docx")) {
          offerText = extractDocxText(buffer);
        } else if (name.endsWith(".txt") || name.endsWith(".rtf")) {
          offerText = new TextDecoder().decode(buffer).slice(0, 30000);
        } else {
          // Try as plain text
          offerText = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer))
            .replace(/[^\x20-\x7E\n\r\t]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 30000);
        }

        // Check if we got meaningful text — if not, try OCR via Gemini vision
        const wordCount = offerText.split(/\s+/).filter(w => w.length > 2).length;
        if (wordCount < 15) {
          console.log(`[analyze-offer-letter] Native extraction got ${wordCount} words, trying OCR...`);
          const ocrText = await ocrPdfWithVision(buffer, LOVABLE_API_KEY);
          const ocrWordCount = ocrText.split(/\s+/).filter(w => w.length > 2).length;
          if (ocrWordCount >= 15) {
            offerText = ocrText.slice(0, 30000);
            console.log(`[analyze-offer-letter] OCR extracted ${ocrWordCount} words`);
          } else {
            return new Response(
              JSON.stringify({
                error: "pdf_extraction_failed",
                message: "We couldn't extract text from this PDF even with OCR. It may be encrypted or corrupted. Please paste your offer text instead.",
              }),
              { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } else if (text) {
        offerText = text.trim();
      } else {
        throw new Error("No file or text provided");
      }
    } else {
      const body = await req.json();
      if (!body.text) throw new Error("No text provided");
      offerText = body.text.trim();
    }

    if (offerText.length < 30) {
      throw new Error("Offer text too short to analyze");
    }

    // Call Gemini via Lovable AI proxy
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this offer letter. Return ONLY the JSON analysis.\n\n---\n\n${offerText}`,
          },
        ],
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

    // Parse JSON from response
    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try to find a JSON object in the response
        const objMatch = raw.match(/\{[\s\S]*\}/);
        if (objMatch) {
          analysis = JSON.parse(objMatch[0]);
        } else {
          throw new Error("Could not parse AI response as JSON");
        }
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
