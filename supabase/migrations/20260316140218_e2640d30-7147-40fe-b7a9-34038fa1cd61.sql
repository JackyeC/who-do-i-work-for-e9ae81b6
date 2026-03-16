CREATE TABLE public.signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_table text NOT NULL,
  signal_id uuid,
  source_name text NOT NULL,
  source_type text NOT NULL DEFAULT 'unverified',
  source_url text,
  date_retrieved timestamptz DEFAULT now(),
  date_published timestamptz,
  entity_matched text,
  match_confidence numeric,
  verification_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_signal_sources_company ON public.signal_sources(company_id);
CREATE INDEX idx_signal_sources_signal ON public.signal_sources(signal_table, signal_id);

ALTER TABLE public.signal_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read signal sources"
  ON public.signal_sources FOR SELECT USING (true);

CREATE POLICY "Service role can manage signal sources"
  ON public.signal_sources FOR ALL USING (true);