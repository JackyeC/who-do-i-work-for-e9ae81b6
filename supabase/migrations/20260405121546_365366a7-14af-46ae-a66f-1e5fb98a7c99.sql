
-- ============================================================
-- Admin-only write policies for critical intelligence tables
-- ============================================================

-- 1. Tables needing full INSERT/UPDATE/DELETE admin policies
-- Using a single ALL policy per table for simplicity

-- ai_hiring_signals
CREATE POLICY "Admin write ai_hiring_signals"
ON public.ai_hiring_signals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ai_hr_signals
CREATE POLICY "Admin write ai_hr_signals"
ON public.ai_hr_signals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- board_members
CREATE POLICY "Admin write board_members"
ON public.board_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- civil_rights_signals
CREATE POLICY "Admin write civil_rights_signals"
ON public.civil_rights_signals FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_advisory_committees
CREATE POLICY "Admin write company_advisory_committees"
ON public.company_advisory_committees FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_agency_contracts
CREATE POLICY "Admin write company_agency_contracts"
ON public.company_agency_contracts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_executives
CREATE POLICY "Admin write company_executives"
ON public.company_executives FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_jobs
CREATE POLICY "Admin write company_jobs"
ON public.company_jobs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_signal_scans
CREATE POLICY "Admin write company_signal_scans"
ON public.company_signal_scans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_warn_notices
CREATE POLICY "Admin write company_warn_notices"
ON public.company_warn_notices FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- company_worker_sentiment
CREATE POLICY "Admin write company_worker_sentiment"
ON public.company_worker_sentiment FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- entity_linkages
CREATE POLICY "Admin write entity_linkages"
ON public.entity_linkages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- work_news
CREATE POLICY "Admin write work_news"
ON public.work_news FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Tables needing UPDATE + DELETE added (INSERT already admin-gated)

-- accountability_signals: add UPDATE and DELETE
CREATE POLICY "Admin update accountability_signals"
ON public.accountability_signals FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete accountability_signals"
ON public.accountability_signals FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- board_interlocks: add UPDATE and DELETE
CREATE POLICY "Admin update board_interlocks"
ON public.board_interlocks FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin delete board_interlocks"
ON public.board_interlocks FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- company_court_cases: add DELETE
CREATE POLICY "Admin delete court_cases"
ON public.company_court_cases FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- company_report_sections: add DELETE
CREATE POLICY "Admin delete report_sections"
ON public.company_report_sections FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
