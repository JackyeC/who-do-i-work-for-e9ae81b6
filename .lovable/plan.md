

## Plan: Lock Down Database Security

### Current State
Good news: **All 12 database functions already have `search_path = public` set.** There is no "Function Search Path Mutable" issue. That's already fixed.

The actual linter warnings (all 12) are about **permissive RLS policies** — policies using `USING (true)` or `WITH CHECK (true)` on INSERT/UPDATE/DELETE/ALL operations. These allow any authenticated user (or in some cases, anyone) to write data that should be restricted to service-role or admin-only operations.

### Affected Tables and Policies (22 policies across 17 tables)

| Table | Policy | Operation | Problem |
|-------|--------|-----------|---------|
| `board_interlocks` | Service insert | INSERT | Says "Service" but allows all |
| `climate_signals` | Service role full access | ALL | Says "Service" but allows all |
| `companies` | Authenticated users can insert | INSERT | Any user can create companies |
| `company_report_sections` | Authenticated inserts/updates | INSERT/UPDATE | Any user can modify reports |
| `company_sanctions_screening` | Authenticated inserts/updates | INSERT/UPDATE | Any user can modify sanctions |
| `company_wikidata` | Authenticated inserts/updates | INSERT/UPDATE | Any user can modify wikidata |
| `compensation_data` | Service role can manage | ALL | Says "Service" but allows all |
| `contradiction_signals` | Service role can manage | ALL | Says "Service" but allows all |
| `email_signups` | Anyone can sign up | INSERT | Intentional — keep as-is |
| `employer_rebuttals` | Anyone can insert | INSERT | Intentional — keep as-is |
| `gun_industry_signals` | Service insert | INSERT | Says "Service" but allows all |
| `healthcare_signals` | Service insert | INSERT | Says "Service" but allows all |
| `immigration_signals` | Service insert | INSERT | Says "Service" but allows all |
| `job_click_events` | Anyone can log clicks | INSERT | Intentional — keep as-is |
| `leader_enrichments` | Service role can manage | ALL | Says "Service" but allows all |
| `regulatory_violations` | Service insert | INSERT | Says "Service" but allows all |
| `scan_jobs` | Authenticated inserts/updates | INSERT/UPDATE | Any user can create/modify scan jobs |

### Fix Strategy

**Keep as-is (intentional public access):**
- `email_signups` — public signup form
- `employer_rebuttals` — public rebuttal submission
- `job_click_events` — anonymous click tracking

**Lock down to admin-only** (these are populated by edge functions using service-role key, not by regular users):
- `board_interlocks`, `climate_signals`, `compensation_data`, `contradiction_signals`, `gun_industry_signals`, `healthcare_signals`, `immigration_signals`, `leader_enrichments`, `regulatory_violations`, `signal_sources`

**Lock down to owner/admin** (user-generated but should be scoped):
- `companies` INSERT — restrict to admin via `has_role()`
- `company_report_sections` — restrict to admin
- `company_sanctions_screening` — restrict to admin
- `company_wikidata` — restrict to admin
- `scan_jobs` — restrict INSERT/UPDATE to the owning user (`auth.uid()`)

### Migration SQL

One migration that:
1. Drops the 19 overly-permissive policies
2. Recreates them with proper conditions:
   - "Service" policies → `USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'))`
   - `scan_jobs` → `USING (auth.uid() = user_id)` / `WITH CHECK (auth.uid() = user_id)`
   - Public-facing tables → left unchanged

### No Code Changes Required
These are all backend-only policy fixes. No UI or edge function changes needed — edge functions already use the service-role key which bypasses RLS.

