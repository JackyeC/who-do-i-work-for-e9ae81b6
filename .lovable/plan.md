

## Problem

"Protect your peace" is a feelings-based verdict that contradicts the WDIWF brand ("facts over feelings," "receipts over opinions"). It appears in two places as the fallback verdict for low-scoring companies.

## Fix

Replace the verdict tier labels across **2 files** with evidence-based, signal-first language:

### New verdict labels

| Current | New |
|---|---|
| "Protect your peace" | "Significant risk signals — review the receipts" |
| "Proceed with caution" | "Mixed signals — verify before you commit" |
| "Worth serious consideration" | "Strong signals — the record supports this" |
| "Under review — we're pulling records" | *(keep as-is)* |

### Files to change

1. **`src/contexts/EvaluationContext.tsx`** (lines 186-190) — update the three verdict strings
2. **`src/components/applications/ApplyDrawer.tsx`** (lines 54-56) — same three verdict strings

No other files or pages affected. No schema changes.

