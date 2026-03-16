CREATE TABLE public.immigration_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'immigration',
  signal_type text NOT NULL,
  case_number text,
  filing_date date,
  resolution_date date,
  visa_type text,
  job_title text,
  wage_offered numeric,
  workers_affected integer,
  location_state text,
  description text,
  source_name text NOT NULL,
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.immigration_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read immigration_signals" ON public.immigration_signals FOR SELECT USING (true);
CREATE INDEX idx_immigration_signals_company ON public.immigration_signals(company_id);
CREATE INDEX idx_immigration_signals_type ON public.immigration_signals(signal_type);