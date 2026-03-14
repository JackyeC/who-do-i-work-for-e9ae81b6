import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FINNHUB_BASE = "https://finnhub.io/api/v1";

// Map Finnhub position strings to our standard titles
function normalizeTitle(position: string): string {
  if (!position) return "Executive";
  return position
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// Fuzzy name matching: handles "KESSEL, STEVEN" vs "Steven Kessel"
function namesMatch(stored: string, live: string): boolean {
  const normalize = (n: string) =>
    n.toUpperCase().replace(/[^A-Z\s]/g, "").trim().split(/\s+/).sort().join(" ");
  const a = normalize(stored);
  const b = normalize(live);
  if (a === b) return true;
  // Check if all parts of the shorter name exist in the longer
  const partsA = a.split(" ");
  const partsB = b.split(" ");
  const shorter = partsA.length < partsB.length ? partsA : partsB;
  const longer = partsA.length >= partsB.length ? partsA : partsB;
  return shorter.every((part) => longer.some((lp) => lp.includes(part) || part.includes(lp)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
    if (!finnhubKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FINNHUB_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { companyId, companyName } = body;

    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: "companyId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get company ticker
    const { data: company } = await sb
      .from("companies")
      .select("ticker, name, is_publicly_traded")
      .eq("id", companyId)
      .maybeSingle();

    if (!company?.ticker) {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "No ticker symbol — Finnhub requires a stock ticker",
          sourcesScanned: 0,
          signalsFound: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ticker = company.ticker.toUpperCase();
    console.log(`[finnhub-leadership] Fetching executives for ${ticker} (${company.name})`);

    // ── Step 1: Fetch company profile (CEO) ──
    const profileResp = await fetch(
      `${FINNHUB_BASE}/stock/profile2?symbol=${ticker}&token=${finnhubKey}`
    );

    let ceoName: string | null = null;
    if (profileResp.ok) {
      const profile = await profileResp.json();
      if (profile.name) {
        ceoName = profile.name; // This is actually the company name
      }
    }

    // ── Step 2: Fetch company peers for cross-board detection later ──
    // (lightweight — just store for future use)

    // ── Step 3: Fetch executives via Finnhub ──
    const execResp = await fetch(
      `${FINNHUB_BASE}/stock/executive?symbol=${ticker}&token=${finnhubKey}`
    );

    if (!execResp.ok) {
      const errText = await execResp.text();
      console.error(`[finnhub-leadership] API error: ${execResp.status} ${errText}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Finnhub API error: ${execResp.status}`,
          sourcesScanned: 0,
          signalsFound: 0,
        }),
        { status: execResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const execData = await execResp.json();
    const liveExecutives: Array<{ name: string; position: string; compensation?: number; age?: number }> =
      execData.executive || [];

    console.log(`[finnhub-leadership] Found ${liveExecutives.length} executives from Finnhub for ${ticker}`);

    if (liveExecutives.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sourcesScanned: 1,
          signalsFound: 0,
          message: "Finnhub returned no executives for this ticker",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 4: Get current stored executives ──
    const [storedExecsRes, storedBoardRes] = await Promise.all([
      sb.from("company_executives").select("id, name, title, verification_status, total_donations").eq("company_id", companyId),
      sb.from("board_members").select("id, name, title, verification_status").eq("company_id", companyId),
    ]);

    const storedExecs = storedExecsRes.data || [];
    const storedBoard = storedBoardRes.data || [];

    let newExecsAdded = 0;
    let execsVerified = 0;
    let execsMarkedFormer = 0;
    let boardAdded = 0;

    // ── Step 5: Process live executives — verify or add ──
    const matchedStoredIds = new Set<string>();

    for (const live of liveExecutives) {
      if (!live.name) continue;

      const title = normalizeTitle(live.position);
      const isBoard = /\b(Director|Board|Independent|Non-Executive|Chairm)/i.test(title);
      const isExec = /\b(CEO|COO|CFO|CTO|CIO|CHRO|CLO|CPO|CRO|CMO|Chief|President|SVP|EVP|Senior Vice President|Executive Vice President|VP|Vice President|Founder|General Counsel|Secretary|Treasurer)\b/i.test(title);

      if (isBoard) {
        // Check if already in board_members
        const match = storedBoard.find((b) => namesMatch(b.name, live.name));
        if (match) {
          matchedStoredIds.add(match.id);
          await sb.from("board_members").update({
            verification_status: "verified",
            last_verified_at: new Date().toISOString(),
            title: title || match.title,
          }).eq("id", match.id);
          execsVerified++;
        } else {
          await sb.from("board_members").insert({
            company_id: companyId,
            name: live.name,
            title: title || "Director",
            source: "finnhub",
            verification_status: "verified",
            last_verified_at: new Date().toISOString(),
          });
          boardAdded++;
        }
      } else if (isExec) {
        const match = storedExecs.find((e) => namesMatch(e.name, live.name));
        if (match) {
          matchedStoredIds.add(match.id);
          await sb.from("company_executives").update({
            verification_status: "verified",
            last_verified_at: new Date().toISOString(),
            title: title || match.title,
          }).eq("id", match.id);
          execsVerified++;
        } else {
          await sb.from("company_executives").insert({
            company_id: companyId,
            name: live.name,
            title: title || "Executive",
            total_donations: 0,
            source: "finnhub",
            verification_status: "verified",
            last_verified_at: new Date().toISOString(),
          });
          newExecsAdded++;
        }
      }
    }

    // ── Step 6: Mark stored execs NOT found in Finnhub as potentially departed ──
    // Only mark as former if: not already verified by another source recently, and Finnhub returned substantial data
    const liveNames = liveExecutives.map((e) => e.name).filter(Boolean);
    const sufficientData = liveExecutives.length >= 3; // Only mark departures if Finnhub returned enough data

    if (sufficientData) {
      for (const stored of storedExecs) {
        if (matchedStoredIds.has(stored.id)) continue;
        if (stored.verification_status === "former") continue;
        if (stored.verification_status === "verified") continue; // Don't override recent verification from another source

        const foundInLive = liveNames.some((ln) => namesMatch(stored.name, ln));
        if (!foundInLive) {
          // Don't immediately mark as former — mark as "unverified" so the leadership refresh can confirm
          await sb.from("company_executives").update({
            verification_status: "unverified",
          }).eq("id", stored.id);
          console.log(`[finnhub-leadership] ${stored.name}: not found in Finnhub, marked unverified`);
        }
      }

      for (const stored of storedBoard) {
        if (matchedStoredIds.has(stored.id)) continue;
        if (stored.verification_status === "former") continue;
        if (stored.verification_status === "verified") continue;

        const foundInLive = liveNames.some((ln) => namesMatch(stored.name, ln));
        if (!foundInLive) {
          await sb.from("board_members").update({
            verification_status: "unverified",
          }).eq("id", stored.id);
        }
      }
    }

    const totalSignals = newExecsAdded + boardAdded + execsVerified + execsMarkedFormer;
    console.log(`[finnhub-leadership] ${ticker}: ${execsVerified} verified, ${newExecsAdded} new execs, ${boardAdded} new board, ${execsMarkedFormer} marked former`);

    return new Response(
      JSON.stringify({
        success: true,
        sourcesScanned: 1,
        signalsFound: totalSignals,
        details: {
          ticker,
          liveExecutivesFound: liveExecutives.length,
          execsVerified,
          newExecsAdded,
          boardAdded,
          execsMarkedFormer,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[finnhub-leadership] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message, sourcesScanned: 0, signalsFound: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
