DROP POLICY IF EXISTS "Service role can manage signal sources" ON public.signal_sources;
CREATE POLICY "Service role can manage signal sources"
  ON public.signal_sources FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);