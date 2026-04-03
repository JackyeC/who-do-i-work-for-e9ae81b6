/**
 * Single place for Vite-exposed Supabase settings (browser bundle).
 * Dashboard "anon" / "publishable" key: accept both env names used across docs and Lovable output.
 */
export function getViteSupabaseUrl(): string {
  const u = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return typeof u === "string" ? u.trim() : "";
}

/** Same secret as Project Settings → API → anon (legacy) / publishable key. */
export function getViteSupabasePublishableKey(): string {
  const a = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const b = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const v = (typeof a === "string" && a.trim()) || (typeof b === "string" && b.trim()) || "";
  return v;
}
