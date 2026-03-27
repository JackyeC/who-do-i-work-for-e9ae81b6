

## Fix: Build Error + Employer Rebuttals PII Exposure

Two issues need fixing — the build error is blocking **all** edge functions.

### Issue 1: Build Error (critical, blocks deployment)

**File**: `supabase/functions/parse-career-document/index.ts`

The `npm:` import specifier is not supported in Deno edge functions. Three dynamic imports must change:

| Line | Current | Fix |
|------|---------|-----|
| 27 | `npm:mammoth@1.6.0` | `https://esm.sh/mammoth@1.6.0` |
| 40 | `npm:jszip@3.10.1` | `https://esm.sh/jszip@3.10.1` |
| 62 | `npm:pdf-parse/lib/pdf-parse.js` | `https://esm.sh/pdf-parse@1.1.1` |

### Issue 2: Employer Rebuttals — PII Exposure

The component at `EmployerRebuttalSection.tsx` line 33 queries `SELECT *` from the raw `employer_rebuttals` table, which includes `submitted_by_email`, `reviewer_notes`, and `reviewed_at`.

**Step A — Database migration** (single SQL):

```sql
-- Drop public SELECT policy on the base table
DROP POLICY IF EXISTS "Public can view approved rebuttals"
  ON public.employer_rebuttals;

-- Create safe view with only public-facing fields
CREATE OR REPLACE VIEW public.public_employer_rebuttals
WITH (security_invoker = on) AS
SELECT id, company_id, rebuttal_text, evidence_url, status, created_at
FROM public.employer_rebuttals
WHERE status = 'approved';

-- Allow anon + authenticated to read the safe view
GRANT SELECT ON public.public_employer_rebuttals TO anon, authenticated;
```

**Step B — Frontend** (`EmployerRebuttalSection.tsx`):

Change line 33 from `.from("employer_rebuttals")` to `.from("public_employer_rebuttals")` and remove the `.eq("status", "approved")` filter on line 36 (the view handles it).

**Step C — Run security scan** to confirm the fix.

### Summary

| Change | File |
|--------|------|
| Fix 3 `npm:` → `esm.sh` imports | `supabase/functions/parse-career-document/index.ts` |
| Migration: drop public policy + create safe view | New migration SQL |
| Query safe view instead of raw table | `src/components/company/EmployerRebuttalSection.tsx` |
| Verify | Security scan |

