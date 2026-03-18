

## Problem

The "Set Preferences" and "Edit" links in `PersonalizationBanner.tsx` point to `/career-dashboard`, which doesn't exist as a route. The correct route is `/job-dashboard` (which renders `JobDashboard` with the Signal Preferences tab).

## Fix

**File: `src/components/jobs/PersonalizationBanner.tsx`**

Update both `<Link>` components:
- Line 62: Change `/career-dashboard` to `/job-dashboard` (the "Set Preferences" CTA)
- Line 99: Change `/career-dashboard` to `/job-dashboard` (the "Edit" button)

Optionally append a query param or set the tab so users land directly on the "Signal Preferences" tab (e.g., link to `/job-dashboard?tab=preferences`), and update `JobDashboard.tsx` to read the `tab` query param on mount to auto-select the correct tab.

## Steps

1. **Update links in PersonalizationBanner** -- change both `/career-dashboard` references to `/job-dashboard`
2. **Optional: deep-link to preferences tab** -- add `?tab=preferences` to the URLs and read `searchParams` in `JobDashboard` to initialize the tab state

