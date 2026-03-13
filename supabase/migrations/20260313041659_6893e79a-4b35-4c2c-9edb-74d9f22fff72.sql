-- Remove the old permissive INSERT policy on company_scan_events
DROP POLICY IF EXISTS "Anyone can log a scan" ON public.company_scan_events;
