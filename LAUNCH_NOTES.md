# Monday launch notes

Practical summary for demos and stakeholder conversations.

**Production Supabase project ref:** `aeulesuqxcnaonlxcjcm` — ensure Vercel/hosting `.env` uses this URL and matching anon key (local `.env` must be updated too; it is not committed).

## What is live now (frontend + wired backend)

- **Dream Job Profile** — merged from profile, values, preferences, quiz/persona signals, resume-derived fields; versioned on `profiles`.
- **Dashboard** — overview “command center,” tabs for values, profile, matched jobs, tracker, auto-apply, etc.
- **Jobs feed / matched jobs** — alignment scoring and explainers; Dream Job Profile is the canonical input.
- **Applications tracker** — pipeline statuses; **Submitted** triggers dossier generation via **`generate-application-dossier`** when deployed.
- **Application dossier (in-app)** — markdown receipt stored in **`application_email_dossiers`**; shown on the application detail page. This is the primary “receipt” for Monday; it does **not** depend on email shipping.

## What is intentionally not fully “productized” yet

- **Outbound email** from `application_email_dossiers` — pipeline fields exist (`pending`, `queued`, `sent`, …); the UI treats **`pending`** as “delivery pending / email not configured in this environment.” Do not demo “we emailed you” unless Resend/SendGrid (or equivalent) is wired and tested.

## What must be deployed before a public launch

1. All migrations applied on **`aeulesuqxcnaonlxcjcm`** (including **`20260403120000_dream_job_profile_and_application_dossiers.sql`**) — done if `db push` completed.
2. Edge functions deployed to that project (**`generate-application-dossier`**, **`values-job-matcher`**, plus any news/work-news pipeline you rely on).
3. Correct **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_PROJECT_ID`**, and **`VITE_SUPABASE_PUBLISHABLE_KEY`** *or* **`VITE_SUPABASE_ANON_KEY`** (same JWT) on the hosting build for **`aeulesuqxcnaonlxcjcm`**.
4. **Cron / pg_net:** confirm scheduled jobs target this project’s URL and a **valid** JWT for this project (see **`LAUNCH_CHECKLIST.md` §6**).

See **`LAUNCH_CHECKLIST.md`** for step-by-step verification.

## What to demo on Monday

1. **Values / profile save** → Dream Job Profile strength / content updates (or clear “migration required” messaging if DB is behind).
2. **Matched jobs or jobs feed** → “why this matches” and alignment.
3. **Auto-apply** → thresholds and review vs trusted framing (no promise of email).
4. **Application** → move to **Submitted** → **in-dashboard dossier** appears (or explicit generate / deploy message).
5. **Dashboard overview** → snapshot, matches, applications, signals.

---

## Monday demo script (exact click path)

Use a **staging or production** build where migrations and edge functions are deployed. As **admin**, open **`/admin/launch-health`** first and confirm no red blockers.

### Happy-path clicks

1. **Home (signed in)** — Primary: **Open command center** → `/dashboard?tab=overview`.
2. **Overview** — Point to snapshot, Dream Job Profile block, matches, applications, signals, today’s move.
3. **Dream Job Profile** — Sidebar or blocks: **Profile** (`?tab=profile`) or **Values** (`?tab=values`); adjust a field, save; return to overview or open **Jobs feed** (`/jobs-feed`).
4. **Matches** — Dashboard **Matched Jobs** tab (`?tab=matches`) or **jobs feed** — open a role, show alignment / explainer.
5. **Applications** — **Tracker** (`?tab=tracker`); open an application → **detail** `/applications/:id`.
6. **Dossier** — On detail, show **Dossier ready** + in-dashboard markdown; say email is **separate** (see below).

### What to avoid showing if email is not configured

- Do **not** say “we emailed you the dossier” or demo outbound mail.
- The UI already labels **delivery pending** / **email not configured** — stay with **in-dashboard receipt** language.

### What to say is live vs coming next

| Live Monday | Say “coming next” |
|-------------|-------------------|
| Dream Job Profile merge + version | Deeper resume intelligence |
| values-job-matcher + explainers | More job sources |
| Application tracker + status | Full ATS integrations |
| generate-application-dossier → markdown in app | Automated email sends from our domain |
| Auto-apply settings + queue framing | Hands-free apply at scale |

## What can wait until after launch

- Full email delivery automation and marketing drips from dossier rows.
- Any new product surfaces beyond tightening copy, empty states, and deploy hygiene.
