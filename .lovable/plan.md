

## Interpretation-First Empty States

Transform every "no data" state across the platform from a bug-looking blank into an intelligence signal. The backend already generates rich scan context (ATS detection, page classification, evergreen signals). The UI just needs to surface it properly.

### Scope

Three workstreams, all UI-layer changes plus one small `EmptyStateExplainer` upgrade:

---

### 1. Upgrade `EmptyStateExplainer` into `IntelligenceSignalCard`

Replace the current generic explainer with a richer component that supports:
- **What we checked** (source attribution with date)
- **What they say vs. what we see** (two-column or stacked comparison)
- **Suggested next step** (e.g., "Check LinkedIn for unlisted pipeline opportunities")
- **Confidence badge** (High / Medium / Low)

The existing `INTERPRETATIONS` map becomes a richer structure:

```text
jobs:
  title: "Evergreen recruiting page detected; 0 live requisitions found."
  whatTheySay: "Join our growing team"
  whatWeSee: "0 active postings; 4,200 frontline store postings"
  intelligence: "Corporate roles may be filled internally or on seasonal freeze."
  suggestedAction: "Check LinkedIn for unlisted pipeline opportunities."
  checkedSources: ["Careers landing page", "Workday ATS endpoint"]

sentiment:
  title: "Low external discussion volume"
  intelligence: "No structured sentiment on public forums (Reddit/Blind)."
  suggestedAction: "Search Glassdoor or Blind directly for recent reviews."

compensation:
  title: "Compensation data not publicly disclosed"
  intelligence: "This is a low-transparency signal..."
```

**Files**: Rewrite `src/components/company/EmptyStateExplainer.tsx` → new `IntelligenceSignalCard` with backward-compatible API. Update all import sites (3 files).

---

### 2. Upgrade `GhostJobDetector` zero-state

When `totalActive === 0`, instead of the current ghost icon + "No active job listings detected":

- Pull the scan context from `company_report_sections` (same query `HiringScanContextCard` uses)
- Show page classification label (e.g., "Evergreen Recruiting Page" or "Informational Landing Page")
- Show ATS detected badge if present (e.g., "Verified via Workday as of [date]")
- Show the "What they say / What we see" block if scan context available
- Show suggested CTA: "No public roles found. Search LinkedIn for [Company] Recruiter to find unlisted pipeline opportunities."
- Fall back to current generic text only if no scan context exists

**Files**: Edit `src/components/intelligence/GhostJobDetector.tsx`

---

### 3. Upgrade `IntelligencePending` component

The generic "Intelligence pending. No public receipts found" message appears across many sections. Replace with contextual messaging:

- Accept optional `checkedSources` and `lastChecked` props
- Display: "No public receipts found for [category]. Checked: [sources]. Last scan: [date]."
- Add optional `suggestedAction` prop for the "Hidden Job" CTA pattern

**Files**: Edit `src/components/IntelligencePending.tsx`, update call sites that pass category-specific context.

---

### 4. Wire "What they say vs. What we see" into `StructuredSignalsSection`

When the Hiring Reality section has zero signals and scan context exists:
- Instead of `EmptyStateExplainer type="jobs"`, render the new `IntelligenceSignalCard` with scan context data
- Show the page classification, ATS detection, and department breakdown from the scan

**Files**: Edit `src/components/company/StructuredSignalsSection.tsx` to accept optional scan context props and render the upgraded card.

---

### No database or edge function changes needed

The backend already generates all the signals (`job-scrape` produces `scanContext`, `hiringSignals`, `departmentBreakdown`). This is purely a presentation-layer upgrade.

### Summary of file changes

| File | Action |
|---|---|
| `src/components/company/EmptyStateExplainer.tsx` | Rewrite as `IntelligenceSignalCard` with richer data model |
| `src/components/IntelligencePending.tsx` | Add `checkedSources`, `lastChecked`, `suggestedAction` props |
| `src/components/intelligence/GhostJobDetector.tsx` | Replace zero-state with scan-context-aware intelligence card |
| `src/components/company/StructuredSignalsSection.tsx` | Wire scan context into Hiring Reality empty state |
| `src/components/company/InnovationSignals.tsx` | Update import to new component |

