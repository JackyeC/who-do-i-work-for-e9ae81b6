

# Fix Non-English Leaks — Surgical Plan

## Problem

Every client-side `work_news` query runs without `.eq('language', 'en')`. The `language` column exists and is populated, but no reader uses it. JS-side `isLikelyEnglish()` is the only defense — and it misses edge cases. The `jackyefy-news` enrichment function also has no language filter on its select query.

## Changes

### 1. `src/hooks/use-work-news.ts`

Add `.eq('language', 'en')` to all three query functions:

- **`useWorkNews`** (line 29): insert `.eq('language', 'en')` before `.order()`
- **`useWorkNewsCount`** (line 54): insert `.eq('language', 'en')` before the count select
- **`useWorkNewsTicker`** (line 69): insert `.eq('language', 'en')` before `.not()`

Keep existing JS `isLikelyEnglish()` filters as secondary guards.

### 2. `src/components/landing/LiveIntelligenceTicker.tsx`

Add `.eq('language', 'en')` to the query (line 51, before `.order()`). Keep existing JS filters.

### 3. `src/hooks/use-dashboard-briefing.ts`

Add `.eq('language', 'en')` to the `work_news` query (line 48, before `.order()`).

### 4. `src/components/company/MediaNarrativeCard.tsx`

Add `.eq('language', 'en')` to the query (line 27, before `.order()`).

### 5. `supabase/functions/jackyefy-news/index.ts`

Add `.eq('language', 'en')` to the select query that fetches unenriched `work_news` rows for processing. This ensures enrichment never touches non-English rows even if one leaks past ingest.

### 6. `supabase/functions/sync-work-news/index.ts`

Already sets `language: "en"` on upsert rows. No structural change needed — the ingest side is already correct. The gap was always downstream reads.

## Files changed

| File | Change |
|------|--------|
| `src/hooks/use-work-news.ts` | Add `.eq('language', 'en')` to 3 queries |
| `src/components/landing/LiveIntelligenceTicker.tsx` | Add `.eq('language', 'en')` to 1 query |
| `src/hooks/use-dashboard-briefing.ts` | Add `.eq('language', 'en')` to 1 query |
| `src/components/company/MediaNarrativeCard.tsx` | Add `.eq('language', 'en')` to 1 query |
| `supabase/functions/jackyefy-news/index.ts` | Add `.eq('language', 'en')` to enrichment select |

## What does NOT change

- No new tables, columns, or migrations
- No redesign or new surfaces
- No changes to `sync-work-news` (already correct)
- No changes to `jrc-edit-prompt.ts` (already has English mandate)
- JS-side filters stay as secondary guards — not removed

## Verification

After implementation, a repo-wide grep for `from("work_news")` will confirm zero unfiltered reads remain.

