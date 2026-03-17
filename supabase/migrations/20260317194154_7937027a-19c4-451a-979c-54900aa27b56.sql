
-- Drop old permissive policies (exact names from pg_policies)
DROP POLICY "Service insert board_interlocks" ON public.board_interlocks;
DROP POLICY "Service role full access for climate_signals" ON public.climate_signals;
DROP POLICY "Authenticated users can insert companies" ON public.companies;
DROP POLICY "Authenticated inserts report sections" ON public.company_report_sections;
DROP POLICY "Authenticated updates report sections" ON public.company_report_sections;
DROP POLICY "Authenticated inserts sanctions" ON public.company_sanctions_screening;
DROP POLICY "Authenticated updates sanctions" ON public.company_sanctions_screening;
DROP POLICY "Authenticated inserts wikidata" ON public.company_wikidata;
DROP POLICY "Authenticated updates wikidata" ON public.company_wikidata;
DROP POLICY "Service role can manage compensation_data" ON public.compensation_data;
DROP POLICY "Service role can manage contradiction signals" ON public.contradiction_signals;
DROP POLICY "Service insert gun_industry_signals" ON public.gun_industry_signals;
DROP POLICY "Service insert healthcare_signals" ON public.healthcare_signals;
DROP POLICY "Service insert immigration_signals" ON public.immigration_signals;
DROP POLICY "Service role can manage leader enrichments" ON public.leader_enrichments;
DROP POLICY "Service insert regulatory_violations" ON public.regulatory_violations;
DROP POLICY "Service role can manage signal sources" ON public.signal_sources;
DROP POLICY "Authenticated inserts scan jobs" ON public.scan_jobs;
DROP POLICY "Authenticated updates scan jobs" ON public.scan_jobs;

-- Drop any duplicate admin policies from previous attempts
DROP POLICY IF EXISTS "Admin insert board_interlocks" ON public.board_interlocks;
DROP POLICY IF EXISTS "Admin manage climate_signals" ON public.climate_signals;
DROP POLICY IF EXISTS "Admin full access climate_signals" ON public.climate_signals;
DROP POLICY IF EXISTS "Admin insert companies" ON public.companies;
DROP POLICY IF EXISTS "Admin insert report_sections" ON public.company_report_sections;
DROP POLICY IF EXISTS "Admin update report_sections" ON public.company_report_sections;
DROP POLICY IF EXISTS "Admin insert sanctions" ON public.company_sanctions_screening;
DROP POLICY IF EXISTS "Admin update sanctions" ON public.company_sanctions_screening;
DROP POLICY IF EXISTS "Admin insert wikidata" ON public.company_wikidata;
DROP POLICY IF EXISTS "Admin update wikidata" ON public.company_wikidata;
DROP POLICY IF EXISTS "Admin manage compensation_data" ON public.compensation_data;
DROP POLICY IF EXISTS "Admin manage contradiction_signals" ON public.contradiction_signals;
DROP POLICY IF EXISTS "Admin insert gun_industry_signals" ON public.gun_industry_signals;
DROP POLICY IF EXISTS "Admin insert healthcare_signals" ON public.healthcare_signals;
DROP POLICY IF EXISTS "Admin insert immigration_signals" ON public.immigration_signals;
DROP POLICY IF EXISTS "Admin manage leader_enrichments" ON public.leader_enrichments;
DROP POLICY IF EXISTS "Admin insert regulatory_violations" ON public.regulatory_violations;
DROP POLICY IF EXISTS "Admin manage signal_sources" ON public.signal_sources;
DROP POLICY IF EXISTS "Admin insert scan_jobs" ON public.scan_jobs;
DROP POLICY IF EXISTS "Admin update scan_jobs" ON public.scan_jobs;
DROP POLICY IF EXISTS "Admin can insert scan_jobs" ON public.scan_jobs;
DROP POLICY IF EXISTS "Admin can update scan_jobs" ON public.scan_jobs;
DROP POLICY IF EXISTS "Admins can insert scan jobs" ON public.scan_jobs;
DROP POLICY IF EXISTS "Admins can update scan jobs" ON public.scan_jobs;

-- Recreate all 19 with admin-only checks
CREATE POLICY "Admin write board_interlocks" ON public.board_interlocks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write climate_signals" ON public.climate_signals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write report_sections" ON public.company_report_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edit report_sections" ON public.company_report_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write sanctions" ON public.company_sanctions_screening FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edit sanctions" ON public.company_sanctions_screening FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write wikidata" ON public.company_wikidata FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edit wikidata" ON public.company_wikidata FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write compensation_data" ON public.compensation_data FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write contradiction_signals" ON public.contradiction_signals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write gun_industry_signals" ON public.gun_industry_signals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write healthcare_signals" ON public.healthcare_signals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write immigration_signals" ON public.immigration_signals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write leader_enrichments" ON public.leader_enrichments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write regulatory_violations" ON public.regulatory_violations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write signal_sources" ON public.signal_sources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write scan_jobs" ON public.scan_jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin edit scan_jobs" ON public.scan_jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
