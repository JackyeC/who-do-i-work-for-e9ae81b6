
CREATE TABLE public.integrity_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('red_flag', 'amber_flag', 'green_badge')),
  indicator_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  legislation_ref TEXT,
  section_ref TEXT,
  evidence_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_integrity_indicators_company ON public.integrity_indicators(company_id);
CREATE INDEX idx_integrity_indicators_type ON public.integrity_indicators(indicator_type);

ALTER TABLE public.integrity_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view integrity indicators"
  ON public.integrity_indicators
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
