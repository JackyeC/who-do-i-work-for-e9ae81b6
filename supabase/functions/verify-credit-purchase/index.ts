import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { sessionId, packId, credits } = await req.json();
    if (!sessionId) throw new Error("Missing session ID");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Verify payment was successful
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if already processed (idempotent)
    const { data: existing } = await supabaseAdmin
      .from("credit_purchases")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, alreadyProcessed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const creditsToAdd = parseInt(credits) || 1;
    const amountCents = session.amount_total || 0;

    // Upsert user credits
    const { data: currentCredits } = await supabaseAdmin
      .from("user_credits")
      .select("credits_remaining, credits_purchased")
      .eq("user_id", user.id)
      .maybeSingle();

    if (currentCredits) {
      await supabaseAdmin
        .from("user_credits")
        .update({
          credits_remaining: currentCredits.credits_remaining + creditsToAdd,
          credits_purchased: currentCredits.credits_purchased + creditsToAdd,
          last_purchase_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await supabaseAdmin
        .from("user_credits")
        .insert({
          user_id: user.id,
          credits_remaining: creditsToAdd,
          credits_purchased: creditsToAdd,
          last_purchase_at: new Date().toISOString(),
        });
    }

    // Log the purchase
    await supabaseAdmin
      .from("credit_purchases")
      .insert({
        user_id: user.id,
        stripe_session_id: sessionId,
        product_id: packId || "single",
        credits_added: creditsToAdd,
        amount_cents: amountCents,
      });

    return new Response(JSON.stringify({ success: true, creditsAdded: creditsToAdd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
