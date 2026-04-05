const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CONTACT_EMAIL = "jackye@jackyeclayton.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { employer_name, role_title, email, location, concern } = await req.json();

    const cleanEmployer = typeof employer_name === "string" ? employer_name.trim() : "";
    const cleanRole = typeof role_title === "string" ? role_title.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanLocation = typeof location === "string" ? location.trim() : "";
    const cleanConcern = typeof concern === "string" ? concern.trim() : "";

    if (!cleanEmployer || !cleanRole || !cleanEmail) {
      return json({ error: "Missing required fields" }, 400);
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return json({ error: "Email service is not configured" }, 500);
    }

    const safeEmployer = escapeHtml(cleanEmployer);
    const safeRole = escapeHtml(cleanRole);
    const safeEmail = escapeHtml(cleanEmail);
    const safeLocation = cleanLocation ? escapeHtml(cleanLocation) : "Not provided";
    const safeConcern = cleanConcern ? escapeHtml(cleanConcern).replaceAll("\n", "<br />") : "Not provided";

    const subject = `New Intelligence Request: ${cleanEmployer}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:680px;margin:0 auto;padding:24px;">
        <h1 style="font-size:24px;margin:0 0 16px;">🔍 New Intelligence Request</h1>
        <p style="margin:0 0 8px;"><strong>Employer:</strong> ${safeEmployer}</p>
        <p style="margin:0 0 8px;"><strong>Role:</strong> ${safeRole}</p>
        <p style="margin:0 0 8px;"><strong>Requester Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 8px;"><strong>Location:</strong> ${safeLocation}</p>
        <p style="margin:20px 0 8px;"><strong>Concerns:</strong></p>
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;white-space:normal;">${safeConcern}</div>
      </div>
    `;

    const text = [
      "New Intelligence Request",
      `Employer: ${cleanEmployer}`,
      `Role: ${cleanRole}`,
      `Requester Email: ${cleanEmail}`,
      `Location: ${cleanLocation || "Not provided"}`,
      "",
      "Concerns:",
      cleanConcern || "Not provided",
    ].join("\n");

    const emailResponse = await fetch("https://email.lovable.dev/v1/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: CONTACT_EMAIL,
        subject,
        html,
        text,
      }),
    });

    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      console.error("Intelligence notification email failed:", emailResponse.status, details);
      return json({ error: "Unable to send notification." }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("notify-intelligence-request error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
