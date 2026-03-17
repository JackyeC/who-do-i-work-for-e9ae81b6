

## Credibility-First Audit — Copy & Signal Integrity Fixes

Audit of the codebase against the credibility guardrails surfaced **6 specific violations** across 4 files. No structural or feature changes needed — these are targeted copy rewrites and one missing signal metadata enforcement.

---

### Violations Found

| # | File | Violation | Rule Broken |
|---|------|-----------|-------------|
| 1 | `Index.tsx:184` | "One complete picture" | Overstates completeness |
| 2 | `AskJackye.tsx:107` | "data points actually predict" | Implies prediction/certainty |
| 3 | `AskJackye.tsx:111` | "codified decades of professional talent logic" | Unverifiable claim |
| 4 | `BetaFeedbackWidget.tsx:131` | "Subscribe now to guarantee your rate" | Uses "guarantee" |
| 5 | `ResponseStudio.tsx:99` | "complete picture" in recruiter script | Overstates completeness |
| 6 | `ExplainableMetric.tsx:208` | "all signals detected" | Implies exhaustive coverage |

---

### Fixes

#### 1. `src/pages/Index.tsx` line 184
- **Before**: `Five pillars. One complete picture.`
- **After**: `Five pillars. One informed perspective.`

#### 2. `src/pages/AskJackye.tsx` line 107
- **Before**: `...knowing which data points actually predict a healthy 'inclusive vibe'...`
- **After**: `...weighting data points most commonly associated with workplace transparency...`

#### 3. `src/pages/AskJackye.tsx` line 111
- **Before**: `We have codified decades of professional talent logic into the system's core algorithms.`
- **After**: `The system cross-references public filings, federal databases, and open records to surface workforce transparency signals — not opinions.`

#### 4. `src/components/BetaFeedbackWidget.tsx` line 131
- **Before**: `Subscribe now to guarantee your rate — prices go up at GA.`
- **After**: `Subscribe now to lock in your current rate — pricing increases at GA.`

#### 5. `src/components/recruiting/ResponseStudio.tsx` line 99
- **Before**: `...I'm sharing this so you have the complete picture."`
- **After**: `...I'm sharing this so you have additional context from public records."`

#### 6. `src/components/ExplainableMetric.tsx` line 208
- **Before**: `A chronological view of all signals detected for this company`
- **After**: `A chronological view of signals detected for this company`

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | **Edit** — 1 string fix |
| `src/pages/AskJackye.tsx` | **Edit** — 2 string fixes |
| `src/components/BetaFeedbackWidget.tsx` | **Edit** — 1 string fix |
| `src/components/recruiting/ResponseStudio.tsx` | **Edit** — 1 string fix |
| `src/components/ExplainableMetric.tsx` | **Edit** — 1 string fix |

No database changes. No new components. Six surgical copy corrections.

