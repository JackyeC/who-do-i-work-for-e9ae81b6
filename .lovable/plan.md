

# Data Pipeline Health Check & Improvement Plan

## Current State

The pipeline has three stages and two bottlenecks:

```text
Sources (GDELT + NewsAPI + Internal)
  → sync-work-news (cron: every 4h)     → work_news table (521 rows, latest: Mar 24)
  → jackyefy-news  (cron: every 2h)     → receipts_enriched (40 rows, latest: Mar 24)
  → news-ingestion (NO cron scheduled)  → personalized_news + work_news
```

### Problems Found

1. **Data is 7 days stale.** Latest article in both `work_news` and `receipts_enriched` is March 24. Today is March 31. The cron jobs are scheduled but appear to be failing silently.

2. **481 of 521 work_news stories have no Jackye take.** `jackyefy-news` processes 10 stories per run. At every-2-hours that's 120/day max, but it's clearly not running — only 40 receipts exist total.

3. **`news-ingestion` has NO cron job.** It writes to both `personalized_news` and `work_news` but is never called automatically.

4. **`sync-work-news` requires service-role auth header** but the cron job sends the anon key. This means the cron call returns 401 every time.

5. **Single-source fragility.** GDELT is free but unreliable (rate limits, non-JSON responses). NewsAPI free tier caps at 100 requests/day. No fallback when both fail.

## Proposed Improvements (Priority Order)

### Phase 1: Fix What's Broken (Immediate)

**1a. Fix `sync-work-news` auth mismatch**
The function checks `token !== SUPABASE_SERVICE_ROLE_KEY` but the cron job sends the anon key. Either remove the auth gate (it's an internal function) or update the cron job to use the service role key.

**1b. Increase `jackyefy-news` batch size**
Change `limit(10)` to `limit(25)` so it catches up faster on the 481-story backlog.

**1c. Add `news-ingestion` to cron**
Schedule it every 4 hours, offset from `sync-work-news`, so the two don't compete for rate limits.

**1d. Run both pipelines once manually** to verify they work after fixes, then check data freshness.

### Phase 2: Pipeline Reliability

**2a. Add a `pipeline_runs` logging table**
Track every pipeline execution (function name, timestamp, articles processed, errors). This lets you see at a glance when things last ran and why they failed.

**2b. Add GDELT retry logic**
`sync-work-news` currently gives up on the first failure. Add 1 retry with backoff.

**2c. Dedup guard on `receipts_enriched`**
Currently if `jackyefy-news` is called twice for the same story, it inserts duplicates. Add a unique constraint on `work_news_id`.

### Phase 3: More Sources (Optional — Needs Discussion)

- **Firecrawl** (already connected) could scrape specific labor/HR news sites
- **Perplexity** (already connected) could generate richer summaries
- **TheirStack / Crustdata** for hiring signal data (would need new API keys)

## Technical Details

### Files to Edit
- `supabase/functions/sync-work-news/index.ts` — remove service-role auth gate (lines 182-188)
- `supabase/functions/jackyefy-news/index.ts` — change `.limit(10)` to `.limit(25)` (line 227)

### Database Changes
- Add cron job for `news-ingestion` (every 4h at minute 30)
- Update cron job #11 (`sync-work-news`) to use service role key, OR remove the auth check from the function
- Add unique constraint on `receipts_enriched.work_news_id`
- Create `pipeline_runs` table for observability

### No Protected Infrastructure Touched
All changes are to edge function logic and pipeline scheduling. No scoring systems, methodology, or UI components are modified.

