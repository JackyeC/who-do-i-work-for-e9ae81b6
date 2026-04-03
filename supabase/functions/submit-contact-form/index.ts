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

async function verifyTurnstileToken(token: string) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    throw new Error("Verification service is not configured");
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  const result = await response.json();
  return result.success === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { name, email, reason, message, token } = await req.json();

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanReason = typeof reason === "string" && reason.trim() ? reason.trim() : "General";
    const cleanMessage = typeof message === "string" ? message.trim() : "";
    const cleanToken = typeof token === "string" ? token.trim() : "";

    if (!cleanName || !cleanEmail || !cleanMessage || !cleanToken) {
      return json({ error: "Missing required fields" }, 400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      return json({ error: "Please provide a valid email address" }, 400);
    }

    const verified = await verifyTurnstileToken(cleanToken);
    if (!verified) {
      return json({ error: "Verification failed. Please try again." }, 403);
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return json({ error: "Email service is not configured" }, 500);
    }

    const safeName = escapeHtml(cleanName);
    const safeEmail = escapeHtml(cleanEmail);
    const safeReason = escapeHtml(cleanReason);
    const safeMessage = escapeHtml(cleanMessage).replaceAll("\n", "<br />");

    const subject = `Who Do I Work For Contact: ${cleanReason}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:680px;margin:0 auto;padding:24px;">
        <h1 style="font-size:24px;margin:0 0 16px;">New contact submission</h1>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin:0 0 8px;"><strong>Reason:</strong> ${safeReason}</p>
        <p style="margin:20px 0 8px;"><strong>Message:</strong></p>
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;white-space:normal;">${safeMessage}</div>
      </div>
    `;

    const text = [
      "New contact submission",
      `Name: ${cleanName}`,
      `Email: ${cleanEmail}`,
      `Reason: ${cleanReason}`,
      "",
      "Message:",
      cleanMessage,
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
      console.error("Contact email send failed:", emailResponse.status, details);
      return json({ error: "Unable to send your message right now." }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("submit-contact-form error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});