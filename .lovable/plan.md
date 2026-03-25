

## Problem: Flash / stuck page in ProtectedRoute

The root cause is in `ProtectedRouteInner` (line 53-55 of `ProtectedRoute.tsx`):

```typescript
// If Supabase user isn't loaded yet, show content
if (!user) {
  return <>{children}</>;  // ← Shows protected page to unauthenticated users
}
```

When the auth state is settling (Clerk loaded but Supabase session not yet synced), `loading` finishes as `false` and `user` is `null`. Instead of redirecting to login, it **renders the protected content**. Then when the auth state updates again (or doesn't), the page either stays stuck showing content it shouldn't, or flashes away to login.

Additionally, when Clerk is in **fallback mode** (after the 3-second timeout), the `SignedIn`/`SignedOut` wrappers are bypassed entirely, so there's no redirect to `/login` for unauthenticated users — they go straight to `ProtectedRouteInner` which renders children.

### Fix

**File: `src/components/ProtectedRoute.tsx`**

1. Change the `!user` check in `ProtectedRouteInner` to redirect to `/login` instead of rendering children — the original comment was a workaround that introduces the flash.

2. Add a brief grace period (e.g. 2 seconds) after `loading` finishes to allow the Clerk→Supabase bridge to complete before redirecting. If `user` is still `null` after the grace period, redirect to `/login`.

```text
ProtectedRouteInner flow (after fix):

  loading/roleLoading/waitlistLoading? → spinner
  user is null AND grace period not elapsed? → spinner
  user is null AND grace period elapsed? → redirect /login
  user exists, not approved? → waitlist gate
  user exists, approved? → render children
```

3. Keep the existing dossier route bypass (line 17-18) unchanged — dossier pages are intentionally public.

### Scope

- **1 file changed**: `src/components/ProtectedRoute.tsx`
- No database changes
- No new dependencies

