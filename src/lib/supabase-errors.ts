/**
 * Detect PostgREST / Supabase errors that usually mean the DB migration
 * has not been applied yet (missing table/column or stale schema cache).
 * In those cases the client can degrade gracefully instead of failing silently.
 */
export function isLikelyMissingSchemaObject(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string; details?: string };
  const msg = `${e.message || ""} ${e.details || ""}`.toLowerCase();
  if (msg.includes("schema cache") && msg.includes("could not find")) return true;
  if (msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation") || msg.includes("table"))) return true;
  if (msg.includes("permission denied") && msg.includes("application_email_dossiers")) return true;
  return false;
}
