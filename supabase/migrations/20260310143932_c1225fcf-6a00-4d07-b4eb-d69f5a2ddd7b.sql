-- Allow authenticated users to read scan_runs
DROP POLICY IF EXISTS "Only service role can read scan runs" ON public.scan_runs;

CREATE POLICY "Authenticated users can read scan runs"
  ON public.scan_runs
  FOR SELECT
  TO authenticated
  USING (true);

-- Keep service_role access too
CREATE POLICY "Service role full access to scan runs"
  ON public.scan_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);