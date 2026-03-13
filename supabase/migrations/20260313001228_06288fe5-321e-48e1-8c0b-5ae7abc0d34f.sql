
-- Track company page views/scans for social proof
CREATE TABLE public.company_scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast aggregation
CREATE INDEX idx_scan_events_company ON public.company_scan_events(company_id);
CREATE INDEX idx_scan_events_time ON public.company_scan_events(scanned_at DESC);

-- Public read, anyone can insert (anonymous scan tracking)
ALTER TABLE public.company_scan_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scan counts"
  ON public.company_scan_events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can log a scan"
  ON public.company_scan_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Enable realtime for live ticker
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_scan_events;
