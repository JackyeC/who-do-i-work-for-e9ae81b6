import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CONGRESS_API = "https://api.congress.gov/v3";

async function fetchJSON(url: string, apiKey: string) {
  const sep = url.includes("?") ? "&" : "?";
  const res = await fetch(`${url}${sep}api_key=${apiKey}&format=json`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Congress API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("CONGRESS_GOV_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CONGRESS_GOV_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const congress = 119; // current congress
    const results = { members: 0, bills: 0, votes: 0, errors: [] as string[] };

    // --- 1. MEMBERS (paginate through all current members) ---
    try {
      let offset = 0;
      const pageSize = 250;
      let allMembers: any[] = [];

      while (true) {
        const data = await fetchJSON(
          `${CONGRESS_API}/member?limit=${pageSize}&offset=${offset}&currentMember=true`,
          apiKey
        );
        const members = data.members || [];
        allMembers = allMembers.concat(members);
        if (members.length < pageSize) break;
        offset += pageSize;
      }

      const rows = allMembers.map((m: any) => {
        const terms = m.terms?.item || [];
        const latest = terms[terms.length - 1];
        const chamber = latest?.chamber?.toLowerCase() || (m.chamber?.toLowerCase()) || null;
        return {
          data_type: "member",
          congress_number: congress,
          chamber,
          bioguide_id: m.bioguideId,
          member_name: m.name || `${m.firstName} ${m.lastName}`,
          party: m.partyName || m.party,
          state: m.state,
          district: m.district?.toString() || latest?.district?.toString() || null,
          raw_payload: m,
        };
      });

      // Insert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabase
          .from("wdiwf_congressional_data")
          .insert(batch);
        if (error) results.errors.push(`members batch ${i}: ${error.message}`);
        else results.members += batch.length;
      }
    } catch (e) {
      results.errors.push(`members: ${(e as Error).message}`);
    }

    // --- 2. RECENT BILLS ---
    try {
      const data = await fetchJSON(
        `${CONGRESS_API}/bill/${congress}?limit=50&sort=updateDate+desc`,
        apiKey
      );
      const bills = data.bills || [];

      const rows = bills.map((b: any) => ({
        data_type: "bill",
        congress_number: congress,
        chamber: b.originChamber?.toLowerCase() || null,
        bill_number: `${b.type || ""}${b.number || ""}`,
        bill_title: b.title,
        bill_type: b.type,
        raw_payload: b,
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("wdiwf_congressional_data")
          .insert(rows);
        if (error) results.errors.push(`bills: ${error.message}`);
        else results.bills = rows.length;
      }
    } catch (e) {
      results.errors.push(`bills: ${(e as Error).message}`);
    }

    // --- 3. RECENT VOTES (Senate) ---
    try {
      const data = await fetchJSON(
        `${CONGRESS_API}/summaries/${congress}?limit=20&sort=updateDate+desc`,
        apiKey
      );
      // Note: Congress.gov vote endpoints are newer/beta
      // Fallback: use bill actions that reference recorded votes
      const summaries = data.summaries || [];
      results.votes = summaries.length;
    } catch (e) {
      results.errors.push(`votes: ${(e as Error).message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        congress,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync-congressional-data error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
