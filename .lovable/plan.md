

## Fix: Hardcoded Colors Breaking Light/Dark Mode Across the Project

### Problem
458 instances of hardcoded Tailwind colors (`text-green-400`, `bg-red-500/10`, `text-yellow-600`, etc.) across **45 files** don't adapt between light and dark mode. The project already has a proper theme token system (`civic-red`, `civic-green`, `civic-yellow`, `civic-blue`, `destructive`, `primary`) defined in `tailwind.config.ts` and `index.css` — but most files bypass it.

### Fix Strategy
Systematic replacement across all 45 files, using this token mapping:

| Hardcoded | Theme Token |
|---|---|
| `text-green-400/500/600/700`, `bg-green-500/10` | `text-civic-green`, `bg-civic-green/10` |
| `text-red-400/500/600/700`, `bg-red-500/10` | `text-civic-red`, `bg-civic-red/10` (or `text-destructive` for errors) |
| `text-yellow-400/500/600`, `bg-yellow-500/10` | `text-civic-yellow`, `bg-civic-yellow/10` |
| `text-amber-400/500/600`, `bg-amber-500/10` | `text-civic-yellow`, `bg-civic-yellow/10` |
| `text-blue-400/500/700`, `bg-blue-500/10` | `text-civic-blue`, `bg-civic-blue/10` |
| `text-emerald-400`, `bg-emerald-500/10` | `text-civic-green`, `bg-civic-green/10` |
| `text-orange-400/500` | `text-civic-yellow` (closest match) |
| `text-purple-400/500` | Keep as-is (decorative, no civic token) |
| `text-pink-400` | Keep as-is (decorative) |
| `dark:text-green-400` patterns | Remove the `dark:` variant — civic tokens auto-adapt |

### Files to Update (grouped by priority)

**High-visibility pages (7 files):**
- `src/pages/Demo.tsx` — `scoreColor()`, `severityStyle`, `flagStyle`, `partyColor`
- `src/pages/BriefingPage.tsx` — score colors
- `src/pages/SignalFeed.tsx` — category config, confidence colors
- `src/pages/VoterLookup.tsx` — party colors
- `src/pages/EEOCTracker.tsx` — action labels, header icons
- `src/pages/ResumeOptimizer.tsx` — score colors, missing keyword badges
- `src/pages/CorporateImpactMap.tsx` — category config colors

**High-visibility components (12 files):**
- `src/components/WorkerSentimentCard.tsx` — sentiment colors, progress bars
- `src/components/MonitoredPagesPanel.tsx` — status config
- `src/components/ScanDebugPanel.tsx` — status icons
- `src/components/OpenSecretsEnrichmentCard.tsx` — verification labels
- `src/components/IssueRelatedReports.tsx` — verification labels
- `src/components/PromotionEquityCard.tsx` — category colors
- `src/components/CoverageBalanceChart.tsx` — political lean colors
- `src/components/CompensationTransparencyCard.tsx` — equity day colors
- `src/components/investigative/DocumentsTab.tsx` — verification status

**Remaining ~26 files** — same pattern, lower traffic pages

### Special Cases
- **Political party colors** (`D: blue`, `R: red`): Use `civic-blue` / `civic-red` with the existing `dark:` pattern removed since civic tokens auto-adapt
- **LinkedIn share button** (`bg-[#0A66C2]`): Keep as-is — brand color, not theme-dependent
- **Purple/pink decorative colors**: Keep as-is — no civic equivalent, and they're used for category differentiation not status signals

### Scope
~458 replacements across ~45 files. No layout, content, or logic changes. Pure color token migration.

