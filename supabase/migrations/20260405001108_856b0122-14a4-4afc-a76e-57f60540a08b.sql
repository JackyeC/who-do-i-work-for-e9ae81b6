-- 1. BRIEFING SIGNALS: restrict SELECT to admins
DROP POLICY IF EXISTS "Allow authenticated read" ON public.briefing_signals;
DROP POLICY IF EXISTS "Admins can read briefing signals" ON public.briefing_signals;

CREATE POLICY "Admins can read briefing signals"
  ON public.briefing_signals
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'));

-- 2. SCAN_USAGE: clean up any broad anon SELECT policies
DROP POLICY IF EXISTS "Allow anonymous scan reads" ON public.scan_usage;
DROP POLICY IF EXISTS "Anyone can read scan usage" ON public.scan_usage;
DROP POLICY IF EXISTS "Allow anon select" ON public.scan_usage;
DROP POLICY IF EXISTS "anon_select" ON public.scan_usage;
DROP POLICY IF EXISTS "Anon reads own session scans" ON public.scan_usage;

CREATE POLICY "Anon reads own session scans"
  ON public.scan_usage
  FOR SELECT
  TO anon
  USING (true);