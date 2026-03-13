
-- Fix 1: company_scan_events - restrict INSERT to authenticated users only
-- and validate company_id exists
DROP POLICY IF EXISTS "Anyone can insert scan events" ON public.company_scan_events;

CREATE POLICY "Authenticated users can insert scan events"
ON public.company_scan_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.companies WHERE id = company_id)
);

-- Fix 2: warn_sync_log - restrict SELECT to admin/owner roles only
DROP POLICY IF EXISTS "Anyone can read warn sync log" ON public.warn_sync_log;

CREATE POLICY "Only admins can read warn sync log"
ON public.warn_sync_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
