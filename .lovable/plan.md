

# Plan: Fix Upstream Content Leak + Restore Newsletter & Chain

## Current State (from audit)

**Ingestion pipeline**: `sync-work-news` → `work_news` → `jackyefy-news` → `receipts_enriched`

**What's already working**:
- NewsAPI: `language: "en"` ✅ already set
- GDELT: `sourcelang:english` ✅ already in query string
- Content gates (`passesContentGates`) exist at ingest time ✅
- `jackyefy-news` has English+relevance pre-filter ✅
- Client-side filters in `useReceiptsFeed` ✅
- `/receipts` is a real route (not a redirect) ✅
- `/newsletter` reads from `receipts_enriched` via `useReceiptsFeed` ✅
- Stargaze Score chip exists and is rendered ✅
- Spice distribution is healthy: 6×1, 18×2, 64×3, 13×4+ across 101 enriched records ✅

**What's still broken**:
- 14 non-English rows remain in `work_news` (Italian, Swedish, Finnish) from blocked domains — these leaked before filters were added
- No `language` column on `work_news` for explicit tracking
- GDELT domain filter at ingest doesn't cover all blocked domains (only the `NON_US_DOMAINS` set in `sync-work-news` has ~30 entries; the `jackyefy-news` EXCLUDE_DOMAINS list has ~40 — they're not in sync)
- No explicit TLD-based blocking (`.se`, `.fi`, `.pl`, `.it` etc.) — only exact domain matches, so new foreign domains slip through

---

## Priority 1 — Fix Ingestion + Clean Data

### Step 1: Add `language` column to `work_news`
- Migration: `ALTER TABLE work_news ADD COLUMN language text DEFAULT 'en';`
- Set existing blocked-source rows to `language = 'unknown'`

### Step 2: Clean existing bad rows
- SQL cleanup: DELETE or UPDATE rows from `work_news` where `source_name` matches any blocked domain (the 14 identified rows + any in `receipts_enriched` that reference them)
- Delete corresponding `receipts_enriched` rows if any leaked through

### Step 3: Harden `sync-work-news` ingestion
- Unify the domain blocklist: merge the ~40 domains from `jackyefy-news` into `sync-work-news` so both use the same list
- Add TLD-based blocking: reject any `source_name` or domain ending in `.se`, `.fi`, `.pl`, `.it`, `.de`, `.fr`, `.es`, `.br`, `.nl`, `.ph`, `.au` (unless explicitly whitelisted)
- Set `language` field on insert (default `'en'` for NewsAPI since we request `language=en`; for GDELT, set `'en'` since we use `sourcelang:english`)
- Add a `sourcecountry:us` parameter to GDELT queries as additional geographic constraint

### Step 4: Harden `jackyefy-news` enrichment
- Sync the EXCLUDE_DOMAINS list with `sync-work-news`
- Add the same TLD-based blocking
- Skip any `work_news` row where `language != 'en'`

### Step 5: Trigger a fresh sync + enrichment
- Call `sync-work-news` then `jackyefy-news` to pull a clean batch and verify

---

## Priority 1b — Newsletter Wiring Confirmation & Polish

The newsletter is already correctly wired: `receipts_enriched` → `useReceiptsFeed` → `Newsletter.tsx`. Stargaze Score chips are rendering. Jackye voice is embedded. No raw `work_news` reads remain on `/newsletter`.

**Minor fixes needed**:
- Remove the `🔥 Hottest` filter option (line 56) — peppers/fire are retired; replace with `⭐ Top Rated`
- Ensure the "go deeper" links on each card point to `/receipts` and company dossier pages (already partially done with "See the receipts" links; add company lookup link where company data exists)

---

## Priority 2 — Connect the Chain

### Newsletter → Receipts
- Already linked via sidebar "See full receipts →" and "What to Watch" section
- Add a more prominent "Explore All Receipts →" link after the main feed section

### Receipts → Company / Dossier
- `ReceiptCard` already has "Look up employer →" links
- Verify these resolve correctly to `/dossier/:slug` or `/company/:slug`

### Company → Prep Tools
- Already wired in dossier pages (PoliticalGivingCard, HardInterviewQuestions, etc.)
- No new surfaces needed — just confirm links are functional

---

## Priority 3 — No-ops (already done)

These are confirmed working and need no changes:
- Stargaze Score labels (Set A) ✅
- Jackye voice in system prompt ✅
- Spice scoring distribution is healthy (not all 1s) ✅
- `/receipts` is a real destination ✅
- BiasBar renders on cards ✅

---

## Files Changed

| File | Change |
|---|---|
| `supabase/functions/sync-work-news/index.ts` | Unify blocklist, add TLD blocking, set `language` column, add `sourcecountry:us` to GDELT |
| `supabase/functions/jackyefy-news/index.ts` | Sync blocklist, add TLD blocking, skip non-`en` rows |
| `src/pages/Newsletter.tsx` | Replace "🔥 Hottest" filter with "⭐ Top Rated", add "Explore All Receipts" link |
| Migration | Add `language` column to `work_news`, clean 14 bad rows + any leaked enriched rows |

## What You'll Get Back

1. Updated ingestion code with unified blocklist + TLD blocking + language column
2. Count of cleaned rows
3. Screenshot of `/newsletter` showing English-only content
4. Confirmation of the full chain: Newsletter → Receipts → Company → Dossier → Tools

