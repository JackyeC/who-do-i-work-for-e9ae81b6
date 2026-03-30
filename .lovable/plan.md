

# Fix Build Errors

## Errors Summary

1. **SignupModal.tsx:34** and **Login.tsx:74,87** — `signInWithOAuth` called with 2 args instead of 1 object
2. **use-linkedin.ts:26-36** — `linkedin_profiles` table not in generated types, causing TS2589/TS2769/TS2345
3. **Quiz.tsx:985,1073,1078** — `showShareModal` / `setShowShareModal` not declared in `ResultsScreen`

## Fixes

### 1. SignupModal.tsx (line 34)
Change:
```ts
await supabase.auth.signInWithOAuth("google", { redirectTo: ... })
```
To:
```ts
await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })
```

### 2. Login.tsx (lines 74, 87)
Same fix for both Google and Apple `signInWithOAuth` calls — use single-object argument.

### 3. use-linkedin.ts (lines 26-36)
Cast supabase client to `any` and cast result to `LinkedInProfile | null`:
```ts
const { data, error } = await (supabase as any)
  .from("linkedin_profiles")
  .select("linkedin_id, name, email, profile_picture_url, expires_at")
  .eq("user_id", user.id)
  .maybeSingle();
// ...
setLinkedinProfile(data as LinkedInProfile | null);
```

### 4. Quiz.tsx (line 841)
Add state declaration inside `ResultsScreen` before the return:
```ts
const [showShareModal, setShowShareModal] = useState(false);
```

