import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRADITIONAL_ORGS = [
  "Heritage Foundation",
  "Project 2025",
  "Mandate for Leadership",
  "Saving America by Saving the Family",
  "Federalist Society",
  "American Legislative Exchange Council",
  "ALEC",
];

const PROGRESS_ORGS = [
  "Center for American Progress",
  "CAP Action",
  "American Constitution Society",
  "Brennan Center for Justice",
  "Economic Policy Institute",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyId } = await req.json();
    if (!companyId) throw new Error("companyId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get company info
    const { data: company } = await adminClient
      .from("companies")
      .select("id, name, parent_company")
      .eq("id", companyId)
      .single();

    if (!company) throw new Error("Company not found");

    // Get executives and board members
    const [{ data: executives }, { data: boardMembers }] = await Promise.all([
      adminClient
        .from("company_executives")
        .select("name, title")
        .eq("company_id", companyId)
        .is("departed_at", null)
        .limit(15),
      adminClient
        .from("board_members")
        .select("name, title")
        .eq("company_id", companyId)
        .is("departed_at", null)
        .limit(15),
    ]);

    const leaders = [
      ...(executives || []).map((e: any) => ({ name: e.name, title: e.title })),
      ...(boardMembers || []).map((b: any) => ({ name: b.name, title: b.title })),
    ];

    // Deduplicate by name
    const uniqueLeaders = Array.from(
      new Map(leaders.map((l) => [l.name, l])).values()
    );

    const leaderNames = uniqueLeaders.map((l) => l.name).join(", ");
    const allOrgs = [...TRADITIONAL_ORGS, ...PROGRESS_ORGS].join(", ");

    // Perplexity structured query
    const prompt = `Research the institutional and policy network connections for ${company.name} leadership.

Leaders to research: ${leaderNames}

For each leader, determine if they have ANY documented connections to these organizations:
Traditional/Conservative policy networks: ${TRADITIONAL_ORGS.join(", ")}
Progressive policy networks: ${PROGRESS_ORGS.join(", ")}

Connections include: board seats, advisory roles, donations, public endorsements, speaking engagements, membership, PAC contributions to affiliated politicians, or published support.

Also check if ${company.name} as a corporation (or its PAC) has donated to, partnered with, or funded any of these organizations.

Return ONLY verified, documented connections with sources. Do not speculate.

For each connection found, provide:
- person_name (or "${company.name}" if corporate-level)
- person_title
- institution_name (exact org name)
- link_type (board_seat, advisory_role, donation, endorsement, speaking, membership, pac_contribution, corporate_funding, published_support)
- link_description (one sentence describing the documented connection)
- evidence_source (source name like "FEC Filing", "OpenSecrets", "Organization website", etc.)
- confidence (high, medium, or low)

Format as JSON array.`;

    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a corporate intelligence researcher. Return only verified, documented connections between company leaders and policy institutions. Output valid JSON arrays only. No speculation. No judgment. Just receipts.",
          },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "institutional_connections",
            schema: {
              type: "object",
              properties: {
                connections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      person_name: { type: "string" },
                      person_title: { type: "string" },
                      institution_name: { type: "string" },
                      link_type: { type: "string" },
                      link_description: { type: "string" },
                      evidence_source: { type: "string" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["person_name", "institution_name", "link_type", "link_description", "confidence"],
                  },
                },
              },
              required: ["connections"],
            },
          },
        },
      }),
    });

    if (!perplexityResponse.ok) {
      const errText = await perplexityResponse.text();
      console.error("Perplexity error:", perplexityResponse.status, errText);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const aiResult = await perplexityResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    const citations = aiResult.citations || [];

    let connections: any[] = [];
    try {
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      connections = parsed.connections || parsed || [];
    } catch {
      console.error("Failed to parse AI response:", content);
      connections = [];
    }

    // Categorize each connection
    const signals = connections.map((conn: any) => {
      const instLower = (conn.institution_name || "").toLowerCase();
      let category = "bipartisan";

      if (TRADITIONAL_ORGS.some((o) => instLower.includes(o.toLowerCase()))) {
        category = "traditional_policy";
      } else if (PROGRESS_ORGS.some((o) => instLower.includes(o.toLowerCase()))) {
        category = "progress_policy";
      }

      return {
        company_id: companyId,
        person_name: conn.person_name || company.name,
        person_title: conn.person_title || null,
        institution_name: conn.institution_name,
        institution_category: category,
        link_type: conn.link_type || "documented_link",
        link_description: conn.link_description,
        evidence_url: citations[0] || null,
        evidence_source: conn.evidence_source || "Perplexity Research",
        confidence: conn.confidence || "medium",
      };
    });

    // Clear old signals and insert new
    await adminClient
      .from("institutional_alignment_signals")
      .delete()
      .eq("company_id", companyId);

    let insertedCount = 0;
    if (signals.length > 0) {
      const { error: insertError } = await adminClient
        .from("institutional_alignment_signals")
        .insert(signals);

      if (insertError) {
        console.error("Batch insert failed, trying one-by-one:", insertError.message);
        for (const signal of signals) {
          const { error: singleError } = await adminClient
            .from("institutional_alignment_signals")
            .insert(signal);
          if (!singleError) insertedCount++;
          else console.error("Single insert failed:", singleError.message);
        }
      } else {
        insertedCount = signals.length;
      }
    }

    // Check bipartisan status
    const categories = new Set(signals.map((s: any) => s.institution_category));
    const isBipartisan = categories.has("traditional_policy") && categories.has("progress_policy");

    console.log(`[institutional-dna] ${company.name}: ${insertedCount} signals (bipartisan: ${isBipartisan})`);

    return new Response(
      JSON.stringify({
        success: true,
        companyName: company.name,
        signalsFound: insertedCount,
        traditional: signals.filter((s: any) => s.institution_category === "traditional_policy").length,
        progress: signals.filter((s: any) => s.institution_category === "progress_policy").length,
        isBipartisan,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("[institutional-dna] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
