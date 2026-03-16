
-- Climate Signals table
CREATE TABLE public.climate_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'climate',
  signal_type text NOT NULL,
  facility_name text,
  emissions_amount numeric,
  emissions_unit text,
  target_year integer,
  target_description text,
  score text,
  location_state text,
  description text,
  source_name text NOT NULL DEFAULT 'EPA',
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_climate_signals_company ON public.climate_signals(company_id);
CREATE INDEX idx_climate_signals_type ON public.climate_signals(signal_type);

-- RLS
ALTER TABLE public.climate_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for climate_signals"
  ON public.climate_signals FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role full access for climate_signals"
  ON public.climate_signals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
