-- Fix company_source_documents
DROP POLICY IF EXISTS "Authenticated users can add source documents" ON public.company_source_documents;
CREATE POLICY "Admins can add source documents"
ON public.company_source_documents
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix scan_notify_requests
DROP POLICY IF EXISTS "Anyone can request scan notifications" ON public.scan_notify_requests;
CREATE POLICY "Anyone can request scan notifications"
ON public.scan_notify_requests
FOR INSERT TO public
WITH CHECK (email IS NOT NULL AND email <> '');

-- Fix scan_usage
DROP POLICY IF EXISTS "Anyone can create scan records" ON public.scan_usage;
CREATE POLICY "Anyone can create scan records"
ON public.scan_usage
FOR INSERT TO public
WITH CHECK (session_id IS NOT NULL AND scan_type IS NOT NULL);

-- Drop redundant service_role policies
DROP POLICY IF EXISTS "Service insert company_aliases" ON public.company_aliases;
DROP POLICY IF EXISTS "Service insert company_ip_signals" ON public.company_ip_signals;
DROP POLICY IF EXISTS "Service update company_ip_signals" ON public.company_ip_signals;
DROP POLICY IF EXISTS "Service role can insert domain review" ON public.domain_review_queue;
DROP POLICY IF EXISTS "Service insert ip_scan_jobs" ON public.ip_scan_jobs;
DROP POLICY IF EXISTS "Service update ip_scan_jobs" ON public.ip_scan_jobs;
DROP POLICY IF EXISTS "Service insert patent_records" ON public.patent_records;
DROP POLICY IF EXISTS "Service update patent_records" ON public.patent_records;
DROP POLICY IF EXISTS "Service insert trademark_assignments" ON public.trademark_assignments;
DROP POLICY IF EXISTS "Service insert trademark_records" ON public.trademark_records;
DROP POLICY IF EXISTS "Service update trademark_records" ON public.trademark_records;