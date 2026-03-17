

## Decision Checkpoint — "Before You Sign" Component

### What This Is

A new component that synthesizes company signals + user work profile into a calm, advisory pre-decision summary. It replaces no existing component on the company profile — it's added as a new section after the Reality Gap block, before How To Read This.

### Structure

**New file**: `src/components/company/DecisionCheckpointBeforeSign.tsx`

Three sections, auto-generated from existing data:

1. **What Aligns** — 2-3 confirmations pulled from `ValuesSignalMatch`'s aligned matches
2. **Worth Clarifying** — 2-4 questions generated from low-confidence signals, missing data, or neutral areas
3. **Take a Closer Look** — Only renders if mismatches exist; pulls from `ValuesSignalMatch`'s mismatch results

Entry UI: a calm prompt — "Before you sign... Let's make sure nothing important gets missed." with a Continue button that expands the full checkpoint.

No uploads, no forms, no input required. Optional textarea for personal notes (localStorage-persisted per company).

### Data Sources

Reuses the same `SignalInputs` interface from `ValuesSignalMatch` plus `companyName` and `companySlug`. Internally calls `computeMatches` (extracted or duplicated from ValuesSignalMatch) and `getStoredWorkProfile` to generate all three sections.

If no work profile exists: shows the same nudge as ValuesSignalMatch ("Set your work preferences to personalize this checkpoint").

### "Worth Clarifying" Generation Logic

Questions are generated from gaps in data, not from mismatches:
- No compensation data → "Ask about compensation philosophy and how ranges are set"
- No sentiment data → "Ask current employees about day-to-day team dynamics"
- No job posting data → "Ask about growth trajectory and open roles on this team"
- Low executive visibility → "Ask who you'd report to and how leadership communicates priorities"
- No benefits data → "Ask about benefits structure and how it's evolved recently"

### Visual Design

- Collapsed by default: single card with headline + Continue button
- Expanded: three sections with left-border accents (green for aligned, neutral for clarify, amber for closer look)
- Text-first, minimal chrome
- Optional notes textarea at bottom (collapsible)

### Page Integration

**Edit**: `src/pages/CompanyProfile.tsx` — insert `<DecisionCheckpointBeforeSign>` after Reality Gap block (line ~391), before How To Read This.

### Files

| File | Action |
|------|--------|
| `src/components/company/DecisionCheckpointBeforeSign.tsx` | **Create** |
| `src/pages/CompanyProfile.tsx` | **Edit** — add component between Reality Gap and How To Read This |

No database changes. No edge functions. One new component, one page edit.

