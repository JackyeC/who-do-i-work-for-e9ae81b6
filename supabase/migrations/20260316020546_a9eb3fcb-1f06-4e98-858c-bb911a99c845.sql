CREATE TABLE public.civil_rights_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'civil_rights',
  signal_type text NOT NULL,
  violation_type text,
  case_number text,
  filing_date date,
  settlement_amount numeric,
  organization_name text,
  hrc_score integer,
  location_state text,
  description text,
  source_name text NOT NULL DEFAULT 'EEOC',
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.civil_rights_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read civil_rights_signals" ON public.civil_rights_signals FOR SELECT USING (true);
CREATE INDEX idx_civil_rights_company ON public.civil_rights_signals(company_id);
CREATE INDEX idx_civil_rights_type ON public.civil_rights_signals(signal_type);