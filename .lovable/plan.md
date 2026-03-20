

## Status Check: What's Done vs What's Missing

### DONE (already built)
- **Prompt 1** (Signup/Waitlist form) — `waitlist` table exists, forms work
- **Prompt 2** (Homepage Hero) — Hero exists with headline, subheadline, CTAs (slightly different wording than spec)
- **Prompt 3** (How It Works) — Present on homepage
- **Prompt 4** (Mission Alignment Layer) — Mission categories, narrative gap detection, scoring all exist across company profiles
- **Prompt 5** (DNA Calibration Sliders) — Work DNA quiz and sliders exist at `/quiz` and in dashboard
- **Prompt 6** (Auto-Apply Onboarding) — `/auto-apply` page exists with multi-step wizard
- **Prompt 7** (Sample Dossier) — `/dossier` page exists
- **Prompt 8** (Pricing) — `/pricing` page exists
- **Prompt 9** (About) — `/about` page exists
- **Prompt 10** (Applications Dashboard) — "My Applications" tab exists in Job Dashboard at `/job-dashboard`
- **Prompt 11** (Auto-Apply backend connection) — POST to Render API wired up
- **Prompt 12** (Companies Directory) — `/companies` page exists with filters, cards, scores
- **Prompt 14** (Employer Onboarding) — `/for-employers` page exists with 3-step form
- **GNews live feed** — Connected and working
- **Aligned Values Search** — Dashboard component pulls from real `companies` table
- **Theme persistence** — Light/dark mode fixed across major components

### NOT DONE
- **Prompt 13** (Candidate Repository / Talent Pool at `/talent`) — **Not built.** No `/talent` page or route exists. This is the employer-facing side where verified employers browse anonymized candidate cards.
- **Prompt 15** (Two-sided platform cards on homepage) — **Partially done.** The homepage has path cards via `PathfinderTracks` but they don't match the spec (FOR CANDIDATES / FOR ORGANIZATIONS side-by-side with "No bias. Just receipts." centered below).

### Plan: Build the Missing Pieces

**1. Create `src/pages/Talent.tsx`** — Employer-only candidate discovery page

- Gate with existing `EmployerRoute` pattern (check for `employer` role in `user_roles`)
- Headline: "Mission-aligned candidates, ready to contribute."
- Anonymized candidate cards showing: initials avatar, target roles, top 3 DNA values, mission alignment score, impact competencies tags, work orientation slider position, experience level
- Filters: role type, impact competencies, alignment score threshold, location, experience
- "Request Introduction" button (stores interest in a new `introduction_requests` table or shows a premium gate)
- Bottom note about bias reduction (no photos, no names)
- Uses sample/hardcoded candidate data for now (no real candidate profiles table yet)

**2. Update `src/App.tsx`** — Add route

- Lazy import `Talent` page
- Add route `/talent` wrapped in employer role check

**3. Update Homepage two-sided cards** (`src/pages/Index.tsx`)

- Add or update the section below the hero to show two clear path cards:
  - FOR CANDIDATES → `/auto-apply`
  - FOR ORGANIZATIONS → `/for-employers`
- Centered line below: "No bias. Just receipts."

**4. Database migration** (if needed)

- Optionally create an `introduction_requests` table for the "Request Introduction" flow, or defer and use a toast/modal for now

### Technical Notes
- Follows existing patterns from `Companies.tsx` for card layout and filtering
- Uses `useUserRole` hook for employer access gating
- No new dependencies needed
- Sample candidate data hardcoded initially, swappable for DB later

