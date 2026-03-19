

## Go-Live Payment Plan

### What we're doing
Wire up all 5 Pathfinder tracks so every "Buy" button goes directly to Stripe Checkout — no more redirects to an interest form.

### Step 1: Create 3 missing Stripe products + prices
Using Stripe tools:
- **The Scout** — product "Scout AI Coach", price $19/mo (recurring monthly)
- **The Strategist** — product "Strategist Dossier", price $149 one-time
- **The Partner** — product "Partner Strategy Session", price $299 one-time

The Executive ($999/yr) already exists: `price_1TCTiJ7Qj0W6UtN9hARvCvgh`.

### Step 2: Update `use-premium.ts` with new tier entries
Add `scout`, `strategist`, and `partner` to the `STRIPE_TIERS` const with their new real price IDs and product IDs.

### Step 3: Rewrite `PathfinderTracks.tsx` checkout logic
- Replace all placeholder `priceId` values with the real Stripe price IDs
- Remove the guard clauses that redirect to `/work-with-jackye`
- Let every paid track call `create-checkout` directly

### Step 4: Update `create-checkout` edge function
Add the 3 new price IDs to the appropriate sets:
- Scout monthly → `SUBSCRIPTION_PRICES`
- Strategist one-time → `ONE_TIME_PRICES`
- Partner one-time → `ONE_TIME_PRICES`

This ensures the edge function uses the correct `mode` ("payment" vs "subscription") for each.

### Result
All 5 tracks will have working buy buttons that open Stripe Checkout in a new tab. Free tier routes to signup, paid tiers route to Stripe.

