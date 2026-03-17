

# Phase 3: Application Progress Stepper + Employer Analytics Dashboard

## What exists today
- **TrackingDashboard.tsx** — flat list of applications with status dropdowns (Draft/Submitted/Interviewing/Offered/Rejected/Withdrawn), notes, and delete. No visual pipeline.
- **DashboardOverview.tsx** — basic stats (count of apps, alerts, values). No employer-level analytics.
- **IntelligenceReports.tsx** — cross-company signal analytics (lobbying, PAC spending charts). This is platform-wide, not user-specific.

## Plan

### 1. Application Progress Stepper
Replace the status dropdown in `TrackingDashboard.tsx` with a visual step indicator showing the pipeline stages as a horizontal stepper (Draft → Submitted → Interviewing → Offered → Accepted/Rejected).

- Build a `ApplicationStepper` component — horizontal dots/lines showing each stage, current stage highlighted, past stages filled
- Clicking a stage updates the status (same upsert logic, just better UI)
- Add a Kanban-style summary bar at the top: counts per stage with colored indicators
- Show the saved cover letter (from the new `cover_letter_text` column) in the expanded card view

### 2. Employer Analytics Dashboard
Add a personal analytics section to the dashboard showing the user's application intelligence:

- **Response rate**: % of applications that moved past "Submitted"
- **Pipeline funnel**: visual breakdown of how many apps are at each stage
- **Top applied industries/companies**: which sectors the user targets most
- **Average time in stage**: how long applications sit at each status
- **Alignment score distribution**: histogram of civic alignment scores across applied companies

Build this as a new `ApplicationAnalytics` component rendered in a new tab or section of the Jobs page / Dashboard.

### Implementation Steps

1. **Create `ApplicationStepper.tsx`** — reusable horizontal step indicator with clickable stages
2. **Update `TrackingDashboard.tsx`** — replace dropdown with stepper, add pipeline summary bar, show cover letter in expanded view
3. **Create `ApplicationAnalytics.tsx`** — funnel chart, response rate, industry breakdown, alignment distribution
4. **Wire into Dashboard** — add analytics as a new tab alongside existing tracking view

### Tech notes
- Use recharts (already installed) for funnel/bar charts
- All data comes from `applications_tracker` — no new tables needed
- Cover letter display uses the `cover_letter_text` column added in Phase 2

