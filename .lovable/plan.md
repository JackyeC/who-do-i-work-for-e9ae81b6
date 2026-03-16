

# Intelligence Engine Build Plan

## Current State

The platform already has strong foundations:
- **187 companies** in the database (target: 500+)
- Browse page, Company Profiles, Corporate Impact Map, Signal Feed all functional
- Political signals (PAC, lobbying, contracts), WARN notices, HR tech detection all live
- Founder Console with admin analytics exists
- Parent company tracking, board interlocks, influence scoring all implemented
- Multiple scoring systems (CBI, RRS, GTM, Layoff Probability) already exist

## What Needs Building (Phased)

### Phase 1: Schema Enrichment + Career Intelligence Score

**Database migration** — Add missing columns to `companies`:

| Column | Type | Purpose |
|--------|------|---------|
| `sub_industry` | text | Granular category (e.g., "Cloud Computing" under "Technology") |
| `founded_year` | integer | Company founding year |
| `funding_stage` | text | Seed/Series A-F/Public/Bootstrapped |
| `is_startup` | boolean | Startup flag |
| `market_cap` | bigint | Market capitalization |
| `founder_names` | text[] | Founder name array |
| `founder_previous_companies` | text[] | Prior companies of founders |
| `category_tags` | text[] | Multi-tag: HR Tech, Big Tech, Defense, etc. |
| `career_intelligence_score` | numeric(3,1) | Computed 0-10 score |

**Career Intelligence Score** — New 0-10 composite score computed from existing signals:
- 0.20 × salary_transparency (from compensation data presence)
- 0.15 × layoff_risk (inverted WARN notice count)
- 0.15 × lobbying_activity (normalized lobbying spend)
- 0.20 × employee_sentiment (from worker_sentiment data)
- 0.15 × hiring_stability (job posting patterns)
- 0.15 × executive_turnover (leadership changes)

Displayed prominently on company profiles as a gauge/score card.

### Phase 2: Preload 500+ Companies

**Edge function: `seed-company-intelligence`** — Batch-inserts ~350 additional companies across target categories:
- HR Tech (Workday, Greenhouse, Lever, Ashby, SmartRecruiters, iCIMS, Paradox, Eightfold, Gem, HireVue, Findem, Textio, GoodTime + more)
- Big Tech (already have most)
- Finance (JPMorgan, Morgan Stanley, Citi, BlackRock, etc.)
- Energy (Chevron, BP, Shell, ConocoPhillips, etc.)
- Healthcare (UnitedHealth, Cigna, Anthem, HCA, etc.)
- Defense (Lockheed Martin, Raytheon, Northrop Grumman, etc.)
- Retail (Walmart, Target, Costco, Home Depot, etc.)
- Government Contractors (Booz Allen, SAIC, Leidos, etc.)
- Startups (Rippling, Gusto, Deel, Remote, etc.)

Each seeded with `category_tags`, `is_startup`, `founded_year`, `funding_stage` where known. Then trigger `bulk-refresh-companies` to enrich via existing OSINT pipeline.

### Phase 3: Homepage Intelligence Dashboard

Replace/augment the homepage with **dynamic intelligence panels** pulling live data:

```text
┌──────────────────────────────────────────┐
│  Homepage Intelligence Dashboard         │
├──────────┬──────────┬──────────┬─────────┤
│ Trending │ Fastest  │ HR Tech  │ Layoff  │
│Companies │ Growing  │ Index    │ Watch   │
│ (10)     │ Startups │ (10)     │ (10)    │
│          │ (10)     │          │         │
├──────────┴──────────┼──────────┴─────────┤
│ High Lobbying       │ Most Transparent   │
│ Influence (10)      │ Employers (10)     │
├─────────────────────┴────────────────────┤
│ Heavy Gov Contracts (10)                 │
└──────────────────────────────────────────┘
```

New component: `src/components/landing/IntelligenceDashboard.tsx`
- Each panel is a card with company name, score, key metric
- Data from existing DB columns — no new API calls
- Lazy-loaded below the hero for performance
- Queries: `ORDER BY lobbying_spend DESC`, `WHERE is_startup = true`, `WHERE category_tags @> '{HR Tech}'`, etc.

### Phase 4: Startup DNA Section

New component: `src/components/company/StartupDNACard.tsx`
- Renders on company profile when `is_startup = true`
- Shows: founder_names, founder_previous_companies, funding_stage, founded_year
- "Startup DNA" branded section with the Bloomberg aesthetic

### Phase 5: Recruiter Intelligence View

New component: `src/components/company/RecruiterIntelligencePanel.tsx`
- Displayed on company profile when persona = "recruiter"
- Cards with color indicators for: Recruiting Difficulty, Offer Acceptance Prediction, Time to Fill, Comp Market Position, Talent Reputation, Attrition Risk
- Computed from existing signals (job count, WARN data, compensation data, sentiment)

### Phase 6: Media Narrative Card

New component: `src/components/company/MediaNarrativeCard.tsx`
- Aggregates from existing `company_report_sections` (news section) and `company_reputation_signals`
- Displays: positive/neutral/negative coverage breakdown
- Shows recent controversies from reputation signals

### Phase 7: Enhanced Browse Page

Update `/browse` with new filter chips:
- Industry, Startup, Public Company, Government Contractor, HR Tech, High Lobbying Influence
- Uses new `category_tags` and `is_startup` columns
- Sort by Career Intelligence Score

### Phase 8: Admin Enhancements

Add to Founder Console:
- Most viewed companies (from page view tracking)
- Most controversial employers (highest negative signal count)
- Popular filters (from search intelligence)
- User growth chart

---

## Technical Notes

- All new homepage panels use **cached DB queries** (no real-time API calls) for sub-1.5s loads
- Career Intelligence Score computed via a database function (triggered on data updates) so it's always pre-calculated
- Company seeding uses an edge function for batch insert with `ON CONFLICT DO NOTHING` to avoid duplicates
- The `category_tags` column uses PostgreSQL text arrays with GIN index for fast filtering
- All new components lazy-loaded and follow existing Bloomberg aesthetic patterns

## Implementation Order

Phases 1-2 first (schema + data), then 3 (homepage dashboard), then 4-8 in parallel. Estimated: 6-8 implementation rounds.

Shall I proceed with Phase 1 (schema enrichment + Career Intelligence Score)?

