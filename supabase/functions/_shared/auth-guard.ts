/**
 * Shared authentication guard for edge functions.
 *
 * Two modes:
 *   requireServiceRole(req)  — For cron / internal pipeline functions.
 *     Passes if the Bearer token === SUPABASE_SERVICE_ROLE_KEY.
 *
 *   requireAuth(req)         — For user-facing functions.
 *     Passes if the Bearer token is a valid user JWT (via getClaims)
 *     OR is the service-role key (so cron/internal calls also work).
 *     Returns { userId, isServiceRole }.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function unauthorizedResponse(message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Require the caller to present the service-role key. */
export function requireServiceRole(req: Request): Response | null {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!token || token !== serviceRoleKey) {
    return unauthorizedResponse("Service role key required");
  }
  return null; // passed
}

/** Require a valid user JWT or service-role key. */
export async function requireAuth(
  req: Request
): Promise<
  | { userId: string; isServiceRole: boolean; error: null }
  | { userId: null; isServiceRole: false; error: Response }
> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "") || "";

  if (!token) {
    return { userId: null, isServiceRole: false, error: unauthorizedResponse() };
  }

  // Allow service-role callers (cron, internal orchestrators)
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (token === serviceRoleKey) {
    return { userId: "service-role", isServiceRole: true, error: null };
  }

  // Validate as user JWT
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader! } },
  });

  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return { userId: null, isServiceRole: false, error: unauthorizedResponse("Invalid token") };
  }

  return { userId: data.claims.sub as string, isServiceRole: false, error: null };
}
