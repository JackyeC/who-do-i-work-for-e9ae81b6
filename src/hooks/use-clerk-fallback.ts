import { useState, useEffect } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

const FALLBACK_TIMEOUT_MS = 3000;

/**
 * Wraps Clerk's useAuth with a 3-second fallback so the UI renders
 * even when Clerk fails to initialize (e.g. preview environments).
 */
export function useClerkWithFallback() {
  const clerkAuth = useClerkAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (clerkAuth.isLoaded) return;
    const id = setTimeout(() => setTimedOut(true), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [clerkAuth.isLoaded]);

  if (clerkAuth.isLoaded) return clerkAuth;

  if (timedOut) {
    return { ...clerkAuth, isLoaded: true as const };
  }

  return clerkAuth;
}
