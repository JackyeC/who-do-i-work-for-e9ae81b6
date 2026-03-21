

# Fix Ticker Company Links

## Problem
Two issues cause "company not found" when clicking ticker items:

1. **Wrong route**: Ticker links to `/company/{slug}` which is login-gated (`ProtectedRoute`). The public dossier page is at `/dossier/{slug}`.

2. **Slug mismatch**: The ticker generates slugs from `company_name` via regex (e.g. "Apple Inc." → `apple-inc`), but actual DB slugs differ (e.g. `apple`, `meta`, `google-alphabet`). Examples:
   - "Meta Platforms (Facebook)" → generates `meta-platforms-facebook`, actual slug: `meta`
   - "Alphabet Inc. (Google)" → generates `alphabet-inc-google`, actual slug: `google-alphabet`
   - "Apple Inc." → generates `apple-inc`, actual slug: `apple`

## Fix

### Step 1: Add `company_slug` to ticker query
- Modify `use-ticker-items.ts` to join against the `companies` table (via `company_name`) and return the real `slug`
- Since `ticker_items` doesn't have a `company_id` foreign key, we'll do a subquery or add the slug lookup in the query

**Alternative (simpler)**: Add a lookup in the component — fetch the slug from the `companies` table by matching `company_name`, or better yet, just query the slug inline in the existing ticker query using a Postgres subselect.

**Simplest approach**: Modify the `use-ticker-items.ts` query to also return a computed slug by joining companies on name. Since this is a Supabase client query and can't do arbitrary joins on non-FK columns easily, instead we'll:
- Fetch the company name → slug mapping separately
- Or modify `IntelligenceTicker.tsx` to use `/dossier/` route and look up slugs

### Step 2: Change link route from `/company/` to `/dossier/`
- In `IntelligenceTicker.tsx`, change the `Link` `to` from `/company/...` to `/dossier/{actual_slug}`

### Implementation approach
1. **`use-ticker-items.ts`**: Also fetch a slug map from `companies` table (names → slugs) alongside ticker items
2. **`IntelligenceTicker.tsx`**: Use the slug map to resolve the correct slug, link to `/dossier/{slug}` instead of `/company/{generated-slug}`

## Files to modify
- `src/hooks/use-ticker-items.ts` — add slug lookup helper
- `src/components/layout/IntelligenceTicker.tsx` — use real slugs and `/dossier/` route

