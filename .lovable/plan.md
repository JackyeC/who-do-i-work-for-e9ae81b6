

# Fix "Your Recent Work" — It's Reading the Wrong Table

## The Problem

"Your Recent Work" pulls from `tracked_companies`, which is the premium watchlist table. You have to explicitly click "Track" on a company AND have an active subscription for anything to show up there.

Opening a dossier, running a Check, or browsing a company profile does not write to `tracked_companies`. So unless you manually tracked companies through the slot system, this section stays empty.

The old `useScanTracker` hook writes to `company_scan_events`, but RLS blocks non-admin inserts there. And it only runs on `/company/:id`, not on `/dossier/:id` or `/check`.

## What We Build

### 1. New table: `user_recent_company_views`
A lightweight per-user audit trail. Columns: `id`, `user_id`, `company_id`, `company_name`, `viewed_at`. RLS: users can only read/write their own rows. Upsert on `(user_id, company_id)` so repeated views just update `viewed_at`.

### 2. Update `useScanTracker` to write to the new table
Switch from `company_scan_events` (admin-only) to `user_recent_company_views`. Upsert instead of insert. Invalidate the dashboard query on success so the section refreshes live.

### 3. Wire tracking on all audit routes
Currently only runs on `CompanyProfile`. Add it to:
- `CompanyDossier` (the `/dossier/:slug` page)
- `Check` component (when a company is selected)

### 4. Update the dashboard to read from the new table
Change `useDashboardBriefing` to query `user_recent_company_views` joined with `companies` (for name, slug, score, industry) instead of relying on `tracked_companies`. Keep tracked companies as a secondary source so both paid tracking AND casual browsing show up.

### 5. Keep existing empty state copy
"Your lens is clear" / "No companies audited yet" stays. It will just actually populate now.

## Technical Detail

- **Migration**: Creates `user_recent_company_views` with RLS policies for authenticated users (SELECT/INSERT/UPDATE own rows only), plus a unique constraint on `(user_id, company_id)` for upsert.
- **`use-scan-tracker.ts`**: Switches target table, adds `user_id` field, uses upsert, invalidates `dashboard-briefing` query key.
- **`use-dashboard-briefing.ts`**: Adds a parallel query to `user_recent_company_views` joined with `companies`. Merges with tracked companies, deduplicates by company ID, sorts by most recent view.
- **Dossier/Check pages**: Import and call `useScanTracker` with the company ID and name.
- **No backfill**: Past visits won't appear. First time you open any company after this ships, it starts recording.

