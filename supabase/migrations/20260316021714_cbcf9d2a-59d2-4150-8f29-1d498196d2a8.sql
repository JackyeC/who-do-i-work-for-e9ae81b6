CREATE TABLE public.consumer_protection_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'consumer_protection',
  signal_type text NOT NULL,
  violation_type text,
  case_number text,
  filing_date date,
  settlement_amount numeric,
  complaint_count integer,
  product_name text,
  hazard_type text,
  units_affected integer,
  records_exposed integer,
  location_state text,
  description text,
  source_name text NOT NULL DEFAULT 'CFPB',
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.consumer_protection_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read consumer_protection_signals" ON public.consumer_protection_signals FOR SELECT USING (true);
CREATE INDEX idx_consumer_protection_company ON public.consumer_protection_signals(company_id);
CREATE INDEX idx_consumer_protection_type ON public.consumer_protection_signals(signal_type);