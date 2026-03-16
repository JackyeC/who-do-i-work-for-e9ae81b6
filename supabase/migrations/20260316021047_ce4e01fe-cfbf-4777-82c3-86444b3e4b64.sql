CREATE TABLE public.healthcare_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'healthcare',
  signal_type text NOT NULL,
  violation_type text,
  case_number text,
  filing_date date,
  settlement_amount numeric,
  organization_name text,
  coverage_type text,
  location_state text,
  description text,
  source_name text NOT NULL DEFAULT 'DOL EBSA',
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.healthcare_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read healthcare_signals" ON public.healthcare_signals FOR SELECT USING (true);
CREATE INDEX idx_healthcare_company ON public.healthcare_signals(company_id);
CREATE INDEX idx_healthcare_type ON public.healthcare_signals(signal_type);