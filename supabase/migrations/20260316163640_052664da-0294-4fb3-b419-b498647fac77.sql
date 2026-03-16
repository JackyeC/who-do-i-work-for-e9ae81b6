
CREATE TABLE public.institutional_alignment_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  person_title TEXT,
  institution_name TEXT NOT NULL,
  institution_category TEXT NOT NULL CHECK (institution_category IN ('traditional_policy', 'progress_policy', 'bipartisan')),
  link_type TEXT NOT NULL DEFAULT 'documented_link',
  link_description TEXT,
  evidence_url TEXT,
  evidence_source TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_institutional_alignment_company ON public.institutional_alignment_signals(company_id);
CREATE INDEX idx_institutional_alignment_category ON public.institutional_alignment_signals(institution_category);

ALTER TABLE public.institutional_alignment_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read institutional alignment signals"
  ON public.institutional_alignment_signals
  FOR SELECT
  TO authenticated, anon
  USING (true);
