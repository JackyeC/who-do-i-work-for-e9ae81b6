
# Data Pipeline Expansion Plan

## Phase 1: Background Ingestion Queue (Infrastructure)

### 1A. Database: `company_ingestion_queue` table
- Fields: `company_id`, `source_family` (sec, fec, osha, warn, news), `priority` (user-requested > large employer > default), `last_run_at`, `next_run_at`, `status`, `error_count`
- Auto-populated from: user watchlist companies, high-traffic companies, companies with active subscriptions
- RLS: service_role only

### 1B. Edge Function: `background-ingest`
- Triggered by pg_cron every 2 hours
- Pulls top N companies from queue (ordered by priority + staleness)
- For each company, fans out to existing source adapters:
  - **SEC EDGAR** — pull latest filings via CIK/ticker (already have `sec_cik` on companies table)
  - **OpenFEC** — contributions by employer name (already have `OPENFEC_API_KEY`)
  - **OSHA** — establishment search by company name + state
  - **WARN** — layoff notices (already ingesting via `company_warn_notices`)
  - **News** — company-specific news pull (already have `NEWS_API_KEY` + GDELT)
- Updates `last_run_at` and `next_run_at` based on source family cadence (24h for news, 72h for SEC/FEC)
- Stores raw JSON in `accountability_ingestion_log`

### 1C. Auto-populate queue
- Trigger: when a company is added to `user_company_watchlist`, upsert into queue with high priority
- Seed: insert top 100 companies by watchlist count + traffic

## Phase 2: Nuanced Empty States + Opacity Score

### 2A. Database: `company_coverage_summary` table
- Fields: `company_id`, `source_family`, `last_signal_date`, `signal_count`, `last_checked_at`, `coverage_status` (rich | limited | no_trail | never_checked)
- Populated/updated by background-ingest after each run

### 2B. UI: Replace "No Recent Data" everywhere
- Map coverage_status to nuanced copy:
  - `rich` → "3 OSHA inspections since 2019, last in 2023"
  - `limited` → "Limited regulatory trail — only 1 public filing found"
  - `no_trail` → "No regulatory actions reported in 5+ years; limited public oversight record"
  - `never_checked` → "We haven't scanned this employer yet — request a scan"
- Add per-source-family mini-badges on dossier pages showing last checked date + count

### 2C. Opacity Score
- Composite metric: count of source families with `no_trail` or `never_checked` status
- Display as "Transparency Index" on company profiles (0-100, higher = more transparent)
- Factor into `employer_clarity_score`

## Phase 3: Careers Page Scraping as Signal

### 3A. Edge Function: `scrape-careers-page`
- Uses existing `FIRECRAWL_API_KEY` connector to scrape company `careers_url`
- Extracts: job count, benefits language, DEI language, remote/hybrid signals, "perks vs substance" ratio
- Stores in new `company_careers_signals` table

### 3B. Database: `company_careers_signals`
- Fields: `company_id`, `scraped_at`, `active_job_count`, `benefits_mentioned`, `dei_language_score`, `remote_policy`, `perks_vs_substance`, `raw_text_snippet`

### 3C. Integration
- Surface in dossier as "Corporate Footprint" section
- Feed into Trail game as evidence cards

## Phase 4: Enriched Signal Display

### 4A. Signal Timeline
- Add `signal_timeline` component showing counts + dates + trends per source family
- "3 OSHA inspections since 2019, last in 2023, 1 violation"
- Visual sparkline per source family

### 4B. Subscribe to Company
- Add "Watch this employer" CTA on dossier pages (already have `user_company_watchlist`)
- When subscribed: bump company to high priority in ingestion queue
- Send user_alerts when new signals detected (already have `notify_watchers_on_signal_change` trigger)

### 4C. "Market Pulse" Dashboard
- Aggregate view: total WARN notices this month, OSHA inspection trends, FEC spending cycles
- Available on Founder Console + public Work Signal page

---

## Existing Infrastructure Leveraged
- ✅ `OPENFEC_API_KEY`, `NEWS_API_KEY`, `CONGRESS_GOV_API_KEY`, `APIFY_API_KEY`, `FIRECRAWL_API_KEY`
- ✅ `accountability_ingestion_log` table
- ✅ `user_company_watchlist` + `notify_watchers_on_signal_change` trigger
- ✅ `sync-work-news` edge function pattern (2h cron)
- ✅ `company_warn_notices`, `accountability_signals`, existing adapters

## Implementation Order
1. Phase 1A (migration) → 1B (edge function) → 1C (seed)
2. Phase 2A (migration) → 2B (UI) → 2C (score)
3. Phase 3A-3C (parallel with Phase 2)
4. Phase 4A-4C (after data starts flowing)
