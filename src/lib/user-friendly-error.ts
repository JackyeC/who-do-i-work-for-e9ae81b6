/**
 * Map thrown errors (especially Supabase / network) to short, human copy.
 * Avoid surfacing raw SQL, stack fragments, or internal codes in product UI.
 */
export function friendlyErrorMessage(err: unknown): string {
  if (err == null) return "Something went wrong. Try again in a moment.";
  if (typeof err === "string") {
    return shortenTechnical(err);
  }
  if (err instanceof Error) {
    return shortenTechnical(err.message);
  }
  if (typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return shortenTechnical((err as { message: string }).message);
  }
  return "Something went wrong. Try again in a moment.";
}

function shortenTechnical(message: string): string {
  const m = message.trim();
  if (!m) return "Something went wrong. Try again in a moment.";
  if (/network|failed to fetch|load failed|net::/i.test(m)) {
    return "Network issue — check your connection and try again.";
  }
  if (/jwt|session|auth|not authenticated|401/i.test(m)) {
    return "Your session may have expired. Sign in again.";
  }
  if (/permission denied|rls|row-level security|403/i.test(m)) {
    return "You don’t have permission for this action.";
  }
  if (/violates foreign key|duplicate key|unique constraint/i.test(m)) {
    return "This conflicts with existing data. Refresh and try again.";
  }
  if (/schema cache|does not exist|column/i.test(m) && m.length > 40) {
    return "The database may need the latest migration. See Launch health (admin) or your checklist.";
  }
  if (/edge function|non-2xx|functions/i.test(m) && m.length > 30) {
    return "A background service didn’t respond. Confirm edge functions are deployed.";
  }
  if (m.length > 140) {
    return "Something went wrong on our side. Try again in a moment.";
  }
  return m;
}
