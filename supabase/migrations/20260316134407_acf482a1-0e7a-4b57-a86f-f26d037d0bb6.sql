
-- Contradiction signals table for surfacing mismatch between public stances and spending
CREATE TABLE public.contradiction_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  public_statement TEXT,
  spending_reality TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('high', 'medium', 'low')),
  evidence_sources JSONB DEFAULT '[]'::jsonb,
  statement_source_url TEXT,
  spending_source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.contradiction_signals ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public transparency data)
CREATE POLICY "Anyone can read contradiction signals"
  ON public.contradiction_signals
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service role can write (via edge functions)
CREATE POLICY "Service role can manage contradiction signals"
  ON public.contradiction_signals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_contradiction_signals_company ON public.contradiction_signals(company_id);
CREATE INDEX idx_contradiction_signals_severity ON public.contradiction_signals(severity);
