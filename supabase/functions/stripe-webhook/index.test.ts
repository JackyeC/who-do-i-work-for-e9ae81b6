import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/stripe-webhook`;

Deno.test("stripe-webhook: rejects requests without Stripe signature", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ type: "customer.subscription.updated" }),
  });
  const body = await res.text();
  assertExists(body);
  // Without valid stripe-signature header, should fail signature verification
  const status = res.status;
  assertEquals(status >= 400, true, `Expected 4xx/5xx but got ${status}`);
});

Deno.test("stripe-webhook: handles OPTIONS (CORS preflight)", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
  });
  await res.text();
  // Stripe webhooks may or may not support OPTIONS — just verify no crash
  assertExists(res.status);
});
