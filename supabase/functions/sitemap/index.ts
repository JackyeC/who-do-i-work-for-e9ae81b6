import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SITE_URL = "https://who-do-i-work-for.lovable.app";

const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/newsletter", changefreq: "daily", priority: "0.9" },
  { path: "/receipts", changefreq: "daily", priority: "0.9" },
  { path: "/browse", changefreq: "daily", priority: "0.9" },
  { path: "/career-intelligence", changefreq: "weekly", priority: "0.8" },
  { path: "/offer-check", changefreq: "weekly", priority: "0.8" },
  { path: "/compare", changefreq: "weekly", priority: "0.8" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/intelligence-check", changefreq: "weekly", priority: "0.8" },
  { path: "/decision-engine", changefreq: "weekly", priority: "0.8" },
  { path: "/negotiation-simulator", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/methodology", changefreq: "monthly", priority: "0.6" },
  { path: "/workforce-brief", changefreq: "daily", priority: "0.7" },
  { path: "/quiz", changefreq: "monthly", priority: "0.6" },
  { path: "/welcome", changefreq: "monthly", priority: "0.5" },
];

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all company slugs
    const { data: companies } = await supabase
      .from("companies")
      .select("slug, updated_at")
      .in("record_status", ["verified", "active", "pending"])
      .order("updated_at", { ascending: false })
      .limit(1000);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Static pages
    for (const page of STATIC_PAGES) {
      xml += `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Dynamic company dossier pages
    if (companies) {
      for (const c of companies) {
        const lastmod = c.updated_at ? c.updated_at.split("T")[0] : "";
        xml += `  <url>
    <loc>${SITE_URL}/dossier/${c.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response("Error generating sitemap", { status: 500 });
  }
});
