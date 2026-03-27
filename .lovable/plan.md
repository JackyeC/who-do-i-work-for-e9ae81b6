

## Fix: Build Error + Employer Rebuttals Security

Two issues to resolve in one pass.

### Issue 1: Build Error (blocking all edge functions)

**File**: `supabase/functions/parse-career-document/index.ts`

The `npm:` import specifier is not supported. Three lines need updating:

- Line 27: `npm:mammoth@1.6.0` → `https://esm.sh/mammoth@1.6.0`
- Line 40: `npm:jszip@3.10.1` → `https://esm.sh/jszip@3.10.1`
- Line 62: `npm:pdf-parse/lib/pdf-parse.js` → `https://esm.sh/pdf-parse@1.1.1`

### Issue 2: Employer Rebuttals PII Exposure

The `employer_rebuttals` table contains `submitted_by_email`, `reviewer_notes`, and `reviewed_at`. The component currently queries `SELECT *` from the base table, exposing all columns to the client.

**Step A — Database migration**:

```sql
-- Drop the public SELECT policy on the base table
DROP POLICY IF EXISTS "Public can view approved rebuttals" ON public.employer_rebuttals;

-- Create a safe view exposing only public-safe fields
CREATE VIEW public.public_employer_rebuttals AS
SELECT id, company_id, rebuttal_text, evidence_url, status, created_at
FROM public.employer_rebuttals
WHERE status = 'approved';

-- Grant read access to anon and authenticated
GRANT SELECT ON public.public_employer_rebuttals TO anon, authenticated;
```

**Step B — Frontend update** (`EmployerRebuttalSection.tsx`, line 33):

Change `.from("employer_rebuttals")` to `.from("public_employer_rebuttals")`.

Remove the `.eq("status", "approved")` filter since the view already handles that.

### Files changed
- `supabase/functions/parse-career-document/index.ts` (3 import fixes)
- `src/components/company/EmployerRebuttalSection.tsx` (1 query change)
- New database migration (view creation + policy drop)

