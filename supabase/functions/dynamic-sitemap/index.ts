import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_URL = "https://wdiwf.jackyeclayton.com";
const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=7200",
  "Access-Control-Allow-Origin": "*",
};

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: "/", priority: "1.0", freq: "weekly" },
  { path: "/browse", priority: "0.9", freq: "daily" },
  { path: "/check", priority: "0.9", freq: "weekly" },
  { path: "/search", priority: "0.8", freq: "daily" },
  { path: "/ask-jackye", priority: "0.8", freq: "weekly" },
  { path: "/would-you-work-here", priority: "0.9", freq: "weekly" },
  { path: "/strategic-offer-review", priority: "0.8", freq: "weekly" },
  { path: "/offer-clarity", priority: "0.8", freq: "weekly" },
  { path: "/compare", priority: "0.8", freq: "weekly" },
  { path: "/compare-offer-checks", priority: "0.7", freq: "weekly" },
  { path: "/employer-receipt", priority: "0.8", freq: "weekly" },
  { path: "/evp-reality-check", priority: "0.7", freq: "weekly" },
  { path: "/what-am-i-supporting", priority: "0.7", freq: "weekly" },
  { path: "/values-search", priority: "0.7", freq: "weekly" },
  { path: "/policy", priority: "0.7", freq: "weekly" },
  { path: "/economy", priority: "0.7", freq: "weekly" },
  { path: "/follow-the-money", priority: "0.8", freq: "weekly" },
  { path: "/board-intelligence", priority: "0.7", freq: "weekly" },
  { path: "/intelligence-chain", priority: "0.6", freq: "weekly" },
  { path: "/investigative", priority: "0.7", freq: "weekly" },
  { path: "/intelligence", priority: "0.8", freq: "weekly" },
  { path: "/signals", priority: "0.7", freq: "daily" },
  { path: "/rivalries", priority: "0.6", freq: "weekly" },
  { path: "/brand-madness", priority: "0.6", freq: "weekly" },
  { path: "/rankings", priority: "0.7", freq: "weekly" },
  { path: "/pricing", priority: "0.7", freq: "monthly" },
  { path: "/methodology", priority: "0.6", freq: "monthly" },
  { path: "/work-with-jackye", priority: "0.7", freq: "monthly" },
  { path: "/recruiting", priority: "0.6", freq: "monthly" },
  { path: "/jobs", priority: "0.7", freq: "daily" },
  { path: "/workforce-brief", priority: "0.7", freq: "daily" },
  { path: "/for-employers", priority: "0.7", freq: "monthly" },
  { path: "/demo", priority: "0.6", freq: "monthly" },
  { path: "/request-correction", priority: "0.4", freq: "monthly" },
  { path: "/add-company", priority: "0.5", freq: "monthly" },
  { path: "/search-your-employer", priority: "0.7", freq: "weekly" },
  { path: "/privacy", priority: "0.3", freq: "yearly" },
  { path: "/terms", priority: "0.3", freq: "yearly" },
  { path: "/disclaimers", priority: "0.3", freq: "yearly" },
  { path: "/site-map", priority: "0.4", freq: "monthly" },
  { path: "/login", priority: "0.3", freq: "monthly" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toUrlEntry(path: string, lastmod: string, freq: string, priority: string): string {
  return `  <url>
    <loc>${escapeXml(BASE_URL + path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Fetch all companies with their slugs and update dates
    const { data: companies, error } = await supabase
      .from("companies")
      .select("slug, updated_at, name")
      .order("name");

    if (error) throw error;

    // Build XML
    const entries: string[] = [];

    // Static pages
    for (const page of STATIC_PAGES) {
      entries.push(toUrlEntry(page.path, today, page.freq, page.priority));
    }

    // Dynamic company pages
    if (companies) {
      for (const company of companies) {
        const lastmod = company.updated_at
          ? company.updated_at.split("T")[0]
          : today;
        entries.push(toUrlEntry(`/company/${company.slug}`, lastmod, "weekly", "0.7"));
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

    return new Response(xml, { headers: corsHeaders });
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
