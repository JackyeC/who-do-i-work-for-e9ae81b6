

## Plan: Add New DailyBriefing Component & Fix Build Error

### Problem
1. **Build error** — `parse-career-document/index.ts` line 27 still uses `npm:mammoth@1.6.0`, which Deno can't resolve. This blocks all edge function deployments.
2. **New component** — You've uploaded a redesigned `DailyBriefing.tsx` that reads from a `briefing_signals` table (not the existing `briefing_items` table). That table doesn't exist yet.

### Step 1 — Fix mammoth import (1-line change)
Change line 27 in `supabase/functions/parse-career-document/index.ts`:
```
npm:mammoth@1.6.0  →  https://esm.sh/mammoth@1.6.0
```

### Step 2 — Create `briefing_signals` table
The new component expects these columns:
- `id` (uuid, PK)
- `title` (text, not null)
- `summary` (text, nullable)
- `signal_type` (text, not null — values: intel, signal, clear, red_flag)
- `sector` (text, nullable)
- `source_name` (text, not null)
- `source_bias` (text, default 'unknown')
- `source_url` (text, nullable)
- `is_pinned` (boolean, default false)
- `is_active` (boolean, default true)
- `published_at` (timestamptz, default now)

RLS: public read for active records (matches existing briefing_items pattern).

### Step 3 — Add new component file
Save the uploaded `DailyBriefing.tsx` to `src/components/DailyBriefing.tsx`.

### Step 4 — Update dashboard import
In `src/components/dashboard/DashboardOverview.tsx`, replace the `DailyBriefingCard` import with `DailyBriefing` and swap the JSX tag. The old `DailyBriefingCard.tsx` remains for any other usages (e.g., `/briefing` page).

### What you'll see
A cleaner briefing card on the dashboard with filter tabs (All / Intel / Signal / Clear / Red flag), source-bias badges, pinned signals, and a "show older" toggle. It will be empty until `briefing_signals` is seeded with data.

