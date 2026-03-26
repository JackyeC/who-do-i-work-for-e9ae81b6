

## Fix Build Error, Then Test Stripe Checkout

### Problem
The edge function `parse-career-document/index.ts` uses `import("npm:mammoth@1.6.0")` — a dynamic npm import that Deno requires to be listed in a `deno.json` or resolved differently. This blocks **all** edge functions from deploying, including `create-checkout`.

### Step 1: Fix the mammoth import (line 27)

Replace the `npm:` dynamic import with an `esm.sh` URL import, which works out of the box in Deno edge functions:

```typescript
const mammoth = await import("https://esm.sh/mammoth@1.6.0");
```

This is a one-line change in `supabase/functions/parse-career-document/index.ts`.

### Step 2: Test Stripe checkout

Once the build succeeds, I'll use the browser to:
1. Navigate to `/pricing`
2. Click a paid tier button (e.g. "Get The Signal")
3. Verify the edge function responds and a Stripe Checkout session URL is returned
4. Confirm the redirect to Stripe's hosted checkout page

### Technical note
- The user must be logged in for checkout to work (the `create-checkout` function requires an auth token)
- If not logged in, I'll note that and verify the error handling is correct

