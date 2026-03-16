

## Trust & Verification Intelligence Layer + Source Architecture Hardening

### What Already Exists (Strong Foundation)

| Capability | Status |
|---|---|
| **Data sources** (SEC, FEC, LDA, USAspending, OSHA, NLRB, EPA, CFPB, CourtListener) | ✅ All live in edge functions |
| **Contradiction detection** | ✅ `detect-contradictions` + `AlignmentSignalsPanel` |
| **Influence Graph** | ✅ Force-directed graph at `/company/:id/influence` with evidence drawer |
| **Signal freshness** (per-signal) | ✅ `SignalFreshness` component |
| **Confidence tiers** (High/Moderate/Low) | ✅ `DataFreshnessCard`, `ConfidenceBadge` |
| **Source Transparency Panel** | ✅ 3-layer verification (Identity → Claim → Freshness) |
| **Entity resolution** | ✅ `resolve-entity` edge function + OpenCorporates |

### What's Missing (5 Deliverables)

---

#### 1. Source Provenance System — Per-Claim Source Cards

**Problem**: Individual claims don't show *which specific source* they came from with tier, date, and direct link.

**Build**: A `<SourceProvenanceCard />` component and a new `signal_sources` table.

- **New table**: `signal_sources` — `id, signal_id, signal_table (e.g. 'entity_linkages'), source_name, source_type (enum: government_filing, company_disclosure, major_reporting, commercial_enrichment, unverified), source_url, date_retrieved, date_published, entity_matched, verification_status, created_at`
- **New component**: `<SourceProvenanceCard />` — shows source name, type badge (Tier 1–5 color-coded), filing date, retrieval date, entity match, and direct link. Expandable "Why we believe this" drawer.
- **Wire into**: Every signal card (PAC, lobbying, contracts, court records, OSHA, etc.) gets a small provenance badge that expands to full details.

Each edge function that writes data already knows its source — we add a consistent `source_metadata` JSONB column write alongside existing inserts.

---

#### 2. Evidence Quality Score — Per-Section Confidence

**Problem**: No computed per-section confidence score (0–100) based on source mix, recency, cross-verification, and entity match strength.

**Build**: 
- A utility `src/lib/evidenceQualityScore.ts` that computes section confidence from:
  - Source tier weights (Tier 1 govt = 1.0, Tier 2 company = 0.8, Tier 3 journalism = 0.6, Tier 4 commercial = 0.4, Tier 5 unverified = 0.1)
  - Recency weight (< 30d = 1.0, 30-90d = 0.7, > 90d = 0.4)
  - Cross-source agreement bonus (+10 if 2+ independent sources agree)
  - Contradiction penalty (-15 if sources disagree)
  - Entity match confidence multiplier
- A `<EvidenceQualityBadge />` component showing "Evidence Quality: 92/100" with breakdown tooltip.
- A report header summary: "Primary-source coverage: 78% · Cross-verified claims: 14 · Conflicts detected: 1"

---

#### 3. Media Bias Indicator — Source Perspective Layer

**Problem**: News articles and commentary sources don't show political lean or reliability.

**Build**:
- A static `src/lib/mediaBiasDatabase.ts` mapping ~200 major outlet domains to `{ lean: 'left'|'lean_left'|'center'|'lean_right'|'right', reliability: 'high'|'mixed'|'low' }` based on publicly available bias classification data.
- A `<MediaBiasIndicator />` component showing lean dot + reliability badge per article.
- A `<CoverageBalanceChart />` showing percentage distribution across political spectrum for all news about a company.
- **Important rule**: Only applied to journalism/opinion sources. Government filings, court records, and regulatory data are explicitly labeled "Primary Record — No perspective applied."
- Add a "Narrative Risk" flag when > 80% of coverage comes from one perspective.

---

#### 4. Entity Resolution Report — Visible Match Confidence

**Problem**: Users can't see how the system matched "AWS" to "Amazon Web Services, Inc." or what subsidiaries were included.

**Build**:
- A `<EntityResolutionReport />` component showing: searched name → matched legal entity → parent company → subsidiaries included → match method (SEC + OpenCorporates + company filing) → match confidence %.
- Pull from existing `company_subsidiaries`, `corporate_structure` data from `sync-opencorporates`, and SEC CIK matching.
- Display on company profile header as a small "Entity Match: 96%" badge that expands to full resolution report.

---

#### 5. Accuracy Methodology Page

**Build**: A new route `/methodology` with a clean, public-facing page explaining:
- Source hierarchy (Tiers 1–5 with examples)
- Refresh cadence per data type
- Entity matching logic
- Confidence scoring formula
- Dispute handling process
- Known limitations (private companies, state-fragmented data, lag)
- Legal safe-harbor language

This is a static content page — no API calls needed.

---

### Database Migration

One new table:

```sql
CREATE TABLE public.signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  signal_table text NOT NULL,
  signal_id uuid,
  source_name text NOT NULL,
  source_type text NOT NULL DEFAULT 'unverified',
  source_url text,
  date_retrieved timestamptz DEFAULT now(),
  date_published timestamptz,
  entity_matched text,
  match_confidence numeric,
  verification_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.signal_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read signal sources" ON public.signal_sources FOR SELECT USING (true);
CREATE POLICY "Service role can write signal sources" ON public.signal_sources FOR ALL USING (true);
```

### Files Created/Edited

| File | Action |
|---|---|
| `src/lib/evidenceQualityScore.ts` | Create — scoring formula |
| `src/lib/mediaBiasDatabase.ts` | Create — outlet bias mappings |
| `src/components/SourceProvenanceCard.tsx` | Create — per-claim source card |
| `src/components/EvidenceQualityBadge.tsx` | Create — section confidence badge |
| `src/components/MediaBiasIndicator.tsx` | Create — lean + reliability badges |
| `src/components/CoverageBalanceChart.tsx` | Create — perspective distribution |
| `src/components/EntityResolutionReport.tsx` | Create — match transparency |
| `src/pages/Methodology.tsx` | Create — public methodology page |
| `src/pages/CompanyProfile.tsx` | Edit — add provenance, quality badges, entity resolution |
| `src/components/NewsIntelligenceCard.tsx` | Edit — add media bias indicators |
| `src/App.tsx` | Edit — add /methodology route |

### Implementation Order

1. Evidence Quality Score utility + badge (foundation for everything else)
2. Source Provenance Card + signal_sources table
3. Media Bias Database + indicators on news cards
4. Entity Resolution Report on company header
5. Methodology page

