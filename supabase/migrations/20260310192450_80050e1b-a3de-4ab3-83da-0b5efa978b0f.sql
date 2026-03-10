
CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  issue_area text CHECK (issue_area IN ('Labor Rights', 'Immigration', 'Climate', 'Gun Policy', 'Civil Rights')),
  signal_type text,
  description text,
  source_url text,
  date_published date,
  confidence_level int DEFAULT 3 CHECK (confidence_level >= 1 AND confidence_level <= 5),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on signals"
  ON public.signals
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_signals_company_id ON public.signals(company_id);
CREATE INDEX idx_signals_issue_area ON public.signals(issue_area);
