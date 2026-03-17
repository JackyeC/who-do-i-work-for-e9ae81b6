
-- Innovation & Patents table for company patent intelligence
CREATE TABLE public.company_patents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  patent_number TEXT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  filing_date DATE,
  grant_date DATE,
  patent_type TEXT DEFAULT 'utility',
  category TEXT,
  inventors TEXT[],
  assignee_name TEXT,
  source_url TEXT,
  source TEXT DEFAULT 'patentsview',
  confidence TEXT DEFAULT 'High',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, patent_number)
);

ALTER TABLE public.company_patents ENABLE ROW LEVEL SECURITY;

-- Public read access (company intelligence is public data)
CREATE POLICY "Anyone can read company patents"
  ON public.company_patents FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage patents"
  ON public.company_patents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_company_patents_company_id ON public.company_patents(company_id);
CREATE INDEX idx_company_patents_filing_date ON public.company_patents(filing_date DESC);
