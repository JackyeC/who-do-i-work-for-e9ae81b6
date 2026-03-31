

# Employer Dossier — Candidate Advocacy Report Redesign

## What changes

Replace the 3-mode toggle (Warning Label / Deep Dive / Interview Prep) in the **candidate lens** with a single, scrollable `AdvocacyReport` component. Interview Prep stays accessible as a button at the bottom. Deep Dive layers move into an expandable "Raw Layers" section at the end for power users. Sales and HR lens views remain unchanged.

## New files (3)

### `src/components/dossier/AdvocacyReport.tsx` (~450 lines)

A single linear report component that receives all the data currently passed to `WarningLabelView` plus the candidate layer data. Renders these sections top-to-bottom with no toggles or accordions:

1. **THE VERDICT** — Reuse `computeVerdict` logic from WarningLabelView. Bold verdict card + Jackye insight quote + employer clarity score breakdown.

2. **COMPANY SUMMARY** — Name, industry, size, state, description. Clean header section.

3. **WHAT THEY SAY** — Public stances from `publicStances` data, rendered as quoted corporate claims. Section header: "Their words."

4. **WHAT THEY DO** — Spending reality pulled from `issueSignals`, lobbying, PAC, contracts, enforcement actions. Section header: "The record."

5. **INTEGRITY GAP** — Side-by-side Say vs Do comparison using `gapStances` logic. Severity badges (Large/Medium/Aligned). Reuses existing gap filtering.

6. **LABOR IMPACT** — EEOC cases, WARN notices, workforce signals. Reuses `TalentContextLayer` data + `eeocCases`. Plain-English interpretation.

7. **SAFETY & WORKFORCE RISK** — Workforce demographics, stability signals. Embeds `WorkforceDemographicsLayer` inline.

8. **POLITICAL & POLICY ALIGNMENT** — PAC spending, lobbying, executive donations, government contracts. Reuses `politicalGiving` + `governmentContractSignals` data. Embeds `PoliticalGivingCard`, `InstitutionalDNACard`, `PolicyScoreCard`, `HighRiskConnectionCard`.

9. **WHAT THEY FUND & SUPPORT** — Executive giving section + institutional DNA details.

10. **WHAT THIS MEANS FOR YOU** — Values-aware section (see `ValuesAlignmentSection` below). Falls back to generic interpretation if no values profile.

11. **THE CALL** — Final recommendation card (see `RecommendationCard` below).

12. **CEO MEMO DECODER** — Retained from WarningLabelView, collapsed by default.

13. **3 HARD QUESTIONS** — Retained from WarningLabelView.

Each section uses:
- Mono uppercase section labels with left-border accent
- "So what?" plain-English interpretations
- Source badges where data exists
- Red/yellow/green left-border cards for evidence items

### `src/components/dossier/RecommendationCard.tsx` (~100 lines)

"THE CALL" — editorial recommendation card.

Inputs: verdict severity, gap count, EEOC count, signal count, has values conflicts boolean.

Logic:
- **Walk Away**: 4+ red flags OR large integrity gaps on dealbreaker topics
- **Watch**: 2-3 red flags OR multiple medium gaps
- **Dig Deeper**: 1-2 flags OR mixed signals
- **Apply**: Clean record, no major gaps

Displays: bold recommendation label, color-coded card (red/yellow/blue/green), 2-3 sentence reasoning, and a "This is not legal advice" disclaimer.

### `src/components/dossier/ValuesAlignmentSection.tsx` (~130 lines)

Loads the authenticated user's `user_values_profile` via Supabase query. Compares high-importance columns (≥70) against company signals and stances.

Shows:
- "Aligns with your values" items (green left-border)
- "Conflicts with your values" items (red left-border)
- If no profile exists: "Complete your Values Profile to see personalized alignment" with CTA link to `/values`

## Edited files (1)

### `src/pages/CompanyDossier.tsx`

- Remove the `dossierView` state and the 3-way toggle buttons from `overviewContent`
- Replace the conditional render block (lines 321-388) with: render `AdvocacyReport` as the default candidate view
- Add an "Interview Prep" button below the report that expands `CandidatePrepPack` inline
- Add a "View Raw Layers" collapsible at the bottom that renders the existing `candidateContent` DossierLayer stack
- Keep ClarityEngine and SituationContextBanner in place above the report
- Sales and HR lens content remains completely unchanged
- All existing data queries (executives, contracts, publicStances, issueSignals, valuesSignals, eeocCases, etc.) stay as-is — just passed into AdvocacyReport

## Design system

- Same dark card system already in use: `rounded-none`, `border-border/50`
- Mono uppercase section headers with primary icons (consistent with WarningLabelView)
- No accordions in the main report flow — everything visible and scrollable
- Evidence items use left-border accent cards: destructive for red, civic-yellow for caution, civic-green for clean
- Recommendation card uses bold 2-border treatment like existing Verdict card
- Workforce Health table pattern retained for financial data

## No database migration needed

All data sources already exist. Values alignment reads from existing `user_values_profile` table.

