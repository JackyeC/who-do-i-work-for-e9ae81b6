import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company_id, user_id } = await req.json();
    if (!company_id || !user_id) {
      return new Response(JSON.stringify({ error: "company_id and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent WARN notices for this company (last 12 months)
    const cutoffDate = new Date();
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

    const { data: notices } = await supabase
      .from("company_warn_notices")
      .select("*")
      .eq("company_id", company_id)
      .gte("notice_date", cutoffDate.toISOString().split("T")[0])
      .order("notice_date", { ascending: false });

    if (!notices || notices.length === 0) {
      return new Response(JSON.stringify({ alerts: [], heatmap: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's career contacts
    const { data: contacts } = await supabase
      .from("career_contacts")
      .select("*")
      .eq("created_by", user_id);

    // Build state-level heatmap from WARN notices
    const stateHeatmap: Record<string, { affected: number; notices: number; cities: string[] }> = {};
    for (const notice of notices) {
      const state = notice.location_state || "Unknown";
      if (!stateHeatmap[state]) {
        stateHeatmap[state] = { affected: 0, notices: 0, cities: [] };
      }
      stateHeatmap[state].affected += notice.employees_affected || 0;
      stateHeatmap[state].notices += 1;
      if (notice.location_city && !stateHeatmap[state].cities.includes(notice.location_city)) {
        stateHeatmap[state].cities.push(notice.location_city);
      }
    }

    // Cross-reference contacts with impacted states
    const survivorAlerts: any[] = [];
    if (contacts && contacts.length > 0) {
      // Build a map of contacts by company name (fuzzy match to parent)
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", company_id)
        .single();

      const companyName = company?.name?.toLowerCase() || "";

      for (const contact of contacts) {
        const contactCompany = (contact.company || "").toLowerCase();
        // Check if contact works at this company or subsidiary
        if (
          contactCompany.includes(companyName) ||
          companyName.includes(contactCompany) ||
          contact.company_id === company_id
        ) {
          // Try to match contact's location to impacted states
          // We check the contact's role_tags and industry for location hints
          // For now, flag all contacts at the affected company
          survivorAlerts.push({
            contact_id: contact.id,
            contact_name: contact.name,
            contact_title: contact.title,
            contact_company: contact.company,
            risk_level: "high",
            reason: `Works at ${contact.company} — active RIF/WARN filings detected`,
            impacted_states: Object.keys(stateHeatmap),
            total_affected: Object.values(stateHeatmap).reduce((s, v) => s + v.affected, 0),
          });
        }
      }
    }

    // Detect "Strategic Workforce Shift" — WARN in US + subcontractor growth
    const { data: subcontractors } = await supabase
      .from("company_corporate_structure")
      .select("*")
      .eq("company_id", company_id)
      .in("entity_type", ["subsidiary", "subcontractor"])
      .gte("created_at", cutoffDate.toISOString());

    let offshoreFlag = false;
    const offshoreSignals: string[] = [];
    if (subcontractors && subcontractors.length > 0) {
      for (const sub of subcontractors) {
        const jurisdiction = (sub.jurisdiction || "").toLowerCase();
        if (jurisdiction && !jurisdiction.includes("us") && !jurisdiction.includes("united states")) {
          offshoreFlag = true;
          offshoreSignals.push(
            `${sub.entity_name} (${sub.jurisdiction}) registered while US workforce cut by ${Object.values(stateHeatmap).reduce((s, v) => s + v.affected, 0).toLocaleString()}`
          );
        }
      }
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let strategicAutopsy = null;

    // Generate Strategic Autopsy if we have enough data
    if (lovableKey && notices.length >= 2) {
      try {
        const noticesSummary = notices.map(n =>
          `${n.notice_date}: ${n.employees_affected} affected in ${n.location_city || "?"}, ${n.location_state || "?"} — ${n.reason || n.layoff_type}`
        ).join("\n");

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a workforce intelligence analyst. Analyze layoff patterns to identify which roles/teams are being abolished vs retained. Be specific and data-driven. Return JSON.",
              },
              {
                role: "user",
                content: `Analyze these WARN/RIF notices for strategic workforce patterns:

${noticesSummary}

${offshoreFlag ? `ALERT: New international entities detected while US cuts ongoing:\n${offshoreSignals.join("\n")}` : ""}

Return JSON with:
- abolished_pattern: string (what roles/teams/locations are being cut)
- retained_pattern: string (what's being kept/growing)
- strategic_shift: string (one-line assessment of the company's workforce strategy)
- risk_level: "critical" | "high" | "moderate" | "low"
- poaching_targets: string (which impacted teams have high-value talent worth reaching out to)
${offshoreFlag ? '- offshore_alert: string (assessment of US-to-international shift)' : ""}`,
              },
            ],
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let text = data.choices?.[0]?.message?.content || "";
          text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try {
            strategicAutopsy = JSON.parse(text);
          } catch {
            console.error("[survivor-alert] Failed to parse autopsy:", text.slice(0, 200));
          }
        }
      } catch (e) {
        console.error("[survivor-alert] Autopsy generation failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        alerts: survivorAlerts,
        heatmap: stateHeatmap,
        strategicAutopsy,
        offshoreFlag,
        offshoreSignals,
        totalNotices: notices.length,
        totalAffected: notices.reduce((s: number, n: any) => s + (n.employees_affected || 0), 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[survivor-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
