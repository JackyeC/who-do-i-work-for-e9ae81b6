

# Redesign /check as Situation-Aware Decision Entry Point

## Overview
Replace the current tabbed layout (Company/Offer/Candidate) with a guided two-step flow: select your situation, then search a company and see personalized inline results — all on one page.

## Layout

```text
┌──────────────────────────────────────┐
│  SECTION 1: Situation Selector       │
│  "Before we check… what matters?"    │
│  [pill chips — max 3 selections]     │
├──────────────────────────────────────┤
│  SECTION 2: Company Search           │
│  "Now let's check this company"      │
│  [ search input ] [ Check button ]   │
├──────────────────────────────────────┤
│  SECTION 3: Inline Results           │
│  (appears after search/selection)    │
│  1. What This Means For You          │
│  2. Top Risks / Top Strengths        │
│  3. Compensation Context             │
│  4. Leadership & Influence           │
│  5. Contradictions                   │
│  6. Evidence / Sources               │
│  7. "View Full Dossier" CTA          │
└──────────────────────────────────────┘
```

## What Changes

### File: `src/pages/Check.tsx` — Full rewrite
- Remove the 3-tab layout (Company/Offer/Candidate)
- **Section 1**: Headline + subtext from prompt, then embed `<SituationSelector />` with custom headline/subtext
- **Section 2**: Search input. On submit, query the `companies` table by name (like SearchResults does). If found, set the selected company and load inline results. If not found, trigger `company-discover` edge function (same auto-discover pattern from SearchResults.tsx)
- **Section 3**: When a company is selected, fetch and display results inline using existing components:
  1. `PolicyIntelligenceSummary` — personalized summary with score, risks, strengths (uses `computePolicyScore` with user situations)
  2. `CompensationInsight` — pay transparency + hiring signals
  3. `LeadershipSnapshot` — executives and board
  4. `ValueConflictAlert` — contradictions from `company_public_stances`
  5. Evidence section — render sourced stances with dates and links
  6. CTA: "View Full Dossier →" linking to `/company/{slug}`

### Data Fetching (all inside Check.tsx)
When a company is selected, run parallel queries for:
- `companies` (core data)
- `company_public_stances` (for policy score + contradictions)
- `entity_linkages` (for policy score)
- `company_dark_money` (for policy score)
- `company_trade_associations` (for policy score)
- `company_lobbying_records` (for policy score)
- `company_signal_scans` (for policy score + compensation)
- `company_executives` (for leadership)

Then compute `PolicyScoreResult` via `computePolicyScore()` using the user's selected situations.

### Preserved Access to Offer & Candidate Tools
Add a small "Other tools" section at the bottom with compact cards linking to:
- Offer Check → `/check?tab=offer` or `/strategic-offer-review`
- What Am I Supporting → `/voter-lookup`

This keeps those features discoverable without cluttering the main decision flow.

## Components Reused (no changes needed)
- `SituationSelector` — situation chip picker
- `PolicyIntelligenceSummary` — score + risks/strengths
- `CompensationInsight` — pay context
- `LeadershipSnapshot` — executives/board
- `ValueConflictAlert` — contradictions
- `SituationContextBanner` — personalization strip

## Files Modified
- **`src/pages/Check.tsx`** — Full rewrite from tabbed layout to guided decision flow with inline results

## No new files, no database changes

