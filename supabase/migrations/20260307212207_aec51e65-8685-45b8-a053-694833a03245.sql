
CREATE TABLE public.worker_benefit_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  benefit_category text NOT NULL,
  benefit_type text NOT NULL,
  evidence_text text,
  source_url text,
  source_type text,
  detection_method text NOT NULL DEFAULT 'keyword_detection',
  confidence text NOT NULL DEFAULT 'moderate_inference',
  date_detected timestamptz NOT NULL DEFAULT now(),
  last_verified timestamptz,
  status text NOT NULL DEFAULT 'auto_detected',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_benefit_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker benefit signals are publicly readable"
  ON public.worker_benefit_signals
  FOR SELECT
  USING (true);
