import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Products available for anonymous purchase
const ANONYMOUS_PRODUCTS: Record<string, { priceId: string; name: string }> = {
  "career-fit-report": {
    priceId: "price_1TEARm7Qj0W6UtN9iIolmwsp",
    name: "Career Fit Report",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productKey, email, companyName } = await req.json();

    if (!productKey || !ANONYMOUS_PRODUCTS[productKey]) {
      throw new Error("Invalid product");
    }

    const product = ANONYMOUS_PRODUCTS[productKey];

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer by email
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    const origin = req.headers.get("origin") || "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (email || undefined),
      line_items: [{ price: product.priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/report-confirmation?session_id={CHECKOUT_SESSION_ID}&product=${productKey}`,
      cancel_url: `${origin}/?checkout=canceled`,
      metadata: {
        product_key: productKey,
        company_name: companyName || "",
        anonymous: "true",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
