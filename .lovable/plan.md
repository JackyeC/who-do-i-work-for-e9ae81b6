

# Company Risk Radar

## What Already Exists
The platform already has strong risk infrastructure:
- **CareerRiskReport** — a shareable 0-100 scorecard with 5 dimensions (Leadership Stability, Layoff History, Political Activity, Promotion Velocity, Pay vs Industry)
- **TalentRiskSignals** — recruiter-facing risk detection from WARN notices, ideology flags, AI/HR signals, sentiment, revolving door, dark money, values signals
- **FlightRiskGauge** — workforce churn scoring

## What's Missing: A User-Facing "Risk Radar" Widget
The existing tools are either buried deep in company profiles or recruiter-specific. Job seekers need a **prominent, scannable, at-a-glance risk summary** — a visual radar that immediately communicates "should I be worried?"

## Plan: Build `CompanyRiskRadar` Component

### New Component: `src/components/company/CompanyRiskRadar.tsx`
A visually striking, Bloomberg-style radar panel with 4 clear risk categories:

| Signal | Source | Detection |
|--------|--------|-----------|
| Recent Layoffs | `company_warn_notices` count | >0 WARN notices in 12 months |
| Below-Market Comp | `company_compensation` + `career_intelligence_score` | Low transparency or below-benchmark |
| Lobbying Exposure | `companies.lobbying_spend` + `companies.total_pac_spending` | Tiered thresholds |
| Executive Turnover | `company_executives` departed count | >2 departures |

Each signal shows: icon, label, severity badge (Clear / Watch / Alert), one-line evidence summary.

Overall "Risk Level" header: Low / Moderate / Elevated / High — computed from signal count and severity.

### Visual Design
- Red/amber/green severity indicators with the existing Bloomberg terminal aesthetic
- Compact card format — fits above the fold on company profiles
- Animated radar-style circular indicator showing overall risk level (CSS only, no canvas)

### Integration
- Add to `CompanyProfile.tsx` near the top of the page, after the company header
- Data pulled from existing DB tables — no new tables or migrations needed
- All queries use the company's existing `id`

### Homepage Teaser
- Add a "Highest Risk Companies" panel to the `IntelligenceDashboard` on the homepage (8th panel)
- Query: companies with most WARN notices + highest lobbying spend, sorted by composite risk

### Shareability
- Include a "Share Risk Radar" button that generates a text snippet for social sharing
- Format: "⚠️ [Company] Risk Radar: 2 of 4 signals active — Layoffs detected, High lobbying exposure. Check the receipts → [link]"

