

## Company Profile Rebuild — Decision-First, Trust-First

### The Problem

The current page is **1,529 lines** rendering **30+ components** across **12+ sections** with competing score systems (Corporate Character, CBI, Recruiter Reality, GTM, Career Risk, Intelligence Snapshot, Risk Radar, Clarity Score, Transparency Ghosting), persona switching, and scattered signal cards. A candidate cannot answer "Should I work here?" in under 60 seconds.

### The New Structure

Five sections, in order. Nothing else.

```text
┌─────────────────────────────────────────────┐
│  HEADER (compact: name, logo, meta badges)  │
├─────────────────────────────────────────────┤
│  1. INSIDER BRIEF                           │
│     - Employer Clarity Score + confidence    │
│     - "What's changing" (2-3 bullet signals) │
│     - "What this means for you" (2-3 lines) │
│     - Data recency + confidence badge       │
├─────────────────────────────────────────────┤
│  2. WHAT WE'RE SEEING                       │
│     Unified signal categories:              │
│     • Hiring Reality                        │
│     • Workforce Stability                   │
│     • Compensation & Market Position        │
│     • Off-the-Record Signals (inline)       │
│     • Leadership & Influence                │
│     Each: 1-2 signals + summary +           │
│     confidence + recency (free)             │
│     Additional signals gated (paid)         │
├─────────────────────────────────────────────┤
│  3. HOW TO READ THIS (collapsible)          │
│     Always-visible preview line             │
│     Expanded: verified vs inferred,         │
│     confidence meaning, recency meaning     │
├─────────────────────────────────────────────┤
│  4. UPGRADE MOMENT                          │
│     "See more of what's knowable"           │
│     CTA: "Unlock full intelligence"         │
├─────────────────────────────────────────────┤
│  5. FOOTER (sources, disclaimer)            │
└─────────────────────────────────────────────┘
```

### What Gets Removed From the Page

- `PersonaSelector` (persona switching system)
- `CorporateCharacterScore`, `CorporateBehaviorIndexCard`, `RecruiterRealityScoreCard`, `GTMScoreCard` (redundant scores — replaced by single Employer Clarity Score in Insider Brief)
- `CareerRiskReport`, `IntelligenceSnapshotCard`, `TransparencyGhosting` (redundant signal summaries)
- `CompanyRiskRadar` (folded into "What We're Seeing")
- `SankeyInfluenceDiagram`, party pie chart, PAC recipient table, dark money/revolving door detail cards (raw data — moved behind paid gate drawers)
- `NarrativeGapCard`, `VerificationBountyCard`, `InsiderPrideBanner`, `FamilyFirstTag` (noise)
- `DataFreshnessCard`, `SourcesCheckedBanner` (folded into section-level recency)
- `StartupDNACard`, `PrivateCompanyIdentityCard` (folded into header meta)
- `ValuesCheckSection`, `InfluenceChainCard`, `CivilRightsIntelligencePanel`, `AlignmentSignalsPanel`, `InstitutionalDNACard`, `TransparencyResearchTab` (deep analysis → paid gate)
- `ROIPipelineCard`, `OpenSecretsEnrichmentCard`, `AgencyContractsCard` (raw data → paid gate)
- `BoardGovernanceTab`, `InsiderTradingCard`, `EthicsRiskCard`, `ExecutivePowerNetworkCard` (deep analysis → paid gate)
- `BLSDemographicsCard` references, generic stat grids
- All `SectionHeader` decorated section wrappers (replaced by category labels)

### What Gets Kept (Repurposed)

- **EmployerClarityScore** calculation → powers the score in Insider Brief (no standalone card)
- **JackyeNote** logic → becomes the "What's changing" + "What this means for you" content generator (rewritten as `InsiderBriefSection`)
- **OffTheRecordSignals** → rendered inline under "What We're Seeing" Off-the-Record category
- **EmptyStateExplainer** → used within each category when data is absent
- **CompanyRiskRadar** signal logic → feeds the structured signals in "What We're Seeing"
- **ReportTeaserGate** → wraps additional signals in each category
- All data queries (candidates, executives, stances, etc.) → retained, just consumed differently
- All drawers (PAC, lobbying, contracts, candidate, executive) → retained for deep-dive

---

### Implementation Plan

#### 1. Create `InsiderBriefSection` component
**New file**: `src/components/company/InsiderBriefSection.tsx`

Consolidates JackyeNote + EmployerClarityScore into one scannable card:
- Employer Clarity Score (number + bar)
- Confidence level badge + data recency
- "What's changing": 2-3 auto-generated bullet signals from available data (PAC spending, WARN, sentiment, hiring mismatches)
- "What this means for you": 2-3 line plain-language interpretation
- No icons in body copy. Clean typography.

#### 2. Create `StructuredSignalsSection` component
**New file**: `src/components/company/StructuredSignalsSection.tsx`

Five category blocks, each with:
- Category label (text only, no icon)
- 1-2 free signals with summary, confidence badge, recency dot
- `ReportTeaserGate` wrapping additional signals
- `EmptyStateExplainer` when no data exists for a category

Categories and their data sources:
- **Hiring Reality**: job-scrape data, ghost job detector, ATS detection, recruiting health
- **Workforce Stability**: WARN tracker, layoff signals, early warning, news intelligence
- **Compensation & Market Position**: pay equity, compensation transparency, levels.fyi
- **Off-the-Record Signals**: existing `OffTheRecordSignals` component (inline)
- **Leadership & Influence**: executive data, PAC spending total, lobbying total, revolving door count

#### 3. Create `HowToReadThis` component
**New file**: `src/components/company/HowToReadThis.tsx`

Collapsible trust block:
- Always visible: one-line preview
- Expanded: what "verified" vs "inferred" means, confidence levels, recency bands, "this is context, not prediction"

#### 4. Create `UpgradeMoment` component
**New file**: `src/components/company/UpgradeMoment.tsx`

Simple upgrade CTA:
- Headline: "See more of what's knowable before you decide."
- Bullet list of what's behind the gate
- CTA button: "Unlock full intelligence"
- No urgency. No fear.

#### 5. Rewrite `CompanyProfile.tsx`
Reduce from ~1529 lines to ~400 lines. Structure:

```
Header card (compact)
InsiderBriefSection
StructuredSignalsSection
HowToReadThis
UpgradeMoment (for non-premium users)
Full scan button
Footer disclaimer
Drawers (kept as-is)
```

All existing queries remain — they feed data into the new components. The persona system, bucket rendering, and 12+ section renderers are removed entirely.

---

### Files Summary

| File | Action |
|------|--------|
| `src/components/company/InsiderBriefSection.tsx` | **Create** |
| `src/components/company/StructuredSignalsSection.tsx` | **Create** |
| `src/components/company/HowToReadThis.tsx` | **Create** |
| `src/components/company/UpgradeMoment.tsx` | **Create** |
| `src/pages/CompanyProfile.tsx` | **Rewrite** (~1529 → ~400 lines) |

No database changes. No edge function changes. Existing components are not deleted — just no longer imported into CompanyProfile.

