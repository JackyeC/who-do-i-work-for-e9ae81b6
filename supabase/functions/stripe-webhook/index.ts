import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

async function upsertSubscription(
  customerId: string,
  subscription: Stripe.Subscription
) {
  const customerEmail = (await stripe.customers.retrieve(customerId) as Stripe.Customer).email;
  if (!customerEmail) {
    log("SKIP: no email on customer", { customerId });
    return;
  }

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find((u) => u.email === customerEmail);
  if (!user) {
    log("SKIP: no matching auth user", { customerEmail });
    return;
  }

  const status = subscription.status; // active, canceled, past_due, etc.
  const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const productId = subscription.items.data[0]?.price?.product as string;

  // Map Stripe product to internal plan
  const { data: plans } = await supabase.from("plans").select("id, name").limit(10);
  // For now, default to the first plan; extend mapping as needed
  const planId = plans?.[0]?.id || null;

  const row = {
    user_id: user.id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status,
    current_period_end: periodEnd,
    plan_id: planId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    log("DB upsert error", { error: error.message });
  } else {
    log("Subscription synced", { userId: user.id, status, productId });
  }

  // Audit log
  await supabase.from("audit_log").insert({
    actor_email: "stripe-webhook",
    action: `subscription.${status}`,
    target_table: "user_subscriptions",
    target_id: user.id,
    metadata: { stripe_subscription_id: subscription.id, product_id: productId, period_end: periodEnd },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If STRIPE_WEBHOOK_SECRET is set, verify signature
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Fallback: parse without verification (dev mode)
      event = JSON.parse(body) as Stripe.Event;
      log("WARNING: No webhook signature verification");
    }
  } catch (err) {
    log("Signature verification failed", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  log("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(session.customer as string, subscription);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscription(subscription.customer as string, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        log("Payment failed", { customer: invoice.customer, subscription: invoice.subscription });
        // Mark subscription as past_due if needed
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await upsertSubscription(invoice.customer as string, subscription);
        }
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    log("Processing error", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Processing failed" }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
