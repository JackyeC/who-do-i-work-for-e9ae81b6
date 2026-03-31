

# Duplicate Audit — All Pages

## Confirmed Duplicates

### 1. CandidatePrepPack — TWO different components
- `src/components/company/CandidatePrepPack.tsx` — static, signal-driven (30-sec brief, flags, talk tracks). Used on **CompanyProfile**.
- `src/components/dossier/CandidatePrepPack.tsx` — AI-streaming, role-aware prep via edge function. Used on **CompanyDossier**.

These are two completely different implementations of the same concept. **Action**: Keep the dossier version (AI-powered, role-aware) as the canonical one. Remove the company/ version from CompanyProfile and replace it with a call to the dossier version.

### 2. WhatToAsk — TWO different components
- `src/components/company/WhatToAsk.tsx` — signal-driven interview questions on CompanyProfile (imported but **not rendered** — comment says "consolidated into Prep Pack").
- `src/components/jobs/WhatToAsk.tsx` — AI-generated questions via edge function on JobDetailPage.

**Action**: Remove the dead import of `company/WhatToAsk` from CompanyProfile. Keep `jobs/WhatToAsk` as-is (different context: job-level vs company-level).

### 3. WhatToWatch vs CandidatePrepPack "Signal Flags"
- `src/components/company/WhatToWatch.tsx` — signal-driven watch items (info/caution/risk) on CompanyProfile.
- `src/components/company/CandidatePrepPack.tsx` → `buildFlags()` — red/yellow/green flags covering the **same signals** (layoffs, PAC spending, AI hiring, revolving door, pay equity).

These overlap heavily. Both use the same input props and surface the same concerns in different formats. **Action**: Remove WhatToWatch from CompanyProfile. The Prep Pack flags already cover it.

### 4. DecisionCheckpointBeforeSign vs CandidatePrepPack
- `DecisionCheckpointBeforeSign` generates "aligned/misaligned/ask" insights from signals + work profile.
- `CandidatePrepPack` generates Say/Ask/Avoid talk tracks from the same signals.

Partial overlap — the "Ask" items in both components often surface identical questions. **Action**: Keep DecisionCheckpoint (it's personalized via work profile quiz), but remove any talk tracks from it that duplicate the Prep Pack's "ASK" items.

### 5. JackyesInsightBlock — rendered on both pages
- CompanyProfile line 438: `<JackyesInsightBlock />`
- CompanyDossier line 343: `<JackyesInsightBlock />`

Not a duplicate within a single page (different pages), so this is fine.

### 6. InterviewDossier vs CompanyDossier "Interview Prep" tab
- `/interview` — InterviewDossier page with hardcoded Amazon/Magnolia data, full interview prep with practice Qs, org context, negotiation intel.
- `/dossier/:id` — CompanyDossier with "Interview Prep" tab that streams AI-generated prep.

These serve overlapping purposes. **Action**: Flag for future consolidation. InterviewDossier has much richer hardcoded content; the Dossier prep tab is dynamic but thinner. Long-term, merge the InterviewDossier format into the Dossier page's prep tab.

### 7. InterviewKit — used on two unrelated pages
- `SampleDossier.tsx` — renders `<InterviewKit />`
- `AutoApply.tsx` — renders `<InterviewKit />`

Same component, different contexts. Not a harmful duplicate.

---

## Summary of Changes

| # | What | Where | Action |
|---|------|-------|--------|
| 1 | Two CandidatePrepPack components | CompanyProfile, CompanyDossier | Replace company/ version with dossier/ version on CompanyProfile |
| 2 | Dead WhatToAsk import | CompanyProfile | Remove unused import |
| 3 | WhatToWatch overlaps Prep Pack flags | CompanyProfile | Remove WhatToWatch section |
| 4 | DecisionCheckpoint overlaps Prep Pack asks | CompanyProfile | Deduplicate overlapping questions |
| 5 | InterviewDossier vs Dossier prep tab | /interview vs /dossier/:id | Flag for future merge (no immediate change) |

**Files to edit**:
- `src/pages/CompanyProfile.tsx` — remove WhatToWatch, remove dead WhatToAsk import, swap CandidatePrepPack to dossier version
- `src/components/company/DecisionCheckpointBeforeSign.tsx` — trim questions that duplicate Prep Pack ASK items

