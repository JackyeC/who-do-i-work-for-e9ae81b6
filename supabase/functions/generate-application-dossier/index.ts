import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { application_id } = await req.json().catch(() => ({}));
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: app, error: appErr } = await supabase
      .from("applications_tracker")
      .select("*")
      .eq("id", application_id)
      .eq("user_id", user.id)
      .single();

    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: company } = await supabase
      .from("companies")
      .select("id, name, slug, industry, state, civic_footprint_score")
      .eq("id", app.company_id)
      .maybeSingle();

    const matched = (app.matched_signals as string[] | null) || [];

    const body =
      `## Where we applied\n` +
      `- **Role:** ${app.job_title}\n` +
      `- **Company:** ${app.company_name}\n` +
      (app.application_link ? `- **Link:** ${app.application_link}\n` : "") +
      `\n## Why this role met your bar\n` +
      `- Values alignment score: **${app.alignment_score ?? "—"}%**\n` +
      (matched.length ? `- Matched signals: ${matched.join(", ")}\n` : "") +
      `\n## What the public record shows (snapshot)\n` +
      (company
        ? `- **Industry:** ${company.industry ?? "—"}\n` +
          `- **HQ / filing state:** ${company.state ?? "—"}\n` +
          `- **Employer clarity score:** ${company.civic_footprint_score ?? "—"}\n` +
          `- **Dossier:** [Open company dossier](/dossier/${company.slug})\n`
        : `- Company record is still syncing. Open your dossier from the job card when available.\n`) +
      `\n---\n` +
      `_This dossier is generated from your application record and public company data in Who Do I Work For. ` +
      `It is not legal, investment, or career advice._\n`;

    const title = `Application dossier: ${app.job_title} @ ${app.company_name}`;

    const { data: row, error: upsertErr } = await supabase
      .from("application_email_dossiers")
      .upsert(
        {
          user_id: user.id,
          application_id: app.id,
          title,
          body_markdown: body,
          email_status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id" }
      )
      .select()
      .maybeSingle();

    if (upsertErr) {
      console.error(upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ dossier: row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
