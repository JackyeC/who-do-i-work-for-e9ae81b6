import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONGRESS_API_BASE = "https://api.congress.gov/v3";
const LEGISLATORS_URL = "https://theunitedstates.io/congress-legislators/legislators-current.json";

// Find bioguide ID by name matching
async function resolveBioguideId(candidateName: string, state?: string): Promise<string | null> {
  try {
    const resp = await fetch(LEGISLATORS_URL, {
      headers: { "User-Agent": "CivicLens/1.0" },
    });
    if (!resp.ok) return null;
    const legislators = await resp.json();

    const normalized = candidateName.toUpperCase().replace(/[^A-Z\s]/g, "").trim();

    for (const leg of legislators) {
      const fullName = (leg.name.official_full || `${leg.name.first} ${leg.name.last}`).toUpperCase();
      const lastName = leg.name.last.toUpperCase();
      const firstName = leg.name.first.toUpperCase();

      // Match full name, or last + first initial
      if (
        fullName.includes(normalized) ||
        normalized.includes(fullName) ||
        (normalized.includes(lastName) && normalized.includes(firstName.slice(0, 3)))
      ) {
        // Optional state check
        if (state) {
          const currentTerm = leg.terms[leg.terms.length - 1];
          if (currentTerm.state !== state.toUpperCase()) continue;
        }
        return leg.id.bioguide;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch real data from Congress.gov API
async function fetchCongressData(bioguideId: string, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    // Member profile
    const memberResp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}?api_key=${apiKey}&format=json`,
      { signal: controller.signal, headers: { "User-Agent": "CivicLens/1.0" } }
    );
    const memberData = memberResp.ok ? await memberResp.json() : null;
    const member = memberData?.member;

    // Sponsored legislation
    const sponsoredResp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}/sponsored-legislation?limit=15&api_key=${apiKey}&format=json`,
      { signal: controller.signal, headers: { "User-Agent": "CivicLens/1.0" } }
    );
    const sponsoredData = sponsoredResp.ok ? await sponsoredResp.json() : null;
    const bills = sponsoredData?.sponsoredLegislation || [];

    // Cosponsored legislation
    const cosponsoredResp = await fetch(
      `${CONGRESS_API_BASE}/member/${bioguideId}/cosponsored-legislation?limit=15&api_key=${apiKey}&format=json`,
      { signal: controller.signal, headers: { "User-Agent": "CivicLens/1.0" } }
    );
    const cosponsoredData = cosponsoredResp.ok ? await cosponsoredResp.json() : null;
    const cosponsored = cosponsoredData?.cosponsoredLegislation || [];

    return {
      member: member
        ? {
            name: member.directOrderName || member.invertedOrderName,
            party: member.partyName,
            state: member.state,
            district: member.district || null,
            chamber: member.terms?.[member.terms.length - 1]?.chamber || null,
            terms_served: member.terms?.length || 0,
            depiction: member.depiction?.imageUrl || null,
            leadership: member.leadership || [],
            committees: (member.terms?.[member.terms.length - 1]?.committees || []).map((c: any) => c.name),
          }
        : null,
      sponsored_bills: bills.slice(0, 10).map((b: any) => ({
        title: b.title,
        number: `${b.type}${b.number}`,
        congress: b.congress,
        latest_action: b.latestAction?.text || null,
        latest_action_date: b.latestAction?.actionDate || null,
        policy_area: b.policyArea?.name || null,
        url: `https://www.congress.gov/bill/${b.congress}th-congress/${b.type === "S" ? "senate" : "house"}-bill/${b.number}`,
      })),
      cosponsored_bills: cosponsored.slice(0, 10).map((b: any) => ({
        title: b.title,
        number: `${b.type}${b.number}`,
        policy_area: b.policyArea?.name || null,
      })),
    };
  } catch (err: any) {
    console.warn(`[voting-summary] Congress.gov fetch error for ${bioguideId}:`, err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidate_name, party, state, district } = await req.json();

    if (!candidate_name) {
      return new Response(JSON.stringify({ error: "candidate_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const CONGRESS_API_KEY = Deno.env.get("CONGRESS_GOV_API_KEY");

    // Try to resolve bioguide ID and fetch real data
    let congressData: any = null;
    let dataSource = "ai_inference";

    if (CONGRESS_API_KEY) {
      console.log(`[voting-summary] Resolving bioguide ID for "${candidate_name}"...`);
      const bioguideId = await resolveBioguideId(candidate_name, state);

      if (bioguideId) {
        console.log(`[voting-summary] Found bioguide: ${bioguideId}, fetching Congress.gov data...`);
        congressData = await fetchCongressData(bioguideId, CONGRESS_API_KEY);
        if (congressData) dataSource = "congress.gov";
      } else {
        console.log(`[voting-summary] No bioguide match for "${candidate_name}"`);
      }
    }

    // Build the AI prompt with real data if available
    const districtContext = district ? `, District ${district}` : "";
    let prompt: string;

    if (congressData?.member) {
      const m = congressData.member;
      const committeeList = m.committees?.length > 0
        ? `Current committees: ${m.committees.join("; ")}`
        : "No committee data available.";

      const billList = congressData.sponsored_bills?.length > 0
        ? congressData.sponsored_bills.map((b: any) =>
            `- ${b.number}: "${b.title}" (${b.policy_area || "No category"}) — ${b.latest_action || "No action"}`
          ).join("\n")
        : "No recent sponsored legislation found.";

      const cosponsoredList = congressData.cosponsored_bills?.length > 0
        ? congressData.cosponsored_bills.slice(0, 5).map((b: any) =>
            `- ${b.number}: "${b.title}" (${b.policy_area || "uncategorized"})`
          ).join("\n")
        : "";

      prompt = `You are a civic data researcher. Provide a concise, neutral voting record summary for ${m.name} (${m.party}, ${m.state}${m.district ? `, District ${m.district}` : ""}).

Here is VERIFIED data from the official Congress.gov API:

**Profile:**
- Chamber: ${m.chamber}
- Terms served: ${m.terms_served}
- ${committeeList}

**Recent Sponsored Legislation:**
${billList}

${cosponsoredList ? `**Recent Cosponsored Legislation:**\n${cosponsoredList}` : ""}

Using this verified data, provide:
1. **Key Legislative Activity** – Summarize their 3-5 most significant sponsored/cosponsored bills
2. **Committee Assignments** – List their current committees and relevance
3. **Policy Focus Areas** – Based on the bill policy areas above
4. **Relevant to Workers** – Highlight any bills related to labor, wages, benefits, workplace regulation, or civil rights

Keep it factual, cite bill numbers, and stay under 350 words. Mark all data as sourced from Congress.gov.`;
    } else {
      prompt = `You are a civic data researcher. Provide a concise, neutral voting record summary for the politician "${candidate_name}" (${party}, ${state}${districtContext}).

Include:
1. **Key Votes** – 3-5 notable recent votes on major legislation (with bill names and how they voted)
2. **Committee Assignments** – Current committees they serve on
3. **Policy Focus Areas** – Their primary legislative priorities
4. **Relevant to Workers** – Any votes related to labor, wages, benefits, or workplace regulation

Keep it factual and under 300 words. Note that this summary is based on publicly available information and may not reflect the most current data. Suggest checking Congress.gov directly for the latest records.`;
    }

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a nonpartisan civic researcher providing factual summaries of politician voting records. Be objective and cite specific bill numbers when available. Always note the data source.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API failed [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "No voting data available.";

    return new Response(JSON.stringify({
      summary,
      data_source: dataSource,
      bioguide_id: congressData?.member ? true : false,
      committees: congressData?.member?.committees || [],
      sponsored_bills_count: congressData?.sponsored_bills?.length || 0,
      policy_areas: congressData?.sponsored_bills
        ? [...new Set(congressData.sponsored_bills.map((b: any) => b.policy_area).filter(Boolean))]
        : [],
      congress_gov_profile: congressData?.member
        ? `https://bioguide.congress.gov/search/bio/${congressData.member.name}`
        : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Voting summary error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
