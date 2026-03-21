
-- Fix 1: early_access_signups - replace public SELECT with admin-only SELECT
-- The app only uses count with head:true, which works via the INSERT policy's implicit count
-- We'll restrict SELECT to admins only and create an RPC for the public count

DROP POLICY "Anyone can read signup count" ON public.early_access_signups;

-- Admin-only read
CREATE POLICY "Admin can read early_access_signups"
  ON public.early_access_signups FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create a security definer function for public count only
CREATE OR REPLACE FUNCTION public.get_early_access_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.early_access_signups;
$$;

-- Fix 2: Change service insert/update policies from public to service_role on IP tables

-- company_ip_signals
DROP POLICY "Service insert company_ip_signals" ON public.company_ip_signals;
DROP POLICY "Service update company_ip_signals" ON public.company_ip_signals;
CREATE POLICY "Service insert company_ip_signals" ON public.company_ip_signals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service update company_ip_signals" ON public.company_ip_signals FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- patent_records
DROP POLICY "Service insert patent_records" ON public.patent_records;
DROP POLICY "Service update patent_records" ON public.patent_records;
CREATE POLICY "Service insert patent_records" ON public.patent_records FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service update patent_records" ON public.patent_records FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- trademark_records
DROP POLICY "Service insert trademark_records" ON public.trademark_records;
DROP POLICY "Service update trademark_records" ON public.trademark_records;
CREATE POLICY "Service insert trademark_records" ON public.trademark_records FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service update trademark_records" ON public.trademark_records FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- trademark_assignments
DROP POLICY "Service insert trademark_assignments" ON public.trademark_assignments;
CREATE POLICY "Service insert trademark_assignments" ON public.trademark_assignments FOR INSERT TO service_role WITH CHECK (true);

-- company_aliases
DROP POLICY "Service insert company_aliases" ON public.company_aliases;
CREATE POLICY "Service insert company_aliases" ON public.company_aliases FOR INSERT TO service_role WITH CHECK (true);

-- ip_scan_jobs
DROP POLICY "Service insert ip_scan_jobs" ON public.ip_scan_jobs;
DROP POLICY "Service update ip_scan_jobs" ON public.ip_scan_jobs;
CREATE POLICY "Service insert ip_scan_jobs" ON public.ip_scan_jobs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service update ip_scan_jobs" ON public.ip_scan_jobs FOR UPDATE TO service_role USING (true) WITH CHECK (true);
