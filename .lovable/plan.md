

# Job Board Overhaul — Inspired by 80,000 Hours

## What 80,000 Hours Does Well

The 80,000 Hours job board has a clear, powerful layout:
- **Three tabs**: Search Jobs / Explore Organisations / Recommended Jobs
- **Rich filter sidebar**: Areas (with counts), Country/Region, Experience, Education, Skill Set, Role Type, Salary, Organisation — all with item counts
- **Clean job cards**: Company logo, title, company name, location, category tags, experience level badges, "Highlighted role" badge, relative date
- **Keyword search** with keyboard shortcut
- **Job alerts** subscription
- **782 roles** with count displayed prominently

## Current State of WDIWF Job Board

You currently have **three separate job pages** that are fragmented:
1. `/jobs` → `JobIntegrityBoard` — the real board with database jobs, filters, integrity cards
2. `/job-board` → redirects to `/jobs`
3. `JobBoardEmbed` — an old Cavuno iframe embed (dead)
4. External RSS feed component (`ExternalJobFeed`) pulling from We Work Remotely, Remotive, Himalayas

The existing `JobIntegrityBoard` already has good bones (search, filter chips, clarity scores, values alignment) but the layout is a basic two-column card grid without the polished structure 80K Hours has.

## Proposed Overhaul

### 1. Three-Tab Navigation (like 80K Hours)

Replace the current single-view layout with tabs:
- **Search Jobs** — the current filtered job list, redesigned
- **Explore Companies** — browse companies in the database, with clarity scores and dossier links
- **Recommended** — personalized matches based on user's Work DNA quiz + job preferences (requires auth)

### 2. Redesigned Filter Panel

Replace the current collapsible filter area with a persistent **sidebar on desktop** (sheet on mobile):
- **Problem Areas** with counts (mapped to your data categories: Labor Policy, Climate, Equity, etc.)
- **Location / Region** with counts
- **Work Mode** (Remote, Hybrid, On-site)
- **Seniority Level** with counts
- **Department** with counts  
- **Salary Range** slider
- **Trust Level** (your existing vetted_status filter)
- **Intelligence Chips** kept as quick-toggles at the top: Pay Transparent, High Clarity, Values Aligned, Fresh Only

### 3. Better Job Cards

Redesign `JobIntegrityCard` to match the 80K Hours density:
- Company logo (left)
- Title + Company + Location (center)
- Category/department tags as colored badges
- Clarity Score badge (right, replacing "Highlighted role")
- Relative date (right)
- "Highlighted" or "Featured" badge for `is_featured` jobs

### 4. Results Header

Add a results bar showing: `{count} roles · Ranked` with sort options and links to Collections/Resources/FAQ.

### 5. Job Alerts

Add a "Set up alerts" button that subscribes users to email notifications for new jobs matching their filters (uses existing auth + a new `job_alerts` table).

### 6. Merge RSS Feed Jobs Inline

Instead of the separate `ExternalJobFeed` component below the main list, merge RSS feed jobs into the main results with a subtle "External" badge, so users see one unified list.

## Technical Plan

### Files to modify:
- **`src/pages/JobIntegrityBoard.tsx`** — Add tab navigation, sidebar layout, results header
- **`src/components/jobs/JobBoardFilters.tsx`** — Rebuild as a vertical sidebar with category counts
- **`src/components/jobs/JobIntegrityCard.tsx`** — Redesign to horizontal row format with logo
- **New: `src/components/jobs/ExploreCompaniesTab.tsx`** — Company directory tab
- **New: `src/components/jobs/RecommendedJobsTab.tsx`** — Personalized matches tab
- **New: `src/components/jobs/JobAlertSubscribe.tsx`** — Alert subscription modal

### Database:
- New `job_alerts` table for email subscription preferences (filters, frequency)
- RLS policies for authenticated users

### Layout structure:
```text
┌──────────────────────────────────────────────┐
│  Job Integrity Board                         │
│  "Know who you're really working for"        │
├──────────────────────────────────────────────┤
│  [Search Jobs] [Explore Companies] [Matches] │
├──────────┬───────────────────────────────────┤
│ FILTERS  │  Search bar          [Set alerts] │
│          │  Intelligence chips               │
│ Areas    │  ─────────────────────────────── │
│  ▸ Labor │  {count} roles · Ranked           │
│  ▸ Equity│  ┌─────────────────────────────┐ │
│          │  │ Logo  Title        Score  2d │ │
│ Location │  │       Company, Location      │ │
│ Seniority│  │       [tag] [tag] [tag]      │ │
│ Salary   │  └─────────────────────────────┘ │
│ Trust    │  ┌─────────────────────────────┐ │
│          │  │ ...next job...              │ │
│          │  └─────────────────────────────┘ │
└──────────┴───────────────────────────────────┘
```

This is a large overhaul. I recommend implementing it in phases — starting with the three-tab layout and sidebar filters, then the card redesign, then alerts.

