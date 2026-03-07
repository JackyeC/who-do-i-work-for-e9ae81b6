
CREATE TABLE public.ai_hiring_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category text NOT NULL,
  vendor_name text,
  signal_type text NOT NULL DEFAULT 'Technical Signature',
  evidence_url text,
  evidence_text text,
  confidence_score numeric NOT NULL DEFAULT 0.5,
  status text NOT NULL DEFAULT 'Detected',
  bias_audit_link text,
  bias_audit_status text DEFAULT 'unknown',
  safepath_flags jsonb DEFAULT '[]'::jsonb,
  transparency_score integer,
  last_scanned timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_hiring_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI hiring signals are publicly readable"
  ON public.ai_hiring_signals
  FOR SELECT
  USING (true);
