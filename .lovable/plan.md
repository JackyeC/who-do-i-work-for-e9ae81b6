

# Upgrade Job Board: Intelligence Decision Layer

## What Changes

Transform the `JobDetailPage` (the routable `/job-board/:id` page) into a full decision layer, and add compact intelligence signals to the `JobIntegrityCard` (grid cards on `/job-board`). This is primarily a frontend enhancement — the data sources (company_dossiers, jobFitEngine, company signals, negotiation-simulator) already exist.

## Architecture

```text
JobIntegrityCard (grid card)          JobDetailPage (/job-board/:id)
─────────────────────────             ─────────────────────────────
+ Fit Score badge (0-100%)            + Fit Score section w/ explanation
+ Leverage indicator (Low/Med/High)   + Offer Intelligence panel
+ "Practice Negotiation" CTA          + Leverage Score panel
                                      + Reality Signals section
                                      + Leadership Tension chip
                                      + "What to Ask" (AI-generated Qs)
                                      + Inline Negotiation Simulator
```

## Changes by File

### 1. New Component: `src/components/jobs/JobFitPanel.tsx`

Renders the Fit Score section for the detail page:
- Circular score indicator (0-100) from `evaluateJobFit()`
- Lists strengths ("Strong match because...") and mismatches ("Watch for...")
- Uses existing `jobFitEngine.ts` — no new logic needed

### 2. New Component: `src/components/jobs/LeverageScore.tsx`

Computes and displays a Low/Medium/High leverage indicator based on:
- Job age (fresher = higher urgency)
- Repost detection (existing `detectRepost()` from `jobQuality.ts`)
- Salary transparency (disclosed = less room, undisclosed = more room)
- Civic/clarity score (lower transparency = more leverage)

Pure client-side calculation — no new API calls.

### 3. New Component: `src/components/jobs/OfferIntelligence.tsx`

Displays compensation context:
- Listed salary range (or "Not disclosed")
- Company-adjusted context from `company_dossiers.fit_signals` if available
- Negotiation room indicator (derived from LeverageScore)
- Pulls from existing `company_dossiers` table query

### 4. New Component: `src/components/jobs/RealitySignals.tsx`

Compact signal strip showing:
- Reposted role (from `detectRepost()`)
- Compensation transparency (salary_range present?)
- Workforce stability (from `company_dossiers.risk_signals`)
- Sentiment (from `company_dossiers.fit_signals`)

All data already fetched on the detail page — this is a rendering component.

### 5. New Component: `src/components/jobs/WhatToAsk.tsx`

Generates 2-3 tailored interview questions using a new edge function call:
- Sends: job title, company name, salary disclosed (y/n), civic score, fit mismatches, risk signals
- Returns: 2-3 questions as JSON via tool-calling
- Cached per job_id in React Query (staleTime 10min)
- Pro-gated (blur for free users)

### 6. New Edge Function: `supabase/functions/job-questions/index.ts`

- Accepts job context (title, company, signals, mismatches)
- Uses Lovable AI (gemini-3-flash-preview) with tool-calling to return structured `{ questions: string[] }`
- Concise system prompt: "Generate 2-3 specific interview questions a candidate should ask based on these company signals"

### 7. Modify: `src/pages/JobDetailPage.tsx`

Insert new sections between "What This Means For You" and "Strategic Context":
- `<JobFitPanel>` — fit score with strengths/mismatches
- `<OfferIntelligence>` — compensation context
- `<LeverageScore>` — hiring urgency indicator
- `<RealitySignals>` — compact signal strip
- Leadership Tension chip (static lookup from `bracketData2026.ts` by company name, if matched)
- `<WhatToAsk>` — AI-generated questions

Add inline negotiation simulator: an expandable section at the bottom that embeds the existing `SimulatorChat` component (from `src/components/negotiation/SimulatorChat.tsx`) directly in the page, pre-configured with the job's company/role/salary. No navigation away needed.

### 8. Modify: `src/components/jobs/JobIntegrityCard.tsx`

Add to the card (compact versions):
- Fit Score badge next to existing match indicator (e.g., "78% fit")
- Leverage indicator as a small badge (Low/Med/High)
- Requires passing `preferences` from `useJobPreferences()` — lifted from parent

### 9. Modify: `src/pages/JobIntegrityBoard.tsx`

- Pass `fitResult` (already computed on line 248) into `JobIntegrityCard` as a prop so cards can render fit score and leverage

## Files Summary

| Action | File |
|--------|------|
| Create | `src/components/jobs/JobFitPanel.tsx` |
| Create | `src/components/jobs/LeverageScore.tsx` |
| Create | `src/components/jobs/OfferIntelligence.tsx` |
| Create | `src/components/jobs/RealitySignals.tsx` |
| Create | `src/components/jobs/WhatToAsk.tsx` |
| Create | `supabase/functions/job-questions/index.ts` |
| Modify | `src/pages/JobDetailPage.tsx` — add all new sections + inline simulator |
| Modify | `src/components/jobs/JobIntegrityCard.tsx` — add fit score + leverage badges |
| Modify | `src/pages/JobIntegrityBoard.tsx` — pass fit data to cards |

## No Database Changes

All data sources already exist. The new edge function only needs the pre-configured `LOVABLE_API_KEY`.

