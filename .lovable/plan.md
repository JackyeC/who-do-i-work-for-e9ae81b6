

# Deepen the "Apply with WDIWF" Experience

## Summary

Replace the current small dialog in `ApplyWithWDIWF` with a right-side Sheet drawer that stays in context on the dossier page. This sheet fetches and displays live jobs for the active company, allows tracking applications, and includes apply-specific coaching. A new `/applications` list page gives users a home for tracked roles.

No existing components, routes, or backend logic are modified. This is purely additive.

---

## Changes

### 1. New: `ApplyDrawer` component
**File**: `src/components/applications/ApplyDrawer.tsx`

A right-side `Sheet` (from `src/components/ui/sheet.tsx`) that opens when the user clicks "Apply with WDIWF" from any dossier.

Contents (top to bottom):
- **Header**: Company name, verdict badge (reuses alignment/risk from EvaluationContext), one-line summary
- **Job list**: Queries `company_jobs` where `company_id = activeCompany.id` and `is_active = true`, limited to 10. Each row shows title, location, salary_range, and a simple alignment indicator (High/Medium/Low based on civic_footprint_score thresholds). Each row has "Track Application" and "View Details" (links to `/jobs/:id`) buttons.
- **Empty state**: "We don't see live roles for this employer right now." with "Save this company" (existing watchlist hook) and "Get notified when roles appear" (placeholder/toast).
- **Manual entry**: "Apply to a role not listed here" — expands a small inline form (job title + source free-text) that creates an application record with status "Considering".
- **Coaching section**: 2-3 bullets reusing the same signal flags passed to `WhatThisMeansForYou` but framed for application prep: what to highlight in your resume, what to watch for in the JD, one red flag to look for in interviews.

### 2. Update: `ApplyWithWDIWF` button
**File**: `src/components/applications/ApplyWithWDIWF.tsx`

Change the existing `Dialog` to instead open the new `ApplyDrawer`. The button itself stays identical. The old dialog code is replaced — not deleted as a separate file — within this same component.

### 3. Update: `DossierActionBridge`
**File**: `src/components/evaluation/DossierActionBridge.tsx`

The "Apply with intelligence" card currently renders `<ApplyWithWDIWF>`. Since that component now opens the drawer, no structural change is needed here — it inherits the new behavior automatically.

### 4. Application tracking: use existing `applications_tracker` table
The table already has all needed columns: `company_id`, `job_id`, `job_title`, `company_name`, `status`, `alignment_score`, `application_link`. The existing `useApplicationsTracker` hook handles insert/update/delete.

For the "Track Application" action on a listed job:
- Call `trackApplication.mutate()` with `status: "Considering"`, `job_id`, `job_title`, `company_name`, `company_id`
- Show inline confirmation: "Tracked. Find it under Applications."

For the manual entry:
- Same mutation, no `job_id`, user-typed `job_title`, optional source stored in `application_link`

### 5. New: `/applications` list page
**File**: `src/pages/Applications.tsx`

A simple, protected page using `useApplicationsTracker()` to list all tracked applications in a table/card layout:
- Columns: Company, Job Title, Status (Considering / Applied / Interview / Offer / Rejected), Last Updated
- Status is editable inline via dropdown (calls `updateStatus`)
- Each row links to the existing `/applications/:id` detail page

### 6. New route in `App.tsx`
Add: `<Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />`

### 7. Navigation entry
**File**: `src/components/layout/MarketingNav.tsx`

For authenticated users, add an "Applications" link in the nav (desktop and mobile) that appears conditionally — always visible once logged in, next to the Dashboard button. Uses a subtle badge showing count from `useApplicationsTracker().applications.length` if > 0.

---

## Technical Details

- **Sheet component**: Already exists at `src/components/ui/sheet.tsx`. Use `side="right"` for the drawer pattern consistent with person-entity and spending drawers.
- **Job query in ApplyDrawer**: Direct Supabase query on `company_jobs` filtered by `company_id` and `is_active = true`, ordered by `posted_at DESC`, limit 10. No new edge function needed.
- **Alignment indicator**: Simple threshold on civic_footprint_score: >= 70 = "High", 40-69 = "Medium", < 40 = "Low".
- **Coaching bullets**: Derived from the same boolean flags (hasLayoffs, hasEEOC, hasPoliticalSpending) already computed in CompanyDossier and available via EvaluationContext's activeCompany fields.
- **No database migration needed**: `applications_tracker` already supports `status` as a free-text string and accepts "Considering" as a value.

---

## Files touched

| File | Action |
|------|--------|
| `src/components/applications/ApplyDrawer.tsx` | Create |
| `src/components/applications/ApplyWithWDIWF.tsx` | Edit (swap Dialog for ApplyDrawer) |
| `src/pages/Applications.tsx` | Create |
| `src/App.tsx` | Edit (add /applications route) |
| `src/components/layout/MarketingNav.tsx` | Edit (add Applications nav link) |

No existing routes removed. No existing components deleted. No database changes.

