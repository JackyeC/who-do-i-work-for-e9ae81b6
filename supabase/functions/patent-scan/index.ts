import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function searchGooglePatents(companyName: string): Promise<{ totalResults: number; titles: string[]; links: string[] }> {
  // Use Google Patents search via SerpAPI-style scrape of the public search page
  const query = encodeURIComponent(`"${companyName}" assignee:"${companyName}"`);
  const url = `https://patents.google.com/xhr/query?url=q%3D${query}&exp=&tags=`;

  try {
    const response = await fetch(`https://patents.google.com/?q=${query}&oq=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CivicLens/1.0)',
        'Accept': 'text/html',
      },
    });

    const html = await response.text();

    // Extract patent titles from search results HTML
    const titleRegex = /<span class="style-scope search-result-item" id="htmlContent">(.*?)<\/span>/g;
    const linkRegex = /data-result="(.*?)"/g;
    const countRegex = /About ([\d,]+) results/;

    const titles: string[] = [];
    const links: string[] = [];
    let match;

    while ((match = titleRegex.exec(html)) !== null && titles.length < 10) {
      const title = match[1].replace(/<[^>]*>/g, '').trim();
      if (title && title.length > 5) titles.push(title);
    }

    while ((match = linkRegex.exec(html)) !== null && links.length < 10) {
      links.push(`https://patents.google.com/patent/${match[1]}`);
    }

    const countMatch = countRegex.exec(html);
    const totalResults = countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : titles.length;

    return { totalResults, titles: titles.slice(0, 10), links: links.slice(0, 10) };
  } catch (error) {
    console.error("Google Patents scrape error:", error);
    // Fallback: try a simpler approach
    return { totalResults: 0, titles: [], links: [] };
  }
}

async function categorizeWithLLM(companyName: string, patentTitles: string[]): Promise<Array<{ theme: string; count: number; examples: string[] }>> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || patentTitles.length === 0) return [];

  const prompt = `You are an innovation analyst. Given the following patent titles from "${companyName}", categorize them into Innovation Clusters.

Patent titles:
${patentTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return a JSON array of clusters. Each cluster should have:
- "theme": A concise innovation category name (e.g., "Artificial Intelligence", "Biotech", "Supply Chain", "Data Analytics", "Consumer Tech", "Materials Science")
- "count": Number of patents in this cluster
- "examples": Array of the patent titles that belong to this cluster

Group related patents together. Use clear, business-friendly category names. Return ONLY the JSON array, no other text.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an innovation analyst. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const clusters = JSON.parse(jsonMatch[0]);
    return clusters;
  } catch (error) {
    console.error("LLM categorization error:", error);
    // Fallback: put all in one cluster
    return [{
      theme: "General Innovation",
      count: patentTitles.length,
      examples: patentTitles.slice(0, 5),
    }];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();

    if (!companyName) {
      return new Response(
        JSON.stringify({ error: "Missing companyName" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching patents for: ${companyName}`);

    // Step 1: Search Google Patents
    const { totalResults, titles, links } = await searchGooglePatents(companyName);

    if (titles.length === 0) {
      // Try simplified company name
      const simpleName = companyName.replace(/,?\s*(Inc\.?|Corp\.?|LLC|Ltd\.?|Company|Co\.)$/i, '').trim();
      const retry = await searchGooglePatents(simpleName);

      if (retry.titles.length === 0) {
        return new Response(
          JSON.stringify({
            totalResults: 0,
            clusters: [],
            topPatents: [],
            message: "No patents found for this company.",
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use retry results
      const clusters = await categorizeWithLLM(simpleName, retry.titles);
      return new Response(
        JSON.stringify({
          totalResults: retry.totalResults,
          clusters,
          topPatents: retry.titles.map((t, i) => ({ title: t, url: retry.links[i] || null })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Categorize with LLM
    const clusters = await categorizeWithLLM(companyName, titles);

    return new Response(
      JSON.stringify({
        totalResults,
        clusters,
        topPatents: titles.map((t, i) => ({ title: t, url: links[i] || null })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Patent scan error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
