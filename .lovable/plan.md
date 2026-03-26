

## Plan: Fix Build Error & Ensure DailyBriefing on Dashboard

### What's happening

1. **Build error**: `parse-career-document/index.ts` line 27 still has `npm:mammoth@1.6.0` (the previous fix didn't persist). This blocks all edge function deployment.
2. **DailyBriefing component**: Already exists as `src/components/DailyBriefingCard.tsx` and is already imported in `DashboardOverview.tsx` (line 4). No new file needed — it's already wired up.

### Actions

**Step 1 — Fix mammoth import (1-line change)**
In `supabase/functions/parse-career-document/index.ts` line 27, change:
```
const mammoth = await import("npm:mammoth@1.6.0");
```
to:
```
const mammoth = await import("https://esm.sh/mammoth@1.6.0");
```

**Step 2 — Confirm DailyBriefing is already live**
`DailyBriefingCard` is already imported and rendered in `DashboardOverview.tsx`. No additional wiring needed.

