

## Intelligence Update: Seed New Companies + Expand Alignment Signals + Add Verification Bounty

### Current State
- 193 companies in DB (169 verified, 5 active, 19 research_in_progress)
- 37 already flagged as startups, 18 have category_tags
- Only 9 institutional_alignment_signals across 3 companies (Walmart, Meta, Amazon)
- Dashboard status filter already fixed to include `verified`/`active`/`published`
- 6 requested companies (Anthropic, Deel, Solugen, CureMetrix, Terranox AI, Voxel Energy) do NOT exist yet

### Part 1: Seed 6 New High-Growth Companies

Insert into `companies` table with proper metadata:

| Company | Industry | is_startup | category_tags | record_status |
|---------|----------|------------|---------------|---------------|
| Anthropic | AI / Technology | true | ["AI Safety"] | verified |
| Deel | HR Tech / Fintech | true | ["HR Tech"] | verified |
| Solugen | Green Technology | true | [] | verified |
| CureMetrix | Healthcare AI | true | [] | verified |
| Terranox AI | Energy / AI | true | [] | verified |
| Voxel Energy | Renewable Energy | true | [] | verified |

Each gets a slug, founded_year, funding_stage, and a jackye_insight blurb.

### Part 2: Expand Institutional Alignment Signals

Seed ~30 new `institutional_alignment_signals` rows across major companies to populate the Heritage vs. Progressive filter on the job board:

**Heritage/Traditional signals** for: Amazon, Tesla, Meta, ExxonMobil, Lockheed Martin, JPMorgan Chase
- Institutions: Heritage Foundation, Alliance Defending Freedom, America First Legal, Ziklag Network

**Progressive signals** for: Apple, Microsoft, Google (if exists), Amazon (bipartisan)
- Institutions: Center for American Progress, Human Rights Campaign, Healthy Families Act supporters

This turns the job board's alignment toggle from empty to functional.

### Part 3: Archive Signal + Verification Bounty Feature

**New component**: `src/components/company/VerificationBountyCard.tsx`
- Shows on company profiles where `last_audited_at` is null or > 6 months old
- Displays an "Archive Signal" badge
- Button: "Is this receipt old? Update it for a $5 Credit"
- Clicking opens the existing community submission dialog (same as UpdateTheRecordButton)
- Adds a note that submissions go to admin for one-click approval

**Update**: `src/pages/CompanyProfile.tsx` — integrate the new card near the Narrative Gap section.

### Part 4: "Verified CIO Audit" Badge

**New component**: `src/components/company/CIOAuditBadge.tsx`
- A small gold badge displayed on company profiles where `last_audited_at` is within the past 30 days
- Text: "Verified CIO Audit · [Date]"
- Gold shield icon with subtle glow

**Update**: `src/pages/CompanyProfile.tsx` — show near the company header.

### Files to Create
- `src/components/company/VerificationBountyCard.tsx`
- `src/components/company/CIOAuditBadge.tsx`

### Files to Modify
- `src/pages/CompanyProfile.tsx` — integrate new components

### Database Operations (insert tool, not migrations)
- INSERT 6 new companies
- INSERT ~30 institutional_alignment_signals rows
- UPDATE `last_audited_at` on the 16 personally vetted companies (to enable CIO badge)

