# Edge Function JWT Audit

Last updated: 2026-04-05

## Categories

### Webhooks / OAuth callbacks — `verify_jwt = false` required

These endpoints receive inbound calls from external services that cannot send a Supabase JWT.
Each has its own signature/secret validation.

| Function | Gate |
|---|---|
| `browse-ai-webhook` | Validates Browse AI signature |
| `stripe-webhook` | Validates `STRIPE_WEBHOOK_SECRET` signature |
| `linkedin-auth` | OAuth initiation — no write |
| `linkedin-callback` | OAuth callback — validates state param |
| `submit-contact-form` | Public endpoint, Turnstile captcha verified |

### Cron / Service-role only — `verify_jwt = false`, in-code service-role gate

Called by `pg_cron` or internal orchestration with `Authorization: Bearer <service_role_key>`.
Each checks `token === SUPABASE_SERVICE_ROLE_KEY` as first gate.

| Function | Confirmed gate |
|---|---|
| `daily-gov-data-refresh` | service-role check |
| `deactivate-expired-jobs` | service-role check |
| `daily-intelligence-preload` | service-role client |
| `scheduled-leadership-refresh` | service-role check |
| `sync-bls-data` | service-role check |
| `sync-work-news` | service-role check |
| `sync-opensanctions` | service-role check |
| `sync-wikidata` | service-role check |
| `sync-labor-rights` | service-role check |
| `sync-immigration-signals` | service-role check |
| `sync-climate-signals` | service-role check |
| `sync-gun-policy-signals` | service-role check |
| `sync-civil-rights-signals` | service-role check |
| `sync-healthcare-signals` | service-role check |
| `sync-consumer-protection-signals` | service-role check |
| `sync-regulatory-violations` | service-role check |
| `seed-*` (all 7 seed functions) | service-role check |
| `extract-corporate-claims` | service-role check |
| `detect-contradictions` | service-role check |
| `detect-board-interlocks` | service-role check |
| `calculate-alignment-scores` | service-role check |
| `seed-company-intelligence` | service-role check |
| `bulk-scrape-strategic-jobs` | service-role check |
| `eeoc-case-scanner` | service-role check |
| `osint-parallel-scan` | service-role check |
| `news-ingestion` | service-role check |
| `generate-briefing` | service-role check |
| `fec-pac-recipients` | service-role check |
| `leader-enrich` | service-role check |
| `generate-battle-image` | service-role check |
| `process-apply-queue` | service-role check |
| `jackyefy-news` | service-role check |

### User-facing — `verify_jwt = false`, in-code JWT validation via `requireAuth()`

| Function | Additional gate |
|---|---|
| `ai-accountability-scan` | `requireAuth()` + admin role check |
| `career-gap-analysis` | `requireAuth()` |
| `offer-clarity-scan` | `requireAuth()` |
| `translate-signals` | `requireAuth()` |
| `career-discovery` | `requireAuth()` |
| `dream-job-detect` | `requireAuth()` |
| `negotiation-simulator` | `requireAuth()` |
| `negotiation-coach` | `requireAuth()` |
| `company-research-perplexity` | `requireAuth()` |
| `fetch-company-compensation` | `requireAuth()` |
| `receipts-timeline` | `requireAuth()` |

### Mixed / special

| Function | Note |
|---|---|
| `parse-resume` | Public upload endpoint, no auth needed |
| `check-subscription` | User JWT validated via `getUser()` |
| `skill-gap-gigs` | Default `verify_jwt` (true) |

## Notes

- `verify_jwt = false` is required for all of the above because the Lovable Cloud signing-keys system uses in-code validation.
- Service-role cron functions could theoretically use `verify_jwt = true` since the service-role key is a valid JWT, but this would break `invoke_edge_function()` calls from `pg_cron` which use the anon key via vault. Keeping `verify_jwt = false` with in-code service-role check is the correct pattern.
- Error responses in all listed functions now return generic messages (e.g. `"Request failed"`) instead of raw `error.message` strings.
