import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    // ── Auth gate: only service-role or admin users allowed ──
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "") || "";
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const anonSb = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader! } },
      });
      const { data: userData, error: authErr } = await anonSb.auth.getUser(token);
      if (authErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roles } = await createClient(supabaseUrl, serviceKey)
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .in("role", ["admin", "owner"]);
      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const sb = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const companyId = body.company_id;
    const refreshType = body.refresh_type || "monthly"; // daily | monthly | annual

    // Get companies to refresh
    let query = sb.from("companies").select("id, name, ticker, sec_cik, website_url");
    if (companyId) {
      query = query.eq("id", companyId);
    } else {
      // For scheduled runs, pick companies with stale leadership data
      const threshold = refreshType === "daily" ? 1 : refreshType === "monthly" ? 30 : 365;
      const cutoff = new Date(Date.now() - threshold * 24 * 60 * 60 * 1000).toISOString();
      query = query.or(`updated_at.lt.${cutoff},updated_at.is.null`).limit(20);
    }

    const { data: companies, error: compErr } = await query;
    if (compErr) throw compErr;
    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: "No companies need refresh" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const company of companies) {
      try {
        // Get current executives and board members
        const [execRes, boardRes] = await Promise.all([
          sb.from("company_executives").select("id, name, title, last_verified_at").eq("company_id", company.id),
          sb.from("board_members").select("id, name, title, last_verified_at, committees").eq("company_id", company.id),
        ]);

        const currentExecs = execRes.data || [];
        const currentBoard = boardRes.data || [];

        // Use AI to check for leadership changes if we have API key
        if (lovableKey) {
          const prompt = `You are a corporate intelligence analyst. For the company "${company.name}" (ticker: ${company.ticker || "N/A"}, SEC CIK: ${company.sec_cik || "N/A"}):

Current known executives: ${currentExecs.map((e: any) => `${e.name} - ${e.title}`).join(", ") || "None"}
Current known board members: ${currentBoard.map((b: any) => `${b.name} - ${b.title}`).join(", ") || "None"}

Based on your knowledge (up to your training cutoff), identify:
1. Any executive changes (new CEO, CFO, departures)
2. Any board membership changes
3. Any committee reassignments

Respond in JSON format:
{
  "changes_detected": boolean,
  "executive_changes": [{"name": "...", "new_title": "...", "change_type": "new|departed|title_change", "source_hint": "..."}],
  "board_changes": [{"name": "...", "new_title": "...", "change_type": "new|departed|committee_change", "committees": ["..."], "source_hint": "..."}],
  "confidence": "high|medium|low"
}`;

          const aiRes = await fetch(AI_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              
              if (parsed.changes_detected && parsed.confidence !== "low") {
                // Process executive changes
                for (const change of parsed.executive_changes || []) {
                  if (change.change_type === "new") {
                    // Check if already exists
                    const exists = currentExecs.some(
                      (e: any) => e.name.toLowerCase() === change.name.toLowerCase()
                    );
                    if (!exists) {
                      await sb.from("company_executives").insert({
                        company_id: company.id,
                        name: change.name,
                        title: change.new_title || "Executive",
                        source: "ai_refresh",
                        last_verified_at: new Date().toISOString(),
                      });
                    }
                  }
                }

                // Process board changes
                for (const change of parsed.board_changes || []) {
                  if (change.change_type === "new") {
                    const exists = currentBoard.some(
                      (b: any) => b.name.toLowerCase() === change.name.toLowerCase()
                    );
                    if (!exists) {
                      await sb.from("board_members").insert({
                        company_id: company.id,
                        name: change.name,
                        title: change.new_title || "Director",
                        committees: change.committees || [],
                        source: "ai_refresh",
                        last_verified_at: new Date().toISOString(),
                      });
                    }
                  }
                }
              }
            }
          }
        }

        // Update last_verified_at for all existing records
        const now = new Date().toISOString();
        await Promise.all([
          sb.from("company_executives")
            .update({ last_verified_at: now })
            .eq("company_id", company.id),
          sb.from("board_members")
            .update({ last_verified_at: now })
            .eq("company_id", company.id),
        ]);

        results.push({ company: company.name, status: "refreshed" });
      } catch (err: any) {
        results.push({ company: company.name, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
