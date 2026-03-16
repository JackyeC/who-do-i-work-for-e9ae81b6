CREATE TABLE public.gun_policy_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'gun_policy',
  signal_type text NOT NULL,
  license_type text,
  case_number text,
  filing_date date,
  amount numeric,
  organization_name text,
  location_state text,
  description text,
  source_name text NOT NULL DEFAULT 'ATF',
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.gun_policy_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gun_policy_signals" ON public.gun_policy_signals FOR SELECT USING (true);
CREATE INDEX idx_gun_policy_company ON public.gun_policy_signals(company_id);
CREATE INDEX idx_gun_policy_type ON public.gun_policy_signals(signal_type);