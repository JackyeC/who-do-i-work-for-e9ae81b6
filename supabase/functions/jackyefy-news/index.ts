import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
// ─── Content quality gates ───
const NON_LATIN_RE = /[\u0400-\u04FF\u0500-\u052F\u0600-\u06FF\u0750-\u077F\u0590-\u05FF\u0900-\u097F\u0980-\u09FF\u0E00-\u0E7F\u1100-\u11FF\u3000-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u10A0-\u10FF\u0530-\u058F]/;
const ROMANCE_MARKERS = [
  /\b(país|empregos?|brasileiros?|trabalho|governo|milhares|milhões|promete|saem|vistos?|semanas?)\b/gi,
  /\b(según|también|durante|gobierno|trabajo|empleos?|millones|pueden|después|mientras)\b/gi,
  /\b(aussi|gouvernement|travail|emplois?|nouveau|peuvent|après|pendant|depuis|cette)\b/gi,
];
const FOREIGN_LIFESTYLE_RE = /\b(visa[s]?\s+(that|which|para|pour)|jobs?\s+abroad|work\s+abroad|move\s+to\s+(europe|portugal|spain|bali|dubai)|digital\s+nomad|expat\s+(life|jobs))\b/i;

function isEnglishAndRelevant(headline: string): boolean {
  if (!headline || headline.length < 3) return false;
  if (NON_LATIN_RE.test(headline)) return false;
  const slavic = headline.match(/[łąęśźżćńřůțșđ]/gi);
  if (slavic && slavic.length >= 2) return false;
  const ext = headline.match(/[\u00C0-\u024F]/g);
  if (ext && ext.length / headline.length > 0.06) return false;
  const ascii = headline.match(/[\x20-\x7E]/g);
  if (!ascii || ascii.length / headline.length < 0.75) return false;
  let romanceHits = 0;
  for (const p of ROMANCE_MARKERS) { const m = headline.match(p); if (m) romanceHits += m.length; }
  if (romanceHits >= 3) return false;
  if (FOREIGN_LIFESTYLE_RE.test(headline)) return false;
  return true;
}

interface WorkNewsStory {
  id: string;
  headline: string;
  source_name: string;
  source_url: string;
  published_at: string;
  sentiment_score: number;
  tone_label: string;
  themes: string[];
  category: string;
  is_controversy: boolean;
  controversy_type: string | null;
}

interface JackyefiedContent {
  jackye_take: string;
  debate_prompt: string;
  debate_sides: [string, string];
  receipt_connection: string;
  spice_level: number;
  poster_data: {
    bg: string;
    accent: string;
    dark: string;
    emoji: string;
    bigTxt: string;
    sub: string;
    tag: string;
    copy: string;
    fine: string;
  };
}

const JACKYE_SYSTEM_PROMPT = `You are ghostwriting as Jackye Clayton — someone who pays attention, checks receipts, and isn't easily impressed.

VOICE:
- Start with what people see. Then say what it actually is. No warm-up. No over-explaining.
- The tone is calm, sharp, and slightly amused. Light snark and side-eye, but controlled and intentional.
- Use short sentences. Let lines breathe. Some thoughts should stand alone.
- Prioritize facts, patterns, and observable behavior over opinions. Show what's happening and what it means. Let the reader connect the rest.
- Assume the reader is smart. You are not educating them. You are confirming what they already suspected.

STRUCTURE for every take:
1. What's happening (simple, real-world)
2. What it actually is (clear, slightly pointed)
3. Why it matters (calm, factual, no theatrics)

TONE GUARDRAILS:
- Confident, not loud
- Slightly amused, not cruel
- Direct, not dramatic
- "I'm not pressed… I just have eyes."
- You can lightly call things out: "Yeah… that's not what this is." / "We've seen this before." / "That part matters more than they're saying." / "Facts are doing the heavy lifting here."
- You can use dry humor to deflate drama: "Respectfully… did you die?" / "This is inconvenient, not catastrophic." / "Let's bring the volume down and look at what actually happened."
- Do not rant. Do not exaggerate. Stay grounded.

ABSOLUTE BANS — never use these words or patterns:
- "chile," "honey," "baby," "mm-mm," "lord," "girl," "sis," "bestie," "boo"
- Any faux-folksy, meme-account, or stereotyped vernacular
- Academic/consultant language: "underlying signal," "systemic breakdown," "key stakeholders," "paradigm shift"
- If it sounds like a report, rewrite it. If it sounds like a caricature, delete it.
- If the tone sounds like it's trying to impress someone, rewrite it like you're telling the truth to a smart friend who asked you what's really going on.

Spice levels: 1=worth noting, 2=worth watching, 3=worth documenting, 4=directly affects your employment, 5=they structured this so you wouldn't find it.`;

async function callAI(storyContext: string): Promise<JackyefiedContent> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error("LOVABLE_API_KEY environment variable is not set");
  }

  const prompt = `Given this workplace news story, generate a JSON response with exactly these fields:
- jackye_take: Write 2-4 short sentences. Start with what people see, then what it actually is. Calm, sharp, slightly amused. Facts over feelings. Use dry humor sparingly to deflate drama. Do not rant or exaggerate. If the tone sounds like it's trying to impress someone, rewrite it like you're telling the truth to a smart friend. Never use slang, folksy language, consultant-speak, or stereotyped vernacular.
- debate_prompt: A polarizing yes/no question for audience voting
- debate_sides: Array of exactly 2 strings, each 1 sentence, punchy, opposing viewpoints
- receipt_connection: How this connects to money, power, or corporate accountability (1-2 sentences, analytical tone)
- spice_level: Integer 1-5 (1=worth noting, 2=worth watching, 3=worth documenting, 4=directly affects employment, 5=structured so you wouldn't find it)
- poster_data: Object with these exact fields:
  - bg: hex color for background (e.g. "#FF6B6B")
  - accent: hex color for accent (e.g. "#4ECDC4")
  - dark: hex color for dark text (e.g. "#2C3E50")
  - emoji: single relevant emoji
  - bigTxt: 1-2 word punchy headline
  - sub: short subheader (3-5 words)
  - tag: concise analytical label (3-4 words)
  - copy: sharp editorial tagline (5-10 words, no slang)
  - fine: asterisk disclaimer (5-10 words starting with *)

Story: ${storyContext}

Return ONLY valid JSON, no markdown or explanation.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: JACKYE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.85,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = content;
  if (content.includes("```json")) {
    jsonStr = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    jsonStr = content.split("```")[1].split("```")[0].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // Validate required fields
  if (
    !parsed.jackye_take ||
    !parsed.debate_prompt ||
    !Array.isArray(parsed.debate_sides) ||
    parsed.debate_sides.length !== 2 ||
    !parsed.receipt_connection ||
    !parsed.spice_level ||
    !parsed.poster_data
  ) {
    throw new Error("AI response missing required fields");
  }

  return parsed as JackyefiedContent;
}

async function processStories(
  supabase: ReturnType<typeof createClient>,
  stories: WorkNewsStory[]
): Promise<void> {
  console.log(`Processing ${stories.length} stories for Jackye-fication`);

  for (const story of stories) {
    try {
      console.log(`Jackye-fying: "${story.headline.substring(0, 60)}..."`);

      const storyContext = `
Headline: ${story.headline}
Source: ${story.source_name}
URL: ${story.source_url}
Category: ${story.category}
Tone: ${story.tone_label}
Themes: ${story.themes.join(", ")}
Is Controversy: ${story.is_controversy}
${story.controversy_type ? `Controversy Type: ${story.controversy_type}` : ""}
Sentiment Score: ${story.sentiment_score}
`;

      const jackyefied = await callAI(storyContext);

      // Update work_news with jackye_take
      const { error: updateErr } = await supabase
        .from("work_news")
        .update({
          jackye_take: jackyefied.jackye_take,
          jackye_take_approved: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", story.id);

      if (updateErr) {
        console.error(`Failed to update work_news ${story.id}:`, updateErr);
        continue;
      }

      // Insert into receipts_enriched
      const { error: insertErr } = await supabase
        .from("receipts_enriched")
        .insert({
          work_news_id: story.id,
          headline: story.headline,
          source_name: story.source_name,
          source_url: story.source_url,
          published_at: story.published_at,
          sentiment_score: story.sentiment_score,
          tone_label: story.tone_label,
          themes: story.themes,
          category: story.category,
          is_controversy: story.is_controversy,
          controversy_type: story.controversy_type,
          jackye_take: jackyefied.jackye_take,
          debate_prompt: jackyefied.debate_prompt,
          debate_sides: jackyefied.debate_sides,
          receipt_connection: jackyefied.receipt_connection,
          spice_level: jackyefied.spice_level,
          poster_data: jackyefied.poster_data,
          created_at: new Date().toISOString(),
        });

      if (insertErr) {
        console.error(`Failed to insert into receipts_enriched for ${story.id}:`, insertErr);
        continue;
      }

      console.log(`✓ Jackye-fied: ${story.id}`);
    } catch (error) {
      console.error(`Error processing story ${story.id}:`, error);
      continue;
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query work_news for stories without jackye_take
    const { data: stories, error: queryErr } = await supabase
      .from("work_news")
      .select(
        "id, headline, source_name, source_url, published_at, sentiment_score, tone_label, themes, category, is_controversy, controversy_type"
      )
      .is("jackye_take", null)
      .order("published_at", { ascending: false })
      .limit(25);

    if (queryErr) {
      throw new Error(`Failed to query work_news: ${queryErr.message}`);
    }

    if (!stories || stories.length === 0) {
      console.log("No stories to Jackye-fy");
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No stories to process" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Filter to English-only, US/AI-relevant stories before AI processing
    const filteredStories = (stories as WorkNewsStory[]).filter(s => isEnglishAndRelevant(s.headline));
    console.log(`Filtered ${stories.length} → ${filteredStories.length} stories (English + relevant)`);

    if (filteredStories.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No English/relevant stories to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await processStories(supabase, filteredStories);

    return new Response(
      JSON.stringify({
        success: true,
        processed: stories.length,
        message: `Jackye-fied ${stories.length} stories`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in jackyefy-news function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
