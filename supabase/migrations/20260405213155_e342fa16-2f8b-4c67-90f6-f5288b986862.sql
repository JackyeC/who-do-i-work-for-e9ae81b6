-- Fix scan_usage: anonymous SELECT was too broad (leaked all rows with session_id IS NOT NULL)
DROP POLICY IF EXISTS "Users can read own scans" ON public.scan_usage;

-- Authenticated users: read own rows by user_id
CREATE POLICY "Authenticated users read own scans"
ON public.scan_usage FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Anonymous users: read only rows matching their session via request header
CREATE POLICY "Anonymous users read own session scans"
ON public.scan_usage FOR SELECT TO anon
USING (
  session_id IS NOT NULL
  AND session_id = current_setting('request.headers', true)::json->>'x-session-id'
);