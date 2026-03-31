

# Values Profile — Full Rebuild

## Summary

Build `/values` as a 6-step guided editorial experience. 8 new files, 3 edited files. No database migration — maps to existing `user_values_profile` columns. Salary data stored in `notes` as JSON.

## Bug Fix

Index.tsx has an early return on line 34 (`if (!isLoaded || authLoading) return null`) after `usePageSEO` (line 20) but before no other hooks. The hooks (useState, useNavigate, useAuth, useClerkWithFallback, usePageSEO) are all called before line 34, so the hook order is stable. No fix needed — will verify at runtime.

## New Files

### 1. `src/pages/ValuesProfile.tsx` — Page Shell
- Step state machine (0–5 + summary = 7 views)
- Gold progress bar: width = `(step + 1) / 7 * 100%`
- `AnimatePresence` + `motion.div` fade/slide transitions
- localStorage draft: save after each step to `wdiwf-values-draft-v1`, restore on mount, clear after DB save
- Dark branded wrapper: inline styles for `#0A0A0E` bg, `#13121A` cards, `#F0EBE0` text, `#F0C040` gold
- Back/Next buttons, step label ("Step 2 of 6")
- On final "Save": check auth → if none, navigate to `/join` with return URL; if authed, upsert to `user_values_profile` via `(supabase as any).from("user_values_profile").upsert(payload, { onConflict: "user_id" })`
- Max-w-2xl centered container, mobile-first

### 2. `src/components/values/ForcedChoiceStep.tsx` — Step 1
6 scenario cards, binary A/B choice. One skip allowed. Each choice adjusts a local state object of column-name → number mappings.

Scenarios and column mappings:
1. "Pays above market / zero transparency" vs "Posts every salary band / pays median" → `pay_transparency_importance`, `benefits_importance`
2. "Strong DEI team / lobbies against workers" vs "No DEI program / clean labor record" → `dei_equity_importance`, `labor_rights_importance`
3. "Fast promotion / burns people" vs "Slower growth / stable leadership" → `worker_protections_importance`, `mission_alignment_importance`
4. "Full remote / weaker team culture" vs "In-office / strong team bonds" → `remote_flexibility_importance`, `community_investment_importance`
5. "Political transparency even if uncomfortable" vs "Stays out of politics, focuses on mission" → `political_transparency_importance`, `mission_alignment_importance`
6. "AI-forward / moves fast on automation" vs "Cautious on AI / prioritizes data privacy" → `ai_ethics_importance`, `data_privacy_importance`

Scoring: baseline 50. Winner gets +15. Loser stays at 50 (no reduction). Skip leaves both at 50.

### 3. `src/components/values/DealbreakersStep.tsx` — Step 2
Card grid (2-col mobile, 3-col desktop) with 10 categories. User picks up to 5, then marks top 2 as "walk-away." Each has an icon from lucide.

Categories → column mapping:
- Wage theft → `labor_rights_importance`
- Anti-union → `union_rights_importance`
- Environmental violations → `environment_climate_importance`
- AI hiring without disclosure → `ai_ethics_importance`
- Political spending opacity → `political_donations_importance`
- Safety violations → `workplace_safety_importance`
- Data privacy breaches → `data_privacy_importance`
- Discrimination records → `anti_discrimination_importance`
- Retaliation patterns → `worker_protections_importance`
- Executive ethics → `anti_corruption_importance`

Selected dealbreakers → set column to 92. Top 2 walk-away → set column to 98.

### 4. `src/components/values/WorkStyleStep.tsx` — Step 3
4 segmented button groups (not sliders):
- Growth vs Stability → `startup_vs_enterprise_preference` ("startup" | "enterprise")
- Big vs Small → `company_size_preference` ("large" | "small")
- Remote / Hybrid / In-person → `remote_flexibility_importance` (90 / 60 / 30)
- Mission-driven vs Compensation-driven → `mission_alignment_importance` (85 / 40)

### 5. `src/components/values/SalaryFloorStep.tsx` — Step 4
- Number input with dollar formatting for minimum salary
- Textarea for walk-away triggers
- Stored in draft state as `{ salary_floor: number, walk_away: string }`
- On final save, serialized into `notes` column as JSON string

### 6. `src/components/values/ValuesTopicsStep.tsx` — Step 5
12 topics, each with 4-option segmented control: Must-have (90) / Matters (70) / Flexible (40) / Don't care (10).

Topics → columns:
- Worker Protections → `worker_protections_importance`
- Inclusion → `dei_equity_importance`
- Leadership Ethics → `anti_corruption_importance`
- Compensation Fairness → `pay_equity_importance`
- Reproductive Healthcare → `reproductive_rights_importance`
- Education Access → `education_access_importance`
- Environment → `environment_climate_importance`
- Mission Alignment → `mission_alignment_importance`
- AI Ethics → `ai_ethics_importance`
- Pay Transparency → `pay_transparency_importance`
- Political Spending Transparency → `political_transparency_importance`
- Data Privacy → `data_privacy_importance`

Show all 12 in a scrollable list. On mobile, compact layout with topic name left-aligned and segmented buttons right-aligned.

Note: if a column was already set higher by Steps 1-2 (e.g. dealbreaker at 92), the Step 5 value only applies if it's higher. We take `Math.max` across all steps when building the final payload.

### 7. `src/components/values/ValuesSummaryCard.tsx` — Step 6 (Summary)
Computed from accumulated state:
- **Top 5 Values**: highest-weighted columns, displayed as gold-accented tags
- **Dealbreakers**: columns ≥ 90, with top 2 walk-away highlighted
- **Risk Tolerance**: label derived from dealbreaker count + growth pref (Conservative / Moderate / Open)
- **Growth vs Stability**: from Step 3
- **Salary Floor**: from Step 4 (if set)
- **Employer Fit Summary**: generated sentence like "You're looking for a mission-driven employer with strong pay transparency and clean labor records."
- **Employer Warning Summary**: generated sentence like "Watch out for companies with political spending opacity, discrimination history, or AI hiring without disclosure."

Each section is clickable → navigates back to that step for editing. CTA: "Save My Values Profile" button. Trust line below CTA.

### 8. `src/components/values/useValuesFlow.ts` — Shared Hook
Central state management hook:
- `draft` state object with all step data
- `loadDraft()` / `saveDraft()` for localStorage
- `buildPayload()` merges all steps into one `user_values_profile` upsert object using `Math.max` for overlapping columns
- `saveToDb(userId)` does the upsert and clears draft

## Edited Files

### `src/App.tsx`
- Add: `const ValuesProfile = lazy(() => import("./pages/ValuesProfile"));`
- Add route: `<Route path="/values" element={<ValuesProfile />} />`
- Change line 280: `/my-values` redirect from `/dashboard?tab=values` to `/values`

### `src/components/layout/AppShell.tsx`
- Add `"/values"` to `MARKETING_PAGES` array

### `src/components/layout/MarketingNav.tsx`
- Add "Values Profile" link to `PRIMARY_LINKS` array pointing to `/values`

## Technical Details

- All DB access uses `(supabase as any).from("user_values_profile")` pattern (consistent with existing code)
- framer-motion `AnimatePresence` + `motion.div` for step transitions
- No new dependencies needed
- No database migration needed
- Mobile-first: all layouts work at 375px width minimum

