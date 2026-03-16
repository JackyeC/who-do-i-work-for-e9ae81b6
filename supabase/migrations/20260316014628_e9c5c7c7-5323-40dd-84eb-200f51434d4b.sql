CREATE TABLE public.labor_rights_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'labor_rights',
  signal_type text NOT NULL,
  case_number text,
  filing_date date,
  resolution_date date,
  resolution_type text,
  union_name text,
  employees_affected integer,
  location_state text,
  description text,
  source_name text NOT NULL,
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.labor_rights_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read labor_rights_signals" ON public.labor_rights_signals FOR SELECT USING (true);

CREATE INDEX idx_labor_rights_signals_company ON public.labor_rights_signals(company_id);
CREATE INDEX idx_labor_rights_signals_type ON public.labor_rights_signals(signal_type);