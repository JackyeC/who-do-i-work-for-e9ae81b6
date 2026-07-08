import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit || 3), 1), 10);

    const { data: jobs, error } = await supabase
      .from("scan_jobs")
      .select("id, company_id, created_at")
      .eq("job_type", "dossier_build")
      .in("status", ["pending", "queued"])
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const results = [];
    for (const job of jobs || []) {
      const response = await fetch(`${supabaseUrl}/functions/v1/run-dossier-job`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      results.push({
        jobId: job.id,
        success: response.ok,
        status: response.status,
      });
    }

    return json({ success: true, queued: jobs?.length || 0, results });
  } catch (error) {
    console.error("drain-dossier-jobs error:", error);
    return json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});