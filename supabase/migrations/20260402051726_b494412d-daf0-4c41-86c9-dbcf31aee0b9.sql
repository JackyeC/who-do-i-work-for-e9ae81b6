
-- Accountability signals: power, conduct, governance, and narrative gap patterns
CREATE TABLE public.accountability_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_category TEXT NOT NULL CHECK (signal_category IN ('power_influence', 'conduct_culture', 'nepotism_governance', 'narrative_gap')),
  signal_type TEXT NOT NULL,
  status_label TEXT NOT NULL DEFAULT 'reported' CHECK (status_label IN ('reported', 'alleged', 'settled', 'confirmed', 'convicted', 'under_investigation', 'dismissed')),
  headline TEXT NOT NULL,
  description TEXT,
  why_it_matters TEXT,
  subject_name TEXT,
  subject_role TEXT,
  source_type TEXT NOT NULL DEFAULT 'news_report',
  source_url TEXT,
  source_name TEXT,
  event_date DATE,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  related_signal_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_accountability_signals_company ON public.accountability_signals(company_id);
CREATE INDEX idx_accountability_signals_category ON public.accountability_signals(signal_category);
CREATE INDEX idx_accountability_signals_severity ON public.accountability_signals(severity);

-- RLS
ALTER TABLE public.accountability_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accountability signals"
  ON public.accountability_signals FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can submit signals"
  ON public.accountability_signals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Timestamp trigger
CREATE TRIGGER update_accountability_signals_updated_at
  BEFORE UPDATE ON public.accountability_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
