
-- Fix scan_jobs: lock to admin-only (no user_id column exists)
-- Previous migration partially applied up to the scan_jobs failure,
-- so we only need to handle scan_jobs policies now.

DROP POLICY IF EXISTS "Authenticated users can insert scan jobs" ON public.scan_jobs;
DROP POLICY IF EXISTS "Authenticated users can update scan jobs" ON public.scan_jobs;

CREATE POLICY "Admin can insert scan_jobs"
  ON public.scan_jobs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update scan_jobs"
  ON public.scan_jobs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
