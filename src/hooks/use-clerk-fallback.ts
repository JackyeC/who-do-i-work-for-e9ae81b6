import { useState, useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

const FALLBACK_TIMEOUT_MS = 3000;

const EMPTY_AUTH = {
  isLoaded: true as const,
  isSignedIn: false as const,
  userId: null,
  sessionId: null,
  orgId: null,
  orgRole: null,
  orgSlug: null,
};

/**
 * Wraps Clerk's useAuth with a 3-second fallback so the UI renders
 * even when Clerk fails to initialize (e.g. preview environments
 * where ClerkProvider is not mounted).
 */
export function useClerkWithFallback() {
  const [timedOut, setTimedOut] = useState(false);
  const [noProvider, setNoProvider] = useState(false);

  // We must call hooks unconditionally, so we always call useClerkAuth
  // but catch the error it throws when ClerkProvider is absent.
  let clerkAuth: any = EMPTY_AUTH;
  try {
    clerkAuth = useClerkAuth();
  } catch {
    // Will be caught on first render; set flag via effect to avoid
    // setState-during-render warnings.
    if (!noProvider) {
      // Use a microtask to set state outside render
      Promise.resolve().then(() => setNoProvider(true));
    }
    return { ...EMPTY_AUTH, isFallback: true };
  }

  useEffect(() => {
    if (clerkAuth.isLoaded) return;
    const id = setTimeout(() => setTimedOut(true), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [clerkAuth.isLoaded]);

  if (clerkAuth.isLoaded) return { ...clerkAuth, isFallback: false };

  if (timedOut) {
    return { ...clerkAuth, isLoaded: true as const, isFallback: true };
  }

  return { ...clerkAuth, isFallback: false };
}
