

# Decision Support Engine: Truth-Over-Vibes Upgrade

## What Already Exists
The codebase already has **most of the infrastructure** for this request:
- `src/lib/signalPersonalization.ts` — Full Logic Bible V8.0 implementation with 6 canonical categories, UI statement mapping, dual-framing, mixed-signal interpretation, and ranking explanations
- `WorkProfileQuiz.tsx` — 3-step quiz with priorities, 6 sliders (the "Tactical Faders"), and avoidances
- `JobListRow.tsx` — Already shows personalized top signals per job card
- `JobDetailDrawer.tsx` — Already renders "Before You Sign", dual-framings, ranking explanations
- `PremiumGate.tsx` — Tier-gated content (but uses card replacement, not blur)
- `StructuredSignalsSection.tsx` — Ghost job detection via `hasGhostJobs` prop
- `company_signal_scans` table — All 6 canonical categories stored with `value_normalized`, `direction`, `confidence_level`

## What Needs to Change

### 1. Department-Aware Signal Priority on Job Cards
**File: `src/lib/signalPersonalization.ts`**
- Add a `DEPARTMENT_SIGNAL_PRIORITY` map:
  - Tech/Engineering → `innovation_activity` + `workforce_stability`
  - Operations → `workforce_stability` + `compensation_transparency`
  - Sales/Marketing → `hiring_activity` + `innovation_activity`
  - HR/People → `public_sentiment` + `company_behavior`
  - Default → use existing weight-based ranking
- Update `getTopSignalsForJob()` to accept an optional `department` param, boost matched category weights by +30, and cap output at 2 signals when department is known

**File: `src/components/jobs/JobListRow.tsx`**
- Pass `job.department` into `getTopSignalsForJob()`

### 2. Ghost Posting Risk Flag (ATS Mismatch)
**File: `src/components/jobs/JobDetailDrawer.tsx`**
- Add a `[GHOST_POSTING_RISK]` amber warning banner in the "Before You Sign" section when the job's company has `hasGhostJobs` signal or when the job lacks an `ats_source` but the company has a detected ATS
- Query `company_signal_scans` for `signal_category = 'hiring_activity'` and check for ghost indicators

### 3. Values DNA Clash Alert
**File: `src/lib/signalPersonalization.ts`**
- Add `generateClashAlerts()` function: for each user priority/avoidance mapped to a signal category, if the company's signal value is the opposite (e.g., user wants "Stability" but signal is "low" on `workforce_stability`), return a clash item with amber styling
- Export `ClashAlert` type with `{ userPriority, signalCategory, statement, severity }`

**File: `src/components/jobs/JobDetailDrawer.tsx`**
- Import and render clash alerts in an amber-bordered section within "What This Means For You"

### 4. Blur-Based Pro Gating
**File: `src/components/PremiumGate.tsx`**
- Add a `variant` prop: `"card"` (current behavior) | `"blur"`
- When `variant="blur"`, render children with `relative overflow-hidden` wrapper + an overlay div using `backdrop-filter: blur(8px)` with CTA text like "This deep-dive found 2 new signals. Unlock to see what changed."

**File: `src/components/jobs/JobDetailDrawer.tsx`**
- Wrap the "Before You Sign" detailed items and source links in `<PremiumGate variant="blur">` for free users, keeping the top-level score and 2 signals visible

### 5. Database Function Security Hardening
**Migration SQL:**
```sql
ALTER FUNCTION public.trace_influence_chain SET search_path = public;
ALTER FUNCTION public.get_company_roi_pipeline SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;
```
Note: `trace_influence_chain` and `handle_new_user` already have `search_path = public` set. Will verify and add `get_company_roi_pipeline` if missing.

## Files Modified
1. **`src/lib/signalPersonalization.ts`** — Add department-aware priority map, clash alert generator
2. **`src/components/jobs/JobListRow.tsx`** — Pass department to signal selector
3. **`src/components/jobs/JobDetailDrawer.tsx`** — Add ghost posting risk, clash alerts, blur gating
4. **`src/components/PremiumGate.tsx`** — Add blur variant

## Files NOT Changed (already implemented)
- `WorkProfileQuiz.tsx` — Sliders already serve as "Tactical Faders"
- `signalPersonalization.ts` — UI statement mapping, dual-framing already complete
- `StructuredSignalsSection.tsx` — Signal rendering already works
- `company_signal_scans` table — Schema already supports all 6 categories

## No New Tables or Edge Functions Needed

