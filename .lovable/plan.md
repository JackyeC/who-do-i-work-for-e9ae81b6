

# Sharpen Career Intelligence Page: Copy, Hierarchy, and Sample Dossier

## What This Does

Upgrades the Career Intelligence page from "informational" to "decision engine" by improving three areas: hero messaging, sample dossier content, and visual weight of the score/signals.

## Current State

The page already has all the right components:
- `EmployerDossierSearch` (search bar)
- `SampleDossierPreview` (static Amazon example)
- `EmployerDossierCard` (score + risk + confidence)
- `BeforeYouAcceptBlock` (signal bullets)
- `WhatThisMeansForYou` (fit/risk cards)

The issue is: the copy is too soft, the sample preview is too small/faded, and the hero doesn't create urgency.

## Changes

### 1. `CareerIntelligence.tsx` — Rewrite hero copy

Replace the current headline and subtitle:
- **Title**: "You vetted the role. We vet the employer." (replaces "Map My Career")
- **Subtitle**: "Analyze compensation risk, leadership signals, hiring practices, and company behavior — before you accept an offer."
- Remove the italic disclaimer paragraph (move to footer of dossier card instead)

### 2. `SampleDossierPreview.tsx` — Full rewrite with sharp Amazon dossier

Replace the current sparse preview with the complete Amazon dossier from the Gemini conversation:
- Score: 4.2/10, High Risk, High Confidence
- Bottom line: "High opportunity, high volatility. You're not joining a steady system — you're joining a company mid-reset."
- 5 "Before you accept" bullets (layoffs, de-layering, RTO, AI pivot, org shifts)
- 3 fit signals and 3 risk signals (specific to Amazon March 2026 climate)
- Sources line referencing SEC filings, WARN notices
- Remove `opacity-70` — make it full contrast with a subtle "Preview" badge instead of looking disabled
- Add `pointer-events-auto` so it feels real (but keep `select-none`)

### 3. `EmployerDossierCard.tsx` — Increase score visual dominance

- Bump score font from `text-5xl sm:text-6xl` to `text-6xl sm:text-7xl`
- Add the bottom_line fallback text when no dossier: derive a one-liner from risk level (e.g., "Limited transparency — proceed with caution" for high risk)

### 4. `BeforeYouAcceptBlock.tsx` — Sharpen fallback copy

Update the hardcoded fallback signals (when no dossier/signal data exists) to use direct, non-analyst language:
- "Significant political spending detected" → "Heavy political spending — check if it aligns with your values"
- "Limited public transparency across governance metrics" → "Low transparency across key governance areas"
- Add: "Salary data not publicly disclosed (negotiation blind spot)"

### 5. `WhatThisMeansForYou.tsx` — Sharpen fallback fit/risk copy

Rewrite the generic fallback bullets to be more actionable:
- Strengths: "You thrive in ambiguous environments" / "You value brand exposure over stability"
- Risks: "You need clear promotion paths" / "You prefer predictable org structures"

## Files

| Action | File |
|--------|------|
| Modify | `src/pages/CareerIntelligence.tsx` — hero copy rewrite |
| Modify | `src/components/career/SampleDossierPreview.tsx` — full Amazon dossier rewrite |
| Modify | `src/components/career/EmployerDossierCard.tsx` — bigger score, bottom_line fallback |
| Modify | `src/components/career/BeforeYouAcceptBlock.tsx` — sharper fallback copy |
| Modify | `src/components/career/WhatThisMeansForYou.tsx` — sharper fallback copy |

## No database changes needed

All improvements are copy and styling — the data model and queries remain unchanged.

