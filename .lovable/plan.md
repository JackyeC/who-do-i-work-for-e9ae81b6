

# Fix All Build Errors to Enable Deployment

## Problem
6 files have errors blocking the build. The domain setup requires a working deployment.

## Changes

### 1. Fix syntax error in `supabase/functions/_shared/linkedin.ts` (line 12)
Missing closing quote on `response_type: 'code` → should be `response_type: 'code',`

### 2. Fix OAuth calls in `src/components/SignupModal.tsx` (line 34) and `src/pages/Login.tsx` (lines 74, 87)
Change from 2-argument form `signInWithOAuth("google", { redirectTo })` to single-object form:
```typescript
supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })
```
Same for Apple provider.

### 3. Fix `src/hooks/use-linkedin.ts` (lines 26-36)
Replace direct `.from("linkedin_profiles")` query with RPC call using `any` cast:
```typescript
const { data } = await (supabase as any).rpc("get_my_linkedin_profile");
setLinkedinProfile((data as LinkedInProfile | null) ?? null);
```

### 4. Fix `src/pages/Quiz.tsx` (lines 985, 1073, 1078)
Add missing state declaration inside `ResultsScreen`:
```typescript
const [showShareModal, setShowShareModal] = useState(false);
```

## After build succeeds
User can connect `www.jackyeclayton.com` in Project Settings → Domains.

