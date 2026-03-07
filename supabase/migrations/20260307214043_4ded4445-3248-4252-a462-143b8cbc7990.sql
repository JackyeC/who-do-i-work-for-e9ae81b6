
CREATE TABLE public.pay_equity_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_category TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT,
  source_title TEXT,
  evidence_text TEXT,
  detection_method TEXT NOT NULL DEFAULT 'keyword_detection',
  confidence TEXT NOT NULL DEFAULT 'moderate_inference',
  date_detected TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_verified TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'auto_detected',
  jurisdiction TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pay_equity_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pay equity signals are publicly readable"
  ON public.pay_equity_signals
  FOR SELECT
  USING (true);
