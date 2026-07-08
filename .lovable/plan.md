
## Goal

Give you one drop-in folder to paste into the new site (its own separate backend) that renders the LIVE ticker and the /newsletter magazine page, plus fix the Founding Member badge on this site.

## Part 1 — Portable "Work Signal Kit" for the new site

Create a self-contained folder in this project so you can copy it as-is:

```text
/mnt/documents/work-signal-kit/
  README.md                    setup steps for the new site
  schema.sql                   tables the ticker + newsletter read from
  seed.sql                     10 sample stories so it renders immediately
  src/
    components/
      WorkSignalTicker.tsx     the LIVE scrolling ticker
      NewsletterPage.tsx       the /newsletter magazine layout
      StoryCard.tsx            poster card with bias bar
      BiasBar.tsx              left/center/right source meter
    hooks/
      use-work-news.ts         data hook (filtered + English-gated)
      use-signal-stories.ts    editorial stories hook
    lib/
      ticker-filters.ts        decodeEscapes, isLikelyEnglish, relevance
      supabase-client.ts       thin client the new site wires to its DB
    styles/
      ticker.css               .ticker-track keyframes + LIVE dot
  edge-functions/
    sync-work-news/index.ts    pulls GDELT into work_news (cron every 4h)
```

What each piece does:
- **WorkSignalTicker.tsx** — the exact ticker on the homepage: duplicated track, `translateX(-50%)` seamless loop, duration scales with total characters, red LIVE pill, click-through to `/newsletter#story-<id>`.
- **NewsletterPage.tsx** — magazine grid pulling from `signal_stories` and `work_news`, category filter chips, bias bar per story.
- **schema.sql** — creates `work_news`, `signal_stories`, `receipts_enriched` view, `poster_pool`, with GRANTs and RLS (public read, service-role write).
- **edge-functions/sync-work-news** — the GDELT ingestion the ticker depends on. Without this the ticker has no data.

The kit reads env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the new site's own project, so nothing points back here.

### Setup steps in the README

1. Copy `src/*` into the new site's `src/`.
2. Run `schema.sql` and `seed.sql` on the new site's database.
3. Deploy `edge-functions/sync-work-news` and schedule it every 4 hours.
4. Add the ticker: `<WorkSignalTicker />` at the top of the layout.
5. Add the route: `<Route path="/newsletter" element={<NewsletterPage />} />`.
6. Set the two env vars.

Everything else (fonts, colors) inherits from Tailwind semantic tokens you already copied from the theme kit.

## Part 2 — Fix the Founding Member badge on this site

Since you're not sure what's broken, I'll investigate in build mode:
1. Grep for the badge component and its eligibility check.
2. Read the profile / subscription source of truth it uses.
3. Verify against your actual account (are you flagged as founding member in the DB?).
4. Fix whichever layer is broken: missing flag, wrong query, or render guard.

I'll report what I found and what changed in one pass, no schema changes unless the field is genuinely missing.

## Deliverable

- A downloadable folder at `/mnt/documents/work-signal-kit/` you can zip and drop into the new project.
- A working Founding Member badge on this site.

## Out of scope

- I won't touch the current homepage or newsletter here — the kit is additive and only lives in `/mnt/documents/`.
- I won't wire the new site's backend for you; the SQL and edge function are ready to run there.
