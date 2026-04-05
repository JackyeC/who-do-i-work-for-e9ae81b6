import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping verification");
    return true; // Allow through if not configured
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });

  const result = await response.json();
  return result.success === true;
}

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
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

    if (!cleanName || !cleanEmail || !cleanMessage) {
      return json({ error: "Missing required fields" }, 400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(cleanEmail)) {
      return json({ error: "Please provide a valid email address" }, 400);
    }

    // Turnstile: verify if token provided, skip gracefully if empty
    if (cleanToken) {
      const verified = await verifyTurnstileToken(cleanToken);
      if (!verified) {
        return json({ error: "Verification failed. Please try again." }, 403);
      }
    }

    // Always save to database first
    let emailSent = false;
    const supabase = getSupabaseAdmin();

    // Attempt email delivery via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
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

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Who Do I Work For <onboarding@resend.dev>",
            to: [CONTACT_EMAIL],
            subject,
            html,
          }),
        });

        emailSent = emailResponse.ok;
        if (!emailSent) {
          const errBody = await emailResponse.text();
          console.error("Resend email failed:", emailResponse.status, errBody);
        }
      } catch (emailErr) {
        console.error("Resend email error:", emailErr);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping email delivery");
    }

    // Save to database (never loses a submission)
    const { error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: cleanName,
        email: cleanEmail,
        reason: cleanReason,
        message: cleanMessage,
        email_sent: emailSent,
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
    }

    return json({ success: true });
  } catch (error) {
    console.error("submit-contact-form error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
