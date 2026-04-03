
CREATE TABLE public.company_community_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT,
  numeric_value NUMERIC,
  detail TEXT,
  source_url TEXT,
  badge_label TEXT NOT NULL DEFAULT 'Public Signal',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_signals_company ON public.company_community_signals(company_id);
CREATE INDEX idx_community_signals_source ON public.company_community_signals(source);

ALTER TABLE public.company_community_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community signals"
  ON public.company_community_signals
  FOR SELECT
  TO anon, authenticated
  USING (true);
