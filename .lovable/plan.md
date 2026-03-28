

# LinkedIn Integration Deployment Plan

## What needs to happen

1. **Run the migration** to create the `linkedin_profiles` table (file already exists at `supabase/migrations/20260327220000_linkedin_profiles.sql`)

2. **Set secrets** — `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` already exist per the secrets list. `PUBLIC_SITE_URL` needs to be added.

3. **Deploy the three edge functions** — they already exist in the repo and are configured in `config.toml`. They just need deployment.

4. **Fix the 4 recurring build errors** that block deployment:
   - `_shared/linkedin.ts:89` — cast `imageBytes as unknown as BodyInit`
   - `check-subscription/index.ts:46` — change `userData.user` → `userData?.user`
   - `company-intelligence-scan/index.ts:128` — change to `!!(roleData && roleData.length > 0)`
   - `company-research/index.ts:226-235` — type `deletions` as `Array<PromiseLike<any>>` and append `.then()` to each `.delete()` call

## Steps (in order)

1. Apply the migration SQL via the migration tool
2. Add the `PUBLIC_SITE_URL` secret (the other two LinkedIn secrets already exist)
3. Fix the 4 TypeScript build errors in the edge function files
4. Deploy the three LinkedIn edge functions

## Technical details

- The migration creates `linkedin_profiles` with RLS policies for user self-access and service role full access
- The `linkedin-auth` function redirects users to LinkedIn OAuth
- The `linkedin-callback` function exchanges the code for a token, upserts the profile, and generates a magic link session
- The `linkedin-share-certificate` function posts certificates to LinkedIn with optional image upload
- All three functions are already set to `verify_jwt = false` in `config.toml`

