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

// ─── Exclusion patterns for irrelevant content ───
const EXCLUDE_PATTERNS = [
  /\b(NBA|NFL|NHL|MLB|FIFA|Premier League|Champions League|transfer|roster|draft pick|free agent signing|trade deadline)\b/i,
  /\b(video\s*game|gaming|PlayStation|Xbox|Nintendo|esports?|DLC|patch\s+notes)\b/i,
  /\b(Psychology\s+Today)\b/i,
  /\b(horoscope|zodiac|astrology)\b/i,
];
const EXCLUDE_DOMAINS = [
  "psychologytoday.com", "kotaku.com", "ign.com", "gamespot.com",
  "polygon.com", "pcgamer.com", "eurogamer.net",
  // Foreign-language domains — block at enrichment layer
  "watoday.com.au", "ibtimes.co.uk", "hcamag.com", "colombogazette.com",
  "demokraatti.fi", "di.se", "etnews.com", "sunstar.com.ph",
  "terra.com.br", "channelnewsasia.com",
  "g1.globo.com", "globo.com", "uol.com.br", "folha.uol.com.br",
  "lemonde.fr", "elpais.com", "spiegel.de", "corriere.it",
  "ideawebtv.it", "repubblica.it", "ilsole24ore.com",
  "lefigaro.fr", "welt.de", "bild.de", "nrc.nl", "dn.se",
  "dagensjuridik.se", "aftonbladet.se", "expressen.se",
  "tvn24.pl", "wp.pl", "onet.pl", "gazeta.pl",
  "ilfattoquotidiano.it", "ansa.it", "rainews.it",
  "rtve.es", "elmundo.es", "abc.es", "lavanguardia.com",
  "liberation.fr", "20minutes.fr", "francetvinfo.fr",
  "handelsblatt.com", "faz.net", "sueddeutsche.de", "zeit.de",
];

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
  // German connective gate
  const lower = headline.toLowerCase();
  const germanHits = (lower.match(/\b(der|die|das|und|für|mit|auf|ist|von|nicht)\b/g) || []).length;
  if (germanHits >= 4) return false;
  // Italian connective gate
  const italianHits = (lower.match(/\b(il|la|le|lo|di|del|della|dei|per|che|non|con|una|più|nel|sul)\b/g) || []).length;
  if (italianHits >= 4) return false;
  // Swedish/Polish/Nordic connective gate
  const nordicHits = (lower.match(/\b(och|att|det|för|som|med|har|kan|inte|vara|eller|från|efter|denna|till)\b/g) || []).length;
  if (nordicHits >= 3) return false;
  // Exclude irrelevant topics
  for (const p of EXCLUDE_PATTERNS) { if (p.test(headline)) return false; }
  return true;
}

function isExcludedSource(sourceUrl: string | null, sourceName: string | null): boolean {
  if (!sourceUrl && !sourceName) return false;
  const combined = `${sourceUrl ?? ""} ${sourceName ?? ""}`.toLowerCase();
  return EXCLUDE_DOMAINS.some(d => combined.includes(d));
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
  why_it_matters: [string, string];
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

const JACKYE_SYSTEM_PROMPT = `You are ghostwriting as Jackye Clayton. She just got a text from a friend: "Did you see this?" Your job is to text back — sharp, specific, and real.

VOICE RULES:
- Write like you're texting one smart person. Not performing for an audience.
- Maximum 3 sentences. If you can't say it in 3 with real specificity, cut it until you can.
- The reader should feel: "Oh. I didn't see it that way but now I can't unsee it." NOT: "This author has clearly done research."
- Start with the thing everyone sees. End with the thing they missed.
- If something is funny, be funny. If something is scary, be specific about who it hurts and how.

BANNED PHRASES — hard bans, zero exceptions:
- "the underlying labor signal indicates"
- "This is not a strategy; it is..."
- "systemic" used as filler (if you say systemic, name the system and what the failure costs a real person)
- "key stakeholders," "paradigm shift," "landscape," "ecosystem" (unless naming a literal dollar amount attached to that ecosystem)
- "chile," "honey," "baby," "mm-mm," "lord," "girl," "sis," "bestie," "boo"
- Any sentence that starts with "The headline frames this as..."
- Any sentence that starts with "However, the labor signal of..."

BANNED PATTERNS:
- Never explain what the article says. The reader already read the headline.
- Never praise the article's framing. Just say the thing.
- Never end with a vague "this matters because workers." Say which workers, how much money, what they lose.
- If the take sounds like a consultant wrote it, delete it and start over as if you're telling a friend what's actually going on.

GOOD TAKE EXAMPLES:
- "WordPress runs on volunteers. That agenda? Unpaid labor keeping an $800M ecosystem alive. Ask your next employer if their 'community' is doing any of the work they stopped hiring for."
- "They laid off 2,000 people and the stock went up 4%. That's the performance review that matters."
- "The severance package sounds generous until you read the non-compete. Six months of pay in exchange for not working in your own industry for two years. Do the math."

SPICE SCORING — be honest, not generous:
- 5 = Direct employer violation with documentation: settlement, mass layoff, WARN filing, discrimination ruling, EEOC finding
- 4 = Credible pattern: multiple reports, regulatory scrutiny, organized worker action, class action
- 3 = Sector-level risk or policy change with real employment impact on identifiable workers
- 2 = Adjacent context: market trends, economic indicators, adjacent industry shifts
- 1 = Background noise that's still genuinely relevant to US workers
- 0 = Should not be published. Foreign local news, sports trades, video games, geopolitics with no US labor connection
If you would score it 0, set spice_level to 0 and set jackye_take to empty string "".

WHY IT MATTERS — 2 bullets, specific to THIS story:
- Each bullet connects this specific story to something a candidate or employee can act on
- Rotate format: sometimes a question ("Ask your interviewer..."), sometimes a data point ("This is the 3rd time in 18 months..."), sometimes a warning ("Watch for this language in your offer letter...")
- NEVER use generic bullets like "Context is free. Not having it is expensive." or "The landscape shapes the offer."
- If you can swap in a different company name and the bullet still works, it's too generic. Rewrite it.`;

async function callAI(storyContext: string): Promise<JackyefiedContent> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error("LOVABLE_API_KEY environment variable is not set");
  }

  const prompt = `Given this workplace news story, generate a JSON response with exactly these fields:
- jackye_take: Maximum 3 sentences. Text-message energy — what's really going on and why it matters to someone with a job. If you can't write something specific and non-generic, return empty string "".
- debate_prompt: A polarizing yes/no question for audience voting
- debate_sides: Array of exactly 2 strings, each 1 sentence, punchy, opposing viewpoints
- receipt_connection: How this connects to money, power, or corporate accountability (1-2 sentences, specific amounts or entities)
- spice_level: Integer 0-5. Be honest. Most stories are a 2 or 3. Reserve 5 for documented violations. Score 0 if this story has no real US worker relevance.
- why_it_matters: Array of exactly 2 strings. Each is one specific, actionable bullet about THIS story. Rotate format: question, data point, or warning. Never generic.
- poster_data: Object with these exact fields:
  - bg: hex color for background
  - accent: hex color for accent
  - dark: hex color for dark text
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
        { role: "system", content: JACKYE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
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

  let jsonStr = content;
  if (content.includes("```json")) {
    jsonStr = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    jsonStr = content.split("```")[1].split("```")[0].trim();
  }

  const parsed = JSON.parse(jsonStr);

  // If AI scored 0, it shouldn't be published
  if (parsed.spice_level === 0 || !parsed.jackye_take) {
    parsed.spice_level = 0;
    parsed.jackye_take = "";
  }

  if (
    typeof parsed.jackye_take !== "string" ||
    !parsed.debate_prompt ||
    !Array.isArray(parsed.debate_sides) ||
    parsed.debate_sides.length !== 2 ||
    !parsed.receipt_connection ||
    typeof parsed.spice_level !== "number" ||
    !parsed.poster_data
  ) {
    throw new Error("AI response missing required fields");
  }

  // Ensure why_it_matters is always an array of 2
  if (!Array.isArray(parsed.why_it_matters) || parsed.why_it_matters.length < 2) {
    parsed.why_it_matters = [
      parsed.why_it_matters?.[0] || "Check the company's public filings before your next interview.",
      parsed.why_it_matters?.[1] || "This story connects to patterns worth tracking.",
    ];
  }

  return parsed as JackyefiedContent;
}

async function processStories(
  supabase: ReturnType<typeof createClient>,
  stories: WorkNewsStory[]
): Promise<{ processed: number; skipped: number }> {
  console.log(`Processing ${stories.length} stories for Jackye-fication`);
  let processed = 0;
  let skipped = 0;

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

      // Skip stories that AI scored as irrelevant
      if (jackyefied.spice_level === 0 || !jackyefied.jackye_take) {
        console.log(`⊘ Skipped (irrelevant): ${story.id} — "${story.headline.substring(0, 40)}"`);
        // Mark it so we don't re-process
        await supabase
          .from("work_news")
          .update({
            jackye_take: "[FILTERED]",
            jackye_take_approved: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", story.id);
        skipped++;
        continue;
      }

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
          why_it_matters: jackyefied.why_it_matters,
          poster_data: jackyefied.poster_data,
          created_at: new Date().toISOString(),
        });

      if (insertErr) {
        console.error(`Failed to insert into receipts_enriched for ${story.id}:`, insertErr);
        continue;
      }

      console.log(`✓ Jackye-fied (spice ${jackyefied.spice_level}): ${story.id}`);
      processed++;
    } catch (error) {
      console.error(`Error processing story ${story.id}:`, error);
      continue;
    }
  }

  return { processed, skipped };
}

Deno.serve(async (req: Request) => {
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
      return new Response(
        JSON.stringify({ success: true, processed: 0, skipped: 0, message: "No stories to process" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pre-filter: English, relevant, not excluded source
    const filteredStories = (stories as WorkNewsStory[]).filter(s =>
      isEnglishAndRelevant(s.headline) && !isExcludedSource(s.source_url, s.source_name)
    );
    console.log(`Pre-filtered ${stories.length} → ${filteredStories.length} stories`);

    // Mark rejected stories so we don't re-process
    const rejectedIds = (stories as WorkNewsStory[])
      .filter(s => !filteredStories.includes(s))
      .map(s => s.id);
    if (rejectedIds.length > 0) {
      await supabase
        .from("work_news")
        .update({ jackye_take: "[FILTERED]", updated_at: new Date().toISOString() })
        .in("id", rejectedIds);
      console.log(`Marked ${rejectedIds.length} stories as [FILTERED]`);
    }

    if (filteredStories.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, skipped: rejectedIds.length, message: "No relevant stories after filtering" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await processStories(supabase, filteredStories);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        prefiltered: rejectedIds.length,
        message: `Processed ${result.processed}, skipped ${result.skipped}, pre-filtered ${rejectedIds.length}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in jackyefy-news function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
