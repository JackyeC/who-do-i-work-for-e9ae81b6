
-- Fix: company_signal_scans INSERT policy is too permissive
-- Only service role should insert, not regular authenticated users
DROP POLICY IF EXISTS "Service role can insert signal scans" ON public.company_signal_scans;
-- No replacement needed - service role bypasses RLS automatically
