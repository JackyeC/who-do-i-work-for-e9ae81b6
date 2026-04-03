CREATE TABLE public.scan_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT NULL,
  session_id TEXT NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'company',
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_usage ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous + authenticated)
CREATE POLICY "Anyone can create scan records"
  ON public.scan_usage FOR INSERT
  WITH CHECK (true);

-- Users can read their own records
CREATE POLICY "Users can read own scans"
  ON public.scan_usage FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE INDEX idx_scan_usage_session ON public.scan_usage (session_id);
CREATE INDEX idx_scan_usage_user ON public.scan_usage (user_id) WHERE user_id IS NOT NULL;