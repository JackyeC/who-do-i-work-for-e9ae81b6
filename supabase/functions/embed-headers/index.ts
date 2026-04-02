import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Proxy that returns the embed HTML with proper frame-embedding headers.
 * Called by the embedder's iframe — the client app itself serves the page,
 * but we use this function to validate the origin and set headers.
 *
 * Approved domains for embedding PeoplePuzzles.
 * Add new domains here to allowlist them.
 */
const APPROVED_DOMAINS = [
  "jackyeclayton.com",
  "wdiwf.jackyeclayton.com",
  "who-do-i-work-for.lovable.app",
  "localhost",
];

function isApprovedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    const hostname = new URL(origin).hostname;
    return APPROVED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer");
  const approved = isApprovedOrigin(origin);

  // Build frame-ancestors directive
  const frameAncestors = approved
    ? APPROVED_DOMAINS.map((d) => `https://*.${d} https://${d}`).join(" ") + " http://localhost:*"
    : "'none'";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": approved && origin ? new URL(origin).origin : "",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Security-Policy": `frame-ancestors ${frameAncestors}`,
    "X-Frame-Options": approved ? "ALLOWALL" : "DENY",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  return new Response(
    JSON.stringify({
      allowed: approved,
      domains: APPROVED_DOMAINS,
      embedUrl: "/peoplepuzzles/embed",
    }),
    { status: 200, headers }
  );
});
