import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireServiceRole } from "../_shared/auth-guard.ts";

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

  const authError = requireServiceRole(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const leaseOwner = `run-dossier-job-${crypto.randomUUID()}`;
  let activeJobId: string | null = null;

  try {
    const { jobId } = await req.json();
    if (!jobId) return json({ success: false, error: "jobId is required" }, 400);
    activeJobId = jobId;

    const { data: claim, error: claimError } = await supabase.rpc("claim_dossier_job", {
      p_job_id: jobId,
      p_lease_owner: leaseOwner,
      p_lease_seconds: 600,
    });

    if (claimError) throw claimError;
    if (!claim?.success) return json({ success: false, error: claim?.error || "Job is not claimable" }, 409);

    const companyId = claim.companyId;
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, slug")
      .eq("id", companyId)
      .maybeSingle();

    if (companyError) throw companyError;
    if (!company) throw new Error("Company not found for dossier job");

    await supabase.rpc("heartbeat_dossier_job", {
      p_job_id: jobId,
      p_lease_owner: leaseOwner,
      p_lease_seconds: 600,
    });

    const { data: requests, error: requestError } = await supabase
      .from("intelligence_requests")
      .select("id, employer_name, role_title, email, location, concerns, notification_attempts")
      .eq("scan_job_id", jobId)
      .in("workflow_status", ["queued", "processing"]);

    if (requestError) throw requestError;

    const results: Array<{ requestId: string; success: boolean; status: number }> = [];

    for (const request of requests || []) {
      await supabase.rpc("heartbeat_dossier_job", {
        p_job_id: jobId,
        p_lease_owner: leaseOwner,
        p_lease_seconds: 600,
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/generate-intelligence-report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employer_name: request.employer_name || company.name,
          role_title: request.role_title,
          email: request.email,
          location: request.location,
          concern: request.concerns,
          request_id: request.id,
        }),
      });

      results.push({ requestId: request.id, success: response.ok, status: response.status });

      if (!response.ok) {
        const detail = await response.text();
        await supabase
          .from("intelligence_requests")
          .update({
            workflow_status: response.status === 402 || response.status === 429 ? "queued" : "failed",
            status: response.status === 402 || response.status === 429 ? "queued" : "failed",
            dossier_outcome: response.status === 402 || response.status === 429 ? "unknown" : "failed",
            outcome_reason: detail.slice(0, 500),
            notification_status: "not_ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.id);
      }
    }

    const hadFailure = results.some((result) => !result.success);
    const retryable = results.some((result) => result.status === 402 || result.status === 429 || result.status >= 500);

    await supabase.rpc("finish_dossier_job", {
      p_job_id: jobId,
      p_lease_owner: leaseOwner,
      p_status: hadFailure && retryable ? "queued" : hadFailure ? "failed" : "completed",
      p_error_type: hadFailure ? "request_processing" : null,
      p_error_message: hadFailure ? "One or more attached requests did not finish" : null,
    });

    return json({ success: !hadFailure, jobId, processed: results.length, results });
  } catch (error) {
    console.error("run-dossier-job error:", error);
    if (activeJobId) {
      await supabase.rpc("finish_dossier_job", {
        p_job_id: activeJobId,
        p_lease_owner: leaseOwner,
        p_status: "failed",
        p_error_type: "runner_error",
        p_error_message: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
      }).catch(() => null);
    }

    return json({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});