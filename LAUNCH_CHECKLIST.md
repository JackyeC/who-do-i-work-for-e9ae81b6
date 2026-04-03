# Monday launch — production parity checklist

Use this before pointing a production audience at the app. All paths assume **Supabase** is the backend.

**Production project ref:** `aeulesuqxcnaonlxcjcm` — `supabase/config.toml` and client preconnects should match. Hosting **must** use `VITE_SUPABASE_URL=https://aeulesuqxcnaonlxcjcm.supabase.co` and the **anon key from this project** (update local `.env` accordingly; never commit secrets).

## 1. Database migrations

Apply migrations to the **production** project (CLI or Dashboard SQL).

| Migration | What it adds |
|-----------|----------------|
| `supabase/migrations/20260403120000_dream_job_profile_and_application_dossiers.sql` | `profiles.dream_job_profile` (jsonb), `profiles.dream_job_profile_version` (int), table `application_email_dossiers` + RLS policies |
| `supabase/migrations/20260403140000_repoint_pg_cron_legacy_supabase_host.sql` | Replaces legacy hostname `tdetybqdxadmowjivtjy.supabase.co` inside `cron.job.command` with `aeulesuqxcnaonlxcjcm` (JWT in those commands must still be rotated — see **§6** and **`DEV_NOTES.md`**) |

**Verify**

- [ ] `select dream_job_profile, dream_job_profile_version from profiles limit 1;` runs without error.
- [ ] `select * from application_email_dossiers limit 1;` runs (empty ok).

## 2. Edge functions

Deploy functions that the client invokes by name:

| Function | Purpose |
|----------|---------|
| `generate-application-dossier` | After status → **Submitted**, upserts markdown dossier into `application_email_dossiers`. |
| `values-job-matcher` | Jobs matching (existing). |
| `parse-career-document` | Resume parsing from dashboard upload (existing). |

**Secrets (Deno / Supabase Edge)**

- [ ] `SUPABASE_URL` — set automatically on hosted Supabase.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — set automatically for Edge Functions.

**Verify**

- [ ] `generate-application-dossier` appears in **Edge Functions** list for the project.
- [ ] Invoke from app: mark an application **Submitted** → dossier row appears or UI shows a clear error + “Generate dossier” retry.

## 3. Frontend environment (Vite)

Production build must point at the same Supabase project (values are inlined at **build** time):

- [ ] `VITE_SUPABASE_URL` — e.g. `https://aeulesuqxcnaonlxcjcm.supabase.co`
- [ ] `VITE_SUPABASE_PROJECT_ID` — `aeulesuqxcnaonlxcjcm` (share/embed helpers)
- [ ] **Either** `VITE_SUPABASE_PUBLISHABLE_KEY` **or** `VITE_SUPABASE_ANON_KEY` — same anon/publishable JWT from **Project Settings → API** (the app reads both names; set one on Vercel)

Redeploy hosting after changing env vars.

**Prod console:** the bundle logs `[WDIWF] Supabase API host: aeulesuqxcnaonlxcjcm.supabase.co` once (no secrets). See **`DEV_NOTES.md`** for optional dev logging.

## 4. Optional / not blocking in-dashboard dossiers

- **Outbound email** for `application_email_dossiers.email_status` beyond `pending` is **not** required for the in-dashboard markdown receipt. The UI states when email delivery is pending or not configured.

## 5. Quick smoke tests

- [ ] Sign in → **Dashboard → Profile / Values** → save → Dream Job Profile updates (or shows migration banner if DB behind).
- [ ] **Auto-apply** wizard completes without claiming email was sent.
- [ ] **Applications** → set status to **Submitted** → dossier section shows content or explicit “generate” / error path.
- [ ] Homepage signed-in links: overview, jobs feed, auto-apply, **tracker** (`?tab=tracker`) open the expected tabs.

## 6. Pre-Monday verification (after full `db push`)

- [ ] **Work news feed** — UI shows recent items; seed data present if expected; **Edge Function logs** for `sync-work-news`, `news-ingestion`, `jackyefy-news` (as applicable) show no repeated 401/500s.
- [ ] **Dream Job Profile + dossiers** — `/admin/launch-health` all green where possible; profile sync + application dossier generation end-to-end.
- [ ] **Company pages + job search** — open a known company dossier; run a job search / jobs feed path without console errors.
- [ ] **Edge Function logs** (Dashboard → Edge Functions → each function → Logs) — scan for runtime errors on high-traffic functions.

### Scheduled jobs (`pg_cron`) — important if you ever applied migrations that pre-dated this project ref

Some historical migration SQL hard-coded **`https://tdetybqdxadmowjivtjy.supabase.co`** and **JWTs tied to that project**. If those jobs ran on **`aeulesuqxcnaonlxcjcm`**, they may still call the **wrong host** or send an **invalid Bearer token** for this project.

- [ ] In SQL Editor: `select jobid, jobname, active, schedule, left(command, 300) from cron.job order by jobid;` — confirm URLs use **`aeulesuqxcnaonlxcjcm.supabase.co`** (same query in **`DEV_NOTES.md`**).
- [ ] If not, apply migration **`20260403140000_repoint_pg_cron_legacy_supabase_host.sql`** or run the equivalent `UPDATE` from **`DEV_NOTES.md`**.
- [ ] If cron calls still return **401**, the embedded **Bearer** JWT is for the wrong project — rotate using the copy/paste `UPDATE` or unschedule/recreate steps in **`DEV_NOTES.md`** § pg_cron JWT rotation (prefer [Vault](https://supabase.com/docs/guides/database/vault) for **new** jobs; do not add new JWTs to git).

## 7. Repo hygiene

- [ ] Remove any stray `*.sql.save` under `supabase/migrations/` so the CLI never picks it up.
- [ ] Optional: upgrade Supabase CLI (`v2.34.3` → current) when convenient — see **`DEV_NOTES.md`** for what to re-check after upgrading.

---

## 8. Pre-Monday audit log (code + docs)

Verified in-repo (no stray old ref under `src/`; no JWT literals under `src/`):

- Centralized Vite reads: `src/lib/supabase-vite-env.ts`, `src/integrations/supabase/client.ts`, `src/lib/social-share.ts` (storage URLs), and direct `fetch` callers use the same URL/key helpers.
- **`DEV_NOTES.md`** — Vercel var list, pg_cron hostname + JWT SQL, Vault guidance, CLI notes.
- **Still manual:** Vercel env for all `VITE_*` vars; Supabase SQL for cron JWT if 401 persists; local `.env` on each machine; `public/extension` / `public/embed` if the project ref changes again.

If migrations or `generate-application-dossier` are missing, the app **degrades** with banners/toasts instead of failing silently (see `src/lib/supabase-errors.ts`).

## Internal UI (admin)

Signed-in **admin/owner** users can open **`/admin/launch-health`** (also linked from **Founder console**) to re-run live checks against the current browser session and Supabase project.
