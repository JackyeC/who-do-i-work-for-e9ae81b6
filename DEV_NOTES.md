# Dev / launch notes — Supabase `aeulesuqxcnaonlxcjcm`

Short reference for what was verified in the pre-Monday hardening pass and what remains manual.

## What was verified or changed in-repo

| Area | Notes |
|------|--------|
| **Old project ref** | `tdetybqdxadmowjivtjy` no longer appears in `src/` (only in `LAUNCH_CHECKLIST.md` narrative and in **historical** migration files — do not rewrite applied migrations). |
| **Vite env** | Supabase **API URL** + anon/publishable key reads go through `src/lib/supabase-vite-env.ts` and `src/integrations/supabase/client.ts` (including public storage URLs in `social-share.ts`). `VITE_SUPABASE_PROJECT_ID` is optional in the browser bundle if `VITE_SUPABASE_URL` is set; keep it on Vercel for parity and any non-`src` assets. |
| **Key naming** | Code accepts **`VITE_SUPABASE_PUBLISHABLE_KEY`** (Lovable-style) **or** **`VITE_SUPABASE_ANON_KEY`** (same JWT value from Dashboard → API). |
| **Runtime observability** | Production builds log once: `[WDIWF] Supabase API host: <host>` (no secrets). In dev, set `VITE_LOG_SUPABASE_ORIGIN=1` to log the host as well. |
| **pg_cron hostname** | New migration `20260403140000_repoint_pg_cron_legacy_supabase_host.sql` `UPDATE`s `cron.job.command` to replace the old hostname with `https://aeulesuqxcnaonlxcjcm.supabase.co`. |
| **`.env.example`** | Template for local/Vercel variable names (no secrets committed). |

**Intentional hardcoded URLs (not Vite env):** `public/extension/*`, `public/embed/civiclens-badge.js` — update those artifacts if the project ref changes again; they are not read from `import.meta.env`.

## Vercel — environment variables

Set for **Production** (and Preview if previews should hit prod DB):

| Variable | Example / note |
|----------|----------------|
| `VITE_SUPABASE_URL` | `https://aeulesuqxcnaonlxcjcm.supabase.co` |
| `VITE_SUPABASE_PROJECT_ID` | `aeulesuqxcnaonlxcjcm` (recommended for parity / `public/` embeds; not required for `src` OG URLs if `VITE_SUPABASE_URL` is correct) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **or** use `VITE_SUPABASE_ANON_KEY` with the **same** anon/publishable JWT from the new project |

Redeploy after any change. Vite inlines `import.meta.env.VITE_*` at build time only.

## Supabase SQL console — `pg_cron` after hostname fix

### 1. Inspect (Monday morning)

```sql
select jobid, jobname, active, schedule, left(command, 300) as command_preview
from cron.job
order by jobid;
```

Confirm URLs use `aeulesuqxcnaonlxcjcm.supabase.co` and inspect the `Authorization` / Bearer segment in `command` if you see 401s in Edge logs.

### 2. Hostname (automated if you applied the migration)

Migration `20260403140000_repoint_pg_cron_legacy_supabase_host.sql` performs:

```sql
update cron.job
set command = replace(
  command,
  'https://tdetybqdxadmowjivtjy.supabase.co',
  'https://aeulesuqxcnaonlxcjcm.supabase.co'
)
where command like '%tdetybqdxadmowjivtjy.supabase.co%';
```

If you cannot run migrations, run that `UPDATE` manually once.

### 2b. Disable vs unschedule (operational)

**Temporarily stop a job** (keeps the row; flip back with `active = true` when fixed):

```sql
update cron.job
set active = false
where jobname = 'news-ingestion-4h';  -- exact name from inspect query
```

**Remove a schedule entirely** (you will need `cron.schedule(...)` again to recreate):

```sql
select cron.unschedule('news-ingestion-4h');
```

Use **unschedule** when the `command` text is wrong end-to-end; use **active = false** to silence a broken job while you prepare a fixed `schedule` call.

### 3. JWT rotation (manual — still required for 401s)

Historical `cron.job` bodies embed a **Bearer** JWT whose payload `ref` was the **old** project. Pointing `net.http_post` at the new host **without** a matching key still yields **401** from Edge Functions.

**Option A — replace the old token string** (safest if you paste the exact legacy token from `cron.job`):

1. Copy the full `Bearer eyJ…` token from a `select command from cron.job where …` row (or from git history in the old migrations — that token is compromised; rotate keys in Dashboard after).
2. In SQL Editor, set `OLD_TOKEN` and `NEW_TOKEN` to the full JWT strings (no `Bearer ` prefix in variables if you use the snippet below):

```sql
-- Example: replace one embedded anon JWT with the current project's anon JWT.
-- Adjust the first argument to match the EXACT old token substring in cron.job.command.

update cron.job
set command = replace(
  command,
  'Bearer eyJ…OLD_JWT…',
  'Bearer eyJ…NEW_JWT_FROM_aeulesuqxcnaonlxcjcm…'
)
where command like '%Bearer eyJ…OLD_JWT…%';
```

**Option B — unschedule and recreate** each job from Dashboard docs / your runbook, using **only** the new URL and a key from **Project Settings → API** (prefer a **service role** only if the function requires it; otherwise **anon** is enough for many `verify_jwt` setups).

**Option C — Vault (future migrations)**  
Do not commit JWTs in new migration files. Store a secret with [Supabase Vault](https://supabase.com/docs/guides/database/vault), then schedule jobs whose body reads `decrypted_secret` and builds `headers` at runtime (or use a small SQL wrapper function that calls `net.http_post` with secrets from Vault). New cron SQL should follow that pattern.

## Edge functions — logging

High-traffic cron targets (`sync-work-news`, `news-ingestion`, `jackyefy-news`, `generate-briefing`, etc.) already use `console.log` / `console.error` / `console.warn` in `catch` paths. Monday: watch **Edge Functions → Logs** for 401 (bad cron JWT), 500, and timeouts.

## Supabase CLI (v2.34.3 vs latest)

This repo’s `package.json` does **not** pin the Supabase CLI; you run it globally. After upgrading **2.34 → 2.84+**, watch for:

- **Flags and commands** — older tutorials may use removed or renamed flags; prefer `supabase --help` and [CLI changelog](https://github.com/supabase/cli/releases).
- **`db push` / link** — use `supabase link --project-ref aeulesuqxcnaonlxcjcm` then `supabase db push` (or `--db-url`) rather than assuming a single global `--project-ref` on every subcommand.
- **Migration checksums** — do not edit migrations that already ran on production; add **new** migrations for repairs (as with `20260403140000_…`).

## Local `.env`

If your workspace still has **`tdetybqdxadmowjivtjy`** in `.env`, update **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_PROJECT_ID`**, and both publishable key lines to the **aeulesuqxcnaonlxcjcm** values from the Dashboard (same as Vercel). The repo’s **`.env.example`** shows the intended shape; consider adding `.env` to **`.gitignore`** if it ever contained real keys.
