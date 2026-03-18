

# Situation-Aware Policy Intelligence Module — Implementation Plan

## Overview
Build a new module that combines user "situation" selection with company policy/governance data to produce a personalized Policy Score (0–100) with mismatch detection and plain-language guidance.

## Architecture

Two main components:
1. **Standalone page** (`/policy-intelligence`) — situation selector + company search + full report
2. **Embeddable card** — compact version for Company Dossier integration

## Data Sources (All Existing)
- `company_public_stances` — public claims vs spending reality + gap field
- `entity_linkages` — lobbying, donations, revolving door, trade associations
- `company_dark_money` — undisclosed spending channels
- `company_trade_associations` — trade group memberships
- `company_state_lobbying` — state-level lobbying
- `company_ideology_flags` — institutional alignment signals
- `company_executives` — executive donation totals
- `company_signal_scans` — canonical 6-category signals

No new database tables needed.

## Implementation Steps

### 1. Situation Selector Component
`src/components/policy-intelligence/SituationSelector.tsx`

- 8 selectable "situation" chips (max 3):
  - Compensation Focused, Stability Seeking, Caregiver / Flexibility, Early Career Growth, Values-First, Risk-Aware, Leadership Track, Culture & Safety Sensitive
- Stored in localStorage as `userSituations` (consistent with existing `userWorkProfile` pattern)
- Each situation maps to weight adjustments for the 4 scoring pillars

### 2. Policy Score Engine
`src/lib/policyScoreEngine.ts`

**Base weights:**
- Disclosure (25%) — do they disclose political spending, lobbying?
- Oversight (20%) — board governance structure, independent oversight signals
- Transparency (20%) — salary transparency, lobbying disclosure (direct + indirect)
- Consistency (35%) — say-do gap from `company_public_stances`

**Situation reweighting map:**
| Situation | Disclosure | Oversight | Transparency | Consistency |
|-----------|-----------|-----------|-------------|-------------|
| Values-First | 15% | 15% | 20% | 50% |
| Risk-Aware | 20% | 35% | 25% | 20% |
| Caregiver | 15% | 15% | 35% | 35% |
| Compensation | 30% | 10% | 40% | 20% |
| (others) | slight shifts from base |

Input: company data from existing tables. Output: score 0–100, per-pillar breakdown, top 3 risks, top 3 strengths.

### 3. Mismatch Detection Engine
`src/components/policy-intelligence/MismatchEngine.tsx`

- Pull `company_public_stances` (gap field: "direct-conflict", "mixed", "aligned")
- Cross-reference with `entity_linkages` (lobbying_on_bill, donation_to_member)
- Cross-reference with `company_trade_associations` and `company_dark_money`
- Flag contradictions: public claim says X, but spending/lobbying shows Y
- Render as clear side-by-side cards (reuse existing `ValueConflictAlert` pattern)

### 4. Policy & Governance Receipts Panel
`src/components/policy-intelligence/PolicyReceiptsPanel.tsx`

Display 5 receipt categories:
1. **Political spending disclosure** — Y/N + detail from `company_public_stances` + `entity_linkages`
2. **Board oversight** — from governance signals (GovernanceSignalsCard data)
3. **Lobbying disclosure** — direct (federal) + indirect (state) from `company_state_lobbying` + `entity_linkages`
4. **Trade association memberships** — from `company_trade_associations`
5. **Public policy positions** — from `company_public_stances` filtered to ESG/workforce/social

### 5. Personalized Output Summary
`src/components/policy-intelligence/PolicyIntelligenceSummary.tsx`

- "What this means for you" — 2-3 sentence plain-language summary dynamically written based on selected situations + score
- Top 3 Risks (sorted by relevance to user's situations)
- Top 3 Strengths
- No political labels — behavior and transparency language only

### 6. Main Page
`src/pages/PolicyIntelligence.tsx` at route `/policy-intelligence`

Layout:
1. Situation selector (top)
2. Company search/select
3. Policy Score gauge with 4-pillar breakdown
4. "What this means for you" summary
5. Mismatch Detection section
6. Policy & Governance Receipts (collapsible sections)

### 7. Dossier Integration
Add a compact `PolicyScoreCard` to `CompanyDossier.tsx` within the "Influence & Policy Signals" layer (layer 6), reading situations from localStorage.

### 8. Route Registration
Add `/policy-intelligence` to `App.tsx` with lazy import.

## Files Created
- `src/pages/PolicyIntelligence.tsx`
- `src/lib/policyScoreEngine.ts`
- `src/components/policy-intelligence/SituationSelector.tsx`
- `src/components/policy-intelligence/MismatchEngine.tsx`
- `src/components/policy-intelligence/PolicyReceiptsPanel.tsx`
- `src/components/policy-intelligence/PolicyIntelligenceSummary.tsx`
- `src/components/policy-intelligence/PolicyScoreCard.tsx`

## Files Modified
- `src/App.tsx` — add route
- `src/pages/CompanyDossier.tsx` — embed PolicyScoreCard in candidate lens

