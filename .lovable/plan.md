

## Production-Grade Platform Protection

### 1. Fix build (critical — everything is blocked)

**File: `supabase/functions/parse-career-document/index.ts`**

Replace all `npm:` specifiers with `https://esm.sh/` URLs:
- `npm:mammoth@1.6.0` → `https://esm.sh/mammoth@1.6.0`
- `npm:jszip@3.10.1` → `https://esm.sh/jszip@3.10.1`
- `npm:pdf-parse/lib/pdf-parse.js` → `https://esm.sh/pdf-parse@1.1.1`

This is the sole cause of the current build failure.

---

### 2. Shared security module

**New file: `supabase/functions/_shared/security.ts`**

Centralized utilities every edge function imports:

| Utility | What it does |
|---|---|
| `getStrictCorsHeaders(req)` | Returns CORS headers scoped to origin allowlist: `who-do-i-work-for.lovable.app`, `*.lovable.app` previews, `localhost:*` |
| `rateLimiter(ip, endpoint, limit, windowSec)` | In-memory IP rate limiter with configurable windows |
| `safeError(status, publicMsg)` | Returns generic error Response; logs real error server-side only |
| `validateBodySize(req, maxBytes)` | Rejects requests over size limit (default 1MB) |
| `withTimeout(promise, ms)` | Wraps async calls with AbortController timeout |
| `auditLog(supabase, event)` | Inserts into `security_audit_log` table |
| `requireAuth(req, supabase)` | Validates JWT and returns user; logs failures |
| `requireServiceRole(req)` | Validates service-role key for admin endpoints |

---

### 3. Database: `security_audit_log` table

```sql
CREATE TABLE public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,        -- 'rate_limit_hit', 'auth_failed', 'scraping_detected', 'oversized_request'
  ip_address text,
  endpoint text,
  user_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
-- No public policies — service_role only
```

---

### 4. Endpoint classification & rate limits

Every function gets the shared middleware applied. Here is the full classification:

#### Public endpoints (no auth required)

| Endpoint | Rate limit | Abuse risk |
|---|---|---|
| `company-research` | 5/min/IP | High — scraping, data harvesting |
| `voter-lookup` | 5/min/IP | High — PII adjacent, enumeration |
| `social-scan` | 5/min/IP | Medium — AI cost |
| `company-discover` | 10/min/IP | Medium — enumeration |
| `fetch-job-feeds` | 10/min/IP | Low — RSS proxy |
| `fetch-stock-chart` | 10/min/IP | Low — proxy |
| `fetch-company-branding` | 10/min/IP | Low |
| `fetch-company-compensation` | 10/min/IP | Low |
| `dynamic-sitemap` | 3/min/IP | Low |
| `verify-turnstile` | 10/min/IP | Low |
| `anonymous-checkout` | 3/min/IP | Medium — payment abuse |
| `generate-og-card` | 10/min/IP | Low |

#### Auth-required endpoints (JWT validated in code)

| Endpoint | Rate limit | Abuse risk |
|---|---|---|
| `ask-jackye` / `ask-jackye-chat` | 10/min/user | Medium — AI cost |
| `offer-clarity-scan` | 5/min/user | Medium — AI cost |
| `offer-strength-score` | 5/min/user | Medium |
| `career-discovery` / `career-gap-analysis` | 5/min/user | Medium |
| `dream-job-detect` | 5/min/user | Medium |
| `negotiation-coach` / `negotiation-simulator` | 5/min/user | Medium |
| `generate-briefing` / `debug-briefing` | 5/min/user | Medium |
| `tailor-resume` / `parse-resume` | 5/min/user | Medium — file upload |
| `parse-career-document` | 5/min/user | Medium — file upload |
| `email-career-results` | 3/min/user | Medium — email abuse |
| `create-checkout` / `customer-portal` | 5/min/user | Medium — payment |
| `purchase-credits` / `verify-credit-purchase` | 5/min/user | Medium |
| `check-subscription` | 10/min/user | Low |
| `calculate-alignment-scores` | 5/min/user | Low |
| `candidate-voting-summary` | 5/min/user | Low |
| `generate-values-check` / `values-scan` / `values-job-matcher` | 5/min/user | Medium |
| `ideology-scan` | 5/min/user | Medium |
| `generate-smart-goals` / `skill-gap-gigs` | 5/min/user | Low |
| `generate-application-payload` | 5/min/user | Low |
| `job-questions` | 5/min/user | Low |
| `survivor-alert` | 5/min/user | Low |
| `translate-signals` | 5/min/user | Low |
| `assign-beta-role` | 3/min/user | Medium — brute force |

#### Admin/internal endpoints (service-role key required)

| Endpoint | Rate limit | Abuse risk |
|---|---|---|
| `osint-parallel-scan` | None (already guarded) | Low if auth holds |
| `sync-*` (all 18 sync functions) | None | Low — internal |
| `seed-*` (all 7 seed functions) | None | Low — internal |
| `bulk-*` (3 functions) | None | Low — internal |
| `daily-*` (2 functions) | None | Low — cron |
| `detect-contradictions` | None | Low |
| `generate-company-signals` | None | Low |
| `enrich-private-company` | None | Low |
| `map-issue-signals` | None | Low |
| `news-ingestion` | None | Low |
| `scheduled-leadership-refresh` | None | Low |
| `deactivate-expired-jobs` | None | Low |
| Various scan internals (`patent-scan`, `pay-equity-scan`, `eeoc-*`, etc.) | None | Low |

---

### 5. Anomaly detection

**New file: `supabase/functions/detect-anomalies/index.ts`**

Queries `security_audit_log` for patterns:
- Same IP hitting > 50 endpoints in 5 minutes → flag `scraping_detected`
- Same IP getting > 10 `auth_failed` events in 5 minutes → flag `auth_probing`
- Same IP hitting same endpoint > 20 times in 1 minute → flag `endpoint_abuse`

Stores alerts back into `security_audit_log` with `event_type = 'anomaly_detected'`. Can be invoked by cron or by the rate limiter when thresholds are crossed.

---

### 6. What gets applied to every function

Each edge function gets this pattern at the top:

```typescript
import { getStrictCorsHeaders, rateLimiter, safeError, validateBodySize } from '../_shared/security.ts';

Deno.serve(async (req) => {
  const corsHeaders = getStrictCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Size limit
  const sizeCheck = validateBodySize(req, 1_000_000);
  if (sizeCheck) return sizeCheck;

  // Rate limit (public endpoints)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = rateLimiter(ip, 'endpoint-name', 5, 60);
  if (rl) return rl;

  try {
    // ... existing logic ...
  } catch (error) {
    console.error('Internal:', error);
    return safeError(500, 'Internal server error', corsHeaders);
  }
});
```

---

### 7. Global security headers

Added to every response via `getStrictCorsHeaders`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'none'
```

---

### 8. Implementation order

1. Fix `parse-career-document` `npm:` imports → unblock build
2. Create `_shared/security.ts` with all utilities
3. Create `security_audit_log` table (migration)
4. Apply middleware to high-risk public endpoints first (company-research, voter-lookup, social-scan)
5. Apply to remaining public endpoints
6. Apply auth validation to user-facing endpoints
7. Verify admin endpoints have service-role guards
8. Create `detect-anomalies` function
9. Verify build succeeds

### Files changed
- `supabase/functions/parse-career-document/index.ts` (fix imports)
- `supabase/functions/_shared/security.ts` (new)
- `supabase/functions/detect-anomalies/index.ts` (new)
- Migration for `security_audit_log` table
- ~40 edge function files (add security middleware imports)

