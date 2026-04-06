/**
 * Shared error-response helpers for edge functions.
 *
 * Log the real error server-side; return a generic message to the client
 * so internal details (Stripe codes, SQL errors, stack traces) never leak.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Return a sanitised JSON error response. */
export function safeErrorResponse(
  error: unknown,
  opts?: { status?: number; logPrefix?: string; headers?: Record<string, string> },
): Response {
  const status = opts?.status ?? 500;
  const prefix = opts?.logPrefix ?? "EDGE_FUNCTION";

  // Always log full detail server-side
  console.error(`[${prefix}] ERROR:`, error);

  // Choose a safe client-facing message based on status
  let clientMessage: string;
  switch (status) {
    case 400:
      clientMessage = "Invalid request";
      break;
    case 401:
      clientMessage = "Unauthorized";
      break;
    case 403:
      clientMessage = "Forbidden";
      break;
    case 404:
      clientMessage = "Not found";
      break;
    case 429:
      clientMessage = "Too many requests";
      break;
    default:
      clientMessage = "Request failed";
  }

  return new Response(JSON.stringify({ error: clientMessage }), {
    status,
    headers: { ...corsHeaders, ...(opts?.headers ?? {}), "Content-Type": "application/json" },
  });
}

/** Validate that a string is a UUID v4. */
export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
