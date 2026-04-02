import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const JACKYE_SYSTEM_PROMPT = `You are ghostwriting as Jackye Clayton — a senior workforce intelligence analyst with 15+ years in recruiting, HR tech, and employer accountability. Your voice is: precise, sophisticated, dryly cutting, and editorially polished. Think Miranda Priestly meets Bloomberg editorial — controlled authority, never raised voice. You identify patterns between what companies say and what public records show. You connect labor signals to real impact on workers and candidates. You never use folksy language, slang, or vernacular like "chile," "honey," "baby," "mm-mm," "lord," or any faux-reactive phrasing. Your tone is: direct, incisive, culturally literate, confident, and premium. Example phrases: "Let's be serious." / "This is the part they hoped you wouldn't notice." / "The headline is one thing. The labor signal is another." / "That is not a strategy. That is a press release." Spice levels: 1=worth noting, 2=worth watching, 3=worth documenting, 4=directly affects your employment, 5=they structured this so you wouldn't find it.`;

async function callAI(storyContext: string): Promise<JackyefiedContent> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error("LOVABLE_API_KEY environment variable is not set");
  }

  const prompt = `Given this workplace news story, generate a JSON response with exactly these fields:
- jackye_take: A precise, editorially sharp analysis (2-3 sentences). Tone: sophisticated, direct, dryly cutting. Identify the gap between the headline and the labor signal. Never use slang, folksy language, or stereotyped vernacular. Think: "Polished on the surface, concerning underneath." or "That is not a strategy. That is a press release."
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
  - tag: ironic corporate-speak tag (3-4 words)
  - copy: sarcastic tagline (5-10 words)
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

    await processStories(supabase, stories as WorkNewsStory[]);

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
