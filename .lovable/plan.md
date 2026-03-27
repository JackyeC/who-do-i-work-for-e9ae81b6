

## Fix: Employer Rebuttals Email Exposure

### The Problem

The `employer_rebuttals` table has a SELECT policy allowing **anyone** (anon + authenticated) to read **all columns** of approved rows. This exposes:
- `submitted_by_email` — personal data
- `reviewer_notes` — internal moderation notes
- `reviewed_at` — internal workflow data

The component queries `SELECT *`, pulling all of these to the client.

### The Fix (3 steps)

**Step 1 — Migration: Drop public SELECT policy, create safe view**

```sql
-- Remove the overly permissive policy
DROP POLICY "Public can view approved rebuttals" ON public.employer_rebuttals;

-- Create a view that only exposes safe fields
CREATE VIEW public.public_employer_rebuttals AS
SELECT
  id,
  company_id,
  rebuttal_text,
  evidence_url,
  status,
  created_at
FROM public.employer_rebuttals
WHERE status = 'approved';

-- Grant read access on the view to anon and authenticated
GRANT SELECT ON public.public_employer_rebuttals TO anon, authenticated;
```

After this, only admins (via `has_role`) can SELECT from the base table. Public users read from the view which excludes `submitted_by_email`, `reviewer_notes`, and `reviewed_at`.

**Step 2 — Update `EmployerRebuttalSection.tsx`**

Change the query from:
```typescript
.from("employer_rebuttals").select("*")
```
to:
```typescript
.from("public_employer_rebuttals").select("*")
```

Only the read query changes. The insert (for submitting rebuttals) stays on the base table — that policy is fine since it's INSERT-only.

**Step 3 — Run security scanner**

Re-run the security scanner to confirm the exposure is resolved.

### What stays the same
- Insert policy (anyone can submit) — unchanged
- Admin full-access policy — unchanged
- Insert logic in the component — unchanged

### Files changed
- New migration SQL (1 file)
- `src/components/company/EmployerRebuttalSection.tsx` (1 line change)

