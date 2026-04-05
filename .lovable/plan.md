

## Refine "Your Signal" Language — Plan

### What changes

**File: `src/components/dashboard/YourSignalDashboard.tsx`** — copy-only edits, no structural or logic changes.

#### 1. Signal line variation (lines 273–277)

Replace the current three-tier ternary (which repeats `"signals"` in every branch) with an index-aware function that rotates phrasing per company. Each score tier gets 2–3 variant phrases:

- **Score ≥ 70**: `"Strong alignment across key factors"`, `"Conditions look favorable"`, `"Indicators point to stability"`
- **Score 40–69**: `"Mixed indicators — take a closer look"`, `"Uneven patterns — worth reviewing"`, `"Some areas need a second pass"`
- **Score < 40**: `"Low clarity — move carefully"`, `"Weak conditions — verify before proceeding"`, `"Early flags present — check the record"`

Selection uses the company's list index (`i % variants.length`) so adjacent entries never repeat the same line.

#### 2. "What Stands Out" language (lines 150–174)

Tighten the three insight strings:

| Current | Revised |
|---|---|
| `"X companies scored below 40 — review the record before proceeding"` | `"X companies scored below 40 — review before proceeding"` |
| `"X enforcement or labor flags detected — open the dossier for context"` | `"X enforcement or labor flags on record — check the dossier for context"` |
| `"X companies above 70 — alignment looks solid"` | `"X companies above 70 — conditions look favorable"` |

Each line now opens differently ("scored," "on record," "conditions") and avoids reusing "signals."

#### 3. Subline — no change needed

`"Your receipts, your signals, your next move."` stays as-is per prior instruction.

### What does NOT change

- Page structure, sections, routes, schema, data sources, joins, badges, animations, empty states, styling.

