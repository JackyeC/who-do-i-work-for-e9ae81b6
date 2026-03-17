

## Analysis: What Already Exists vs. What's New

Most of this blueprint is **already implemented** from previous iterations:

| Feature | Status |
|---------|--------|
| SQL search_path hardening (7 functions) | **Done** — migration already applied |
| ATS detection (11 platforms) | **Done** — job-scrape has Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Workday, iCIMS, Taleo, SuccessFactors, Phenom, Jobvite |
| ATS link detection in page content | **Done** — `ATS_LINK_PATTERNS` array |
| Page classification (6 types) | **Done** — `classifyPageContent()` |
| Mismatch signals | **Done** — `generateHiringSignals()` flags `ats_detected_no_active_jobs` |
| EmptyStateExplainer component | **Done** — exists with 8 interpretation types |
| SourcesCheckedBanner | **Done** — integrated in CompanyProfile |
| "Deep-Dive Research" / "Refresh Intelligence" labels | **Done** — already in CompanyIntelligenceScanCard |
| ReportTeaserGate with blur(8px) + hiddenSignalCount | **Done** — already updated |
| Reality Gap scoring | **Done** — full `RealityGapResults` + `VibeMatchQuestionnaire` system |
| Dossier aesthetic / monospace | **Done** — used throughout |

### What's Actually Missing (3 items)

1. **9 additional ATS platforms** in job-scrape detection: BambooHR, Rippling, Breezy, Teamtailor, Recruitee, Zoho Recruit, Pinpoint, Manatal, Gem
2. **EmptyStateExplainer not integrated** into CompanyProfile section renderers — component exists but isn't used anywhere
3. **Interview Tactical Questions** — generating 1 question per red/yellow risk signal for candidates to ask recruiters

---

### Implementation Plan

#### 1. Expand ATS Detection (job-scrape edge function)

Add 9 more ATS platform entries to `ATS_CONFIGS` (detection only, no public API — same pattern as Workday/iCIMS):
- `bamboohr` → `/bamboohr\.com/i`
- `rippling` → `/rippling\.com.*careers|rippling-ats/i`
- `breezy` → `/breezy\.hr/i`
- `teamtailor` → `/teamtailor\.com|career\./i` (careful pattern)
- `recruitee` → `/recruitee\.com/i`
- `zohorecruit` → `/zoho\.com.*recruit|zohorecruit/i`
- `manatal` → `/manatal\.com/i`
- `pinpoint` → `/pinpointhq\.com/i`
- `gem` → `/gem\.com.*jobs/i`

Also add corresponding `ATS_LINK_PATTERNS` entries for page content scanning.

#### 2. Integrate EmptyStateExplainer into CompanyProfile

Wire the existing `EmptyStateExplainer` component into `SECTION_RENDERERS` in CompanyProfile.tsx. Add fallback renders in sections that currently show nothing when data is absent:
- `workforce_intel` → `<EmptyStateExplainer type="eeo1" />` when no EEO data
- `off_the_record` → `<EmptyStateExplainer type="off_the_record" />` when component returns null
- `compensation` → `<EmptyStateExplainer type="compensation" />` when no pay data
- `public_records` → `<EmptyStateExplainer type="court_records" />` when no records

Add two new interpretation types to EmptyStateExplainer:
- `benefits`: "No Benefits Data Indexed" explanation
- `off_the_record`: "No Forum Signals Detected" explanation

#### 3. Interview Tactical Questions Component

**New file**: `src/components/company/TacticalQuestionsCard.tsx`

A compact card that generates 1 tactical interview question per risk signal. Uses the existing risk/signal data already available in CompanyProfile (WARN notices, sentiment, hiring mismatches, executive turnover).

Logic is rule-based, no AI call needed:
- High exec turnover → "Can you walk me through leadership changes in the last 18 months and how that's affected team stability?"
- WARN/layoff signals → "What's the company's current headcount trajectory compared to last year?"
- Hiring mismatch → "I noticed the careers page highlights [dept] roles — are those actively being filled right now?"
- Low sentiment → "How does the company gather and act on employee feedback?"

Props: `signals: { type: string; severity: 'red' | 'yellow' }[]`

Place in CompanyProfile within the `career_mobility` or `workforce_reality` section renderer, gated behind `ReportTeaserGate` for paid users.

---

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/job-scrape/index.ts` | **Edit** — add 9 ATS platforms + link patterns |
| `src/components/company/EmptyStateExplainer.tsx` | **Edit** — add `benefits` and `off_the_record` types |
| `src/components/company/TacticalQuestionsCard.tsx` | **Create** — interview question generator |
| `src/pages/CompanyProfile.tsx` | **Edit** — integrate EmptyStateExplainer + TacticalQuestionsCard |

No database changes needed. No new edge functions.

