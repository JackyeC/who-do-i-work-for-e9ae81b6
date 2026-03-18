import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchGooglePatents(companyName: string): Promise<{ titles: string[]; links: string[]; patentIds: string[] }> {
  const query = encodeURIComponent(`"${companyName}"`);
  try {
    const response = await fetch(`https://patents.google.com/?q=${query}&oq=${query}&num=50`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
    });
    const html = await response.text();

    const titleRegex = /<span class="style-scope search-result-item" id="htmlContent">(.*?)<\/span>/g;
    const resultRegex = /data-result="(.*?)"/g;

    const titles: string[] = [];
    const links: string[] = [];
    const patentIds: string[] = [];
    let match;

    while ((match = titleRegex.exec(html)) !== null && titles.length < 50) {
      const title = match[1].replace(/<[^>]*>/g, '').trim();
      if (title && title.length > 5) titles.push(title);
    }

    while ((match = resultRegex.exec(html)) !== null && links.length < 50) {
      const id = match[1];
      patentIds.push(id);
      links.push(`https://patents.google.com/patent/${id}`);
    }

    return { titles, links, patentIds };
  } catch (error) {
    console.error("Google Patents scrape error:", error);
    return { titles: [], links: [], patentIds: [] };
  }
}

function categorizePatent(title: string): string {
  const t = title.toLowerCase();
  if (/artificial intelligence|machine learning|neural network|deep learning|nlp|natural language/i.test(t)) return "AI & Machine Learning";
  if (/blockchain|distributed ledger|crypto/i.test(t)) return "Blockchain";
  if (/autonomous|self.?driving|lidar|vehicle/i.test(t)) return "Autonomous Systems";
  if (/cloud|serverless|container|kubernetes/i.test(t)) return "Cloud Computing";
  if (/security|encryption|authentication|cyber/i.test(t)) return "Cybersecurity";
  if (/health|medical|pharma|therapeutic|diagnostic/i.test(t)) return "Healthcare";
  if (/battery|solar|energy|renewable/i.test(t)) return "Energy & Sustainability";
  if (/display|screen|user interface|gui/i.test(t)) return "User Interface";
  if (/wireless|5g|antenna|signal/i.test(t)) return "Communications";
  if (/semiconductor|chip|processor|transistor/i.test(t)) return "Semiconductors";
  return "Other";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, companyName } = await req.json();
    if (!companyId || !companyName) {
      return new Response(JSON.stringify({ error: "companyId and companyName required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check freshness — skip if we fetched in last 7 days
    const { data: existing } = await supabase
      .from("company_patents")
      .select("id, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing?.length) {
      const lastFetch = new Date(existing[0].created_at);
      const daysSince = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        return new Response(JSON.stringify({ success: true, cached: true, message: "Patent data is fresh" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Searching Google Patents for: ${companyName}`);

    // Search Google Patents (no API key needed)
    let { titles, links, patentIds } = await searchGooglePatents(companyName);

    // Retry with simplified name if no results
    if (titles.length === 0) {
      const simpleName = companyName.replace(/,?\s*(Inc\.?|Corp\.?|LLC|Ltd\.?|Company|Co\.)$/i, '').trim();
      if (simpleName !== companyName) {
        console.log(`Retrying with simplified name: ${simpleName}`);
        const retry = await searchGooglePatents(simpleName);
        titles = retry.titles;
        links = retry.links;
        patentIds = retry.patentIds;
      }
    }

    if (titles.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, message: "No patents found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build rows for upsert
    const rows = titles.map((title, i) => ({
      company_id: companyId,
      patent_number: patentIds[i] || `GP-${Date.now()}-${i}`,
      title,
      abstract: null,
      filing_date: null,
      grant_date: null,
      patent_type: "utility",
      category: categorizePatent(title),
      inventors: [],
      assignee_name: companyName,
      source_url: links[i] || null,
      source: "google_patents",
      confidence: "Medium",
    }));

    const { error: upsertError } = await supabase
      .from("company_patents")
      .upsert(rows, { onConflict: "company_id,patent_number" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw upsertError;
    }

    console.log(`Stored ${rows.length} patents for ${companyName}`);

    return new Response(JSON.stringify({ success: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Patent scan error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
