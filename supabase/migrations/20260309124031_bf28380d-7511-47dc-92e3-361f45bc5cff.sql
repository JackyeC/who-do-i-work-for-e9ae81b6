
CREATE TABLE public.values_check_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  issue_area text NOT NULL,
  signal_category text NOT NULL,
  signal_title text NOT NULL,
  signal_description text,
  source_name text NOT NULL DEFAULT 'unknown',
  source_type text,
  source_url text,
  related_person_name text,
  related_entity_name text,
  matched_entity_type text,
  amount bigint,
  year integer,
  confidence_score numeric NOT NULL DEFAULT 0.5,
  confidence_label text NOT NULL DEFAULT 'medium',
  verification_status text NOT NULL DEFAULT 'unverified',
  evidence_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_values_check_signals_company ON public.values_check_signals(company_id);
CREATE INDEX idx_values_check_signals_issue ON public.values_check_signals(issue_area);
CREATE INDEX idx_values_check_signals_category ON public.values_check_signals(signal_category);

ALTER TABLE public.values_check_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Values check signals are publicly readable"
  ON public.values_check_signals
  FOR SELECT
  TO public
  USING (true);
