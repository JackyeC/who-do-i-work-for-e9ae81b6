import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const url = `${SUPABASE_URL}/functions/v1/check-subscription`;

Deno.test("check-subscription: rejects unauthenticated requests", async () => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
  });
  const body = await res.text();
  // Should return 200 with error in body (function catches and wraps errors)
  // or 401 depending on implementation
  assertExists(body);
  // No auth header → should indicate authentication failure
  const parsed = JSON.parse(body);
  assertEquals(parsed.subscribed === undefined || parsed.error !== undefined, true);
});

Deno.test("check-subscription: handles OPTIONS (CORS preflight)", async () => {
  const res = await fetch(url, {
    method: "OPTIONS",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
  });
  await res.text();
  assertEquals(res.status, 200);
});
