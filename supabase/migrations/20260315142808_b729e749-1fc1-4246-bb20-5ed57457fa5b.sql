
-- Tighten write policies to only allow authenticated or service-role writes
DROP POLICY "Service role inserts report sections" ON public.company_report_sections;
DROP POLICY "Service role updates report sections" ON public.company_report_sections;
DROP POLICY "Service role inserts scan jobs" ON public.scan_jobs;
DROP POLICY "Service role updates scan jobs" ON public.scan_jobs;

-- Only authenticated users (edge functions use service role which bypasses RLS anyway)
CREATE POLICY "Authenticated inserts report sections"
  ON public.company_report_sections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated updates report sections"
  ON public.company_report_sections FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated inserts scan jobs"
  ON public.scan_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated updates scan jobs"
  ON public.scan_jobs FOR UPDATE
  TO authenticated
  USING (true);
