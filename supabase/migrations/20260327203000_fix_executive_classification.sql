-- ============================================================
-- Fix: Distinguish verified executives from FEC individual donors
-- 
-- Problem: The company_executives table stored both actual C-suite
-- executives AND regular employees who happened to make FEC donations.
-- Everyone was displayed under "Executive Leadership" regardless of
-- their actual role.
--
-- Solution: Add role_classification column and reclassify existing
-- records based on their self-reported title from FEC filings.
-- ============================================================

-- 1. Add role_classification column
ALTER TABLE public.company_executives
  ADD COLUMN IF NOT EXISTS role_classification text NOT NULL DEFAULT 'fec_donor';

-- Add check constraint for valid values
ALTER TABLE public.company_executives
  ADD CONSTRAINT chk_role_classification
  CHECK (role_classification IN ('verified_executive', 'fec_donor', 'unverified'));

-- 2. Reclassify existing records based on title patterns
-- Mark people with executive-level titles as verified_executive
UPDATE public.company_executives
SET role_classification = 'verified_executive'
WHERE title ~* '\m(CEO|CFO|COO|CTO|CIO|CISO|CMO|CPO|CLO|CDO|CSO|CHRO|CAO|CRO|CCO|CHAIRMAN|CHAIRWOMAN|CHAIR|PRESIDENT|VICE\s*PRESIDENT|SVP|EVP|MANAGING\s*DIRECTOR|GENERAL\s*COUNSEL|PARTNER|FOUNDER|CO-?FOUNDER|OWNER|CHIEF)\M';

-- Mark everyone else as fec_donor (which is already the default, 
-- but be explicit for records that pre-date this migration)
UPDATE public.company_executives
SET role_classification = 'fec_donor'
WHERE role_classification NOT IN ('verified_executive')
  AND title !~* '\m(CEO|CFO|COO|CTO|CIO|CISO|CMO|CPO|CLO|CDO|CSO|CHRO|CAO|CRO|CCO|CHAIRMAN|CHAIRWOMAN|CHAIR|PRESIDENT|VICE\s*PRESIDENT|SVP|EVP|MANAGING\s*DIRECTOR|GENERAL\s*COUNSEL|PARTNER|FOUNDER|CO-?FOUNDER|OWNER|CHIEF)\M';

-- Records manually inserted with verification_status = 'verified' 
-- from SEC data should also be classified as verified_executive
UPDATE public.company_executives
SET role_classification = 'verified_executive'
WHERE verification_status = 'verified'
  AND role_classification = 'fec_donor';

-- 3. Add index for fast filtering by classification
CREATE INDEX IF NOT EXISTS idx_exec_role_classification
  ON public.company_executives (company_id, role_classification);

-- 4. Add comment for documentation
COMMENT ON COLUMN public.company_executives.role_classification IS
  'verified_executive = confirmed C-suite/VP+ from SEC or manual review. fec_donor = individual who listed this company as employer on FEC donation filing (any role). unverified = needs review.';
