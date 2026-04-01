import { useState, useEffect } from "react";

let useClerkAuthSafe: () => any;
try {
  // Only import if ClerkProvider is available
  const clerk = require("@clerk/clerk-react");
  useClerkAuthSafe = clerk.useAuth;
} catch {
  useClerkAuthSafe = () => ({ isLoaded: false });
}

const FALLBACK_TIMEOUT_MS = 3000;

/**
 * Wraps Clerk's useAuth with a 3-second fallback so the UI renders
 * even when Clerk fails to initialize (e.g. preview environments).
 */
export function useClerkWithFallback() {
  const [timedOut, setTimedOut] = useState(false);

  // Detect if we're outside ClerkProvider
  let clerkAuth: any;
  let hasProvider = true;
  try {
    clerkAuth = useClerkAuthSafe();
  } catch {
    hasProvider = false;
    clerkAuth = { isLoaded: false, isSignedIn: false, userId: null };
  }

  useEffect(() => {
    if (!hasProvider || clerkAuth.isLoaded) return;
    const id = setTimeout(() => setTimedOut(true), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [hasProvider, clerkAuth.isLoaded]);

  if (!hasProvider) {
    return { ...clerkAuth, isLoaded: true as const, isFallback: true };
  }

  if (clerkAuth.isLoaded) return { ...clerkAuth, isFallback: false };

  if (timedOut) {
    return { ...clerkAuth, isLoaded: true as const, isFallback: true };
  }

  return { ...clerkAuth, isFallback: false };
}
