

## Corporate Alignment Analyzer — Upgrade Plan

### What Already Exists

You already have significant infrastructure:
- **`company_public_stances`** table with `topic`, `public_position`, `spending_reality`, `gap` fields
- **`company_hypocrisy_index`** table with `chi_score`, `chi_grade`, `direct_conflicts`, `indirect_conflicts`, `aligned_stances`, `total_stances`
- **`AlignmentDashboard`** component — shows stance-by-stance "What they say vs What records show" with Aligned/Mixed/Gap badges
- **`HypocrisyIndexCard`** — circular score gauge with conflict breakdown
- **`ValueConflictAlert`** — surfaces say-do conflicts in the Values Lens
- **`EVPSayDoPanel`** — similar say-do analysis for the recruiting view
- **Evidence quality scoring** system with source tiers

The core data model and UI components are **already built**. What's missing is the *dedicated page experience* and the *automated claim extraction pipeline* you described.

### What Needs to Be Built

#### 1. New Dedicated Page: `/alignment/:slug` (Corporate Alignment Report)

A standalone, shareable page for each company that brings together everything into the 7-step flow you described:

- **Header**: Company name + overall Alignment Score (reuse `HypocrisyIndexCard` gauge)
- **Category Breakdown**: Per-issue alignment cards (Climate, Labor, Civil Rights, etc.) each showing score + level (Strong/Mixed/Low)
- **Side-by-Side View**: For each category, "What they say" vs "What records show" with evidence links (enhance `AlignmentDashboard` with expandable evidence panel)
- **Misalignment Alerts**: Flagged contradictions with confidence level (reuse `ValueConflictAlert` pattern)
- **Evidence Panel**: Tabbed source viewer per category (reuse `FullEvidenceLayer` pattern)
- **Transparency Safeguards Footer**: Three disclaimers as specified

#### 2. New DB Table: `company_corporate_claims`

Store extracted claims separately from stances to enable the claim → behavior comparison pipeline:

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Primary key |
| `company_id` | uuid FK | Link to company |
| `claim_text` | text | The verbatim claim |
| `claim_source` | text | Where it came from (ESG report, press release, etc.) |
| `claim_source_url` | text | Link to source document |
| `category` | text | Climate, Labor, Civil Rights, etc. |
| `extracted_at` | timestamptz | When claim was detected |
| `extraction_method` | text | ai_perplexity, manual, firecrawl |

#### 3. New DB Table: `company_alignment_categories`

Per-category alignment scores (the category-level breakdown):

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | Primary key |
| `company_id` | uuid FK | Link to company |
| `category` | text | Climate, Labor Rights, Civil Rights, etc. |
| `alignment_score` | integer | 0-100 |
| `alignment_level` | text | Strong, Mixed, Low |
| `claim_count` | integer | Number of claims detected |
| `signal_count` | integer | Number of behavior signals |
| `last_calculated` | timestamptz | Freshness |

#### 4. Edge Function: `extract-corporate-claims`

Uses Perplexity (already connected) to scan a company's public statements and extract structured claims:
- Input: company name/slug
- Process: Query Perplexity for ESG reports, press releases, corporate values pages
- Output: Structured claims categorized by issue area, saved to `company_corporate_claims`
- Subject to Jackye-in-the-Loop approval before going live

#### 5. Edge Function: `calculate-alignment-scores`

Compares claims against existing behavior signals (lobbying, donations, violations, lawsuits) already in the database:
- Pulls claims from `company_corporate_claims`
- Pulls signals from existing tables (`company_lobbying`, `company_environmental_violations`, `entity_linkages`, etc.)
- Computes per-category and overall alignment scores
- Saves to `company_alignment_categories` and updates `company_hypocrisy_index`

#### 6. UI Components

- **`CorporateAlignmentPage`** — the full dedicated page
- **`CategoryAlignmentCard`** — per-issue card with score, claim, signals, evidence links
- **`AlignmentOverviewBar`** — horizontal bar showing all categories at a glance
- Reuse existing `HypocrisyIndexCard`, `AlignmentDashboard`, `ValueConflictAlert`, `FullEvidenceLayer`

#### 7. Integration Points

- Add route `/alignment/:slug` to the router
- Link from `CompanyProfile.tsx` (where `AlignmentDashboard` already renders) to the full alignment page
- Add "Run Alignment Scan" button in the Founder Console for manual triggering
- Safeguard disclaimers on every view

### What This Does NOT Change

- The existing `AlignmentDashboard` and `HypocrisyIndexCard` on company profiles stay as-is (they become the summary view)
- The existing `company_public_stances` and `company_hypocrisy_index` tables remain — the new tables extend them
- No terminology changes needed — the codebase already uses "alignment" language consistently

### Technical Summary

| Layer | Action |
|---|---|
| Database | 2 new tables + RLS policies |
| Edge Functions | 2 new functions (claim extraction + score calculation) |
| Pages | 1 new route (`/alignment/:slug`) |
| Components | 3 new components, reuse 4 existing |
| Admin | "Run Alignment Scan" button in Founder Console |

