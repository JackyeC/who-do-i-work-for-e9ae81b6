

## Career Intelligence Page Enhancement Plan

### Current State
The page (`/career-intelligence`) is a tabbed career management tool with 7 tabs: Upload, Docs, Tailor, Profile, Alerts, Next Move, Checklist. It has no employer search or score display. The user wants to transform it into a **career decision engine** with employer lookup, risk scoring, and actionable signals.

### What Changes

**1. New Component: `EmployerDossierSearch`**
- Company search input at the top of the page (below heading, above tabs)
- Searches the existing `companies` table (same pattern as `SearchResults.tsx`)
- On selection, loads company data and displays the result summary

**2. New Component: `EmployerDossierCard`**
- The dominant result card shown when a company is selected
- Contains:
  - **Employer Clarity Score** (1–10, large font, reuses scoring logic from `CareerIntelligenceScore`)
  - **Risk Level** badge (Low/Moderate/High, color-coded green/yellow/red)
  - **Confidence Level** badge (reuses `ConfidenceBadge` component)
- Visually prioritized with large typography and high contrast

**3. New Component: `BeforeYouAcceptBlock`**
- "Before you accept:" section with 3–5 concise bullet signals
- Derives bullets from available company data (WARN notices, PAC spending, hiring signals, sentiment, leadership turnover)
- Static placeholder bullets when no data available

**4. New Component: `WhatThisMeansForYou`**
- "What this means for you:" section
- Two sub-sections: "Strong fit if you:" and "Risk if you:" with 2–3 bullets each
- Generated from company signal data

**5. Sources Analyzed line**
- Subtle trust indicator below the dossier card: "Sources analyzed: public filings, workforce data, compensation benchmarks, and employee sentiment signals"

**6. Static Example Card**
- `SampleDossierPreview` component shown below search when no company is selected
- Uses placeholder Amazon-like data to demonstrate what the report looks like
- Non-interactive, clearly marked as example

**7. Label Renames**
- Page title: "Map My Career" stays, but subtitle updated to emphasize decision engine framing
- Tab labels and in-page references: "Insights" → "Signals we flagged", "Report" → "Employer Dossier" where applicable

**8. Page Layout Update (`CareerIntelligence.tsx`)**
- New layout order:
  1. Page heading (updated subtitle copy)
  2. `EmployerDossierSearch` (company search bar)
  3. `SampleDossierPreview` (when no company selected) OR `EmployerDossierCard` + `BeforeYouAcceptBlock` + `WhatThisMeansForYou` + sources line (when company selected)
  4. Existing tabs (unchanged, pushed below — "deep dive" content)
  5. DataWipeButton (unchanged)

### Technical Approach
- Company search queries `companies` table via Supabase (existing pattern)
- Score/risk/confidence derived from existing company fields (civic_score, employee_count, warn data, PAC spending, etc.)
- All new components are static display — no new DB tables, no new edge functions, no new routes
- Reuses existing `ConfidenceBadge`, `Card`, `Badge` primitives
- Bullet signals are computed client-side from available company data flags

### Files to Create
- `src/components/career/EmployerDossierSearch.tsx`
- `src/components/career/EmployerDossierCard.tsx`
- `src/components/career/BeforeYouAcceptBlock.tsx`
- `src/components/career/WhatThisMeansForYou.tsx`
- `src/components/career/SampleDossierPreview.tsx`

### Files to Modify
- `src/pages/CareerIntelligence.tsx` — integrate new components above tabs, update subtitle copy

