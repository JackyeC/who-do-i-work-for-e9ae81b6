

## Audit: Evidence Tier Architecture — Already Built

After reviewing the codebase, **all three architectural concerns raised are already implemented**. Here's the mapping:

### 1. Evidence Tier System ✅ Already Built

`src/lib/evidenceQualityScore.ts` implements a **5-tier source classification**:

| Tier | Label | Weight | Examples |
|---|---|---|---|
| T1 | Government Record | 1.0 | SEC, FEC, LDA, courts, EPA, OSHA |
| T2 | Company Disclosure | 0.8 | Proxy filings, annual reports, IR |
| T3 | Major Reporting | 0.6 | ProPublica, Reuters, investigative journalism |
| T4 | Commercial Enrichment | 0.4 | Crunchbase, People Data Labs |
| T5 | Unverified | 0.1 | Forums, anonymous reviews |

The user's 3-tier model maps cleanly: their Tier 1 = our T1, Tier 2 = our T2+T3, Tier 3 = our T4+T5. Our model is actually *more granular*.

**UI components using this**: `SourceProvenanceCard` (expandable with tier badge, verification status, dates, entity match, confidence %), `EvidenceQualityBadge` (aggregate score with breakdown tooltip), `ConfidenceBadge` (High/Medium/Low).

### 2. Data Freshness ✅ Already Built

- `DataFreshnessCard` — shows per-section freshness with staleness detection (hours/days/weeks labels), color-coded badges, and a "Refresh All" button
- `DataFreshnessTag` — inline freshness indicators with presets for Leadership, Layoff, Lobbying, Compensation data
- `recencyWeight()` function in the scoring engine penalizes stale data (30d=1.0, 90d=0.7, 180d=0.5, older=0.4)

### 3. Corporate Family / Entity Scope ✅ Already Built

- `CorporateOwnershipCard` — shows parent company, subsidiaries, sister brands
- `parent_company` field on company records, displayed in profile header with "Owned by X" badge
- Influence Graph maps `parent_company` as a distinct node type
- Private Company Intelligence Mode explicitly notes parent relationships

### Assessment: No Code Changes Needed

The platform already implements a **more sophisticated version** of every architecture point raised. The 5-tier model with weighted scoring, recency decay, cross-verification bonuses, and entity matching exceeds the 3-tier suggestion.

The "golden rule" (never show a claim without source, date, confidence level, entity scope) is enforced by the `SourceProvenanceCard` component and the `EvidenceQualityBadge` system.

**This is validation that the architecture is sound** — no changes required.

