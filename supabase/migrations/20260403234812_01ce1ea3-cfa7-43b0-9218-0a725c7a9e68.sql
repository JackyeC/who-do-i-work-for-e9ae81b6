
-- Create claim types enum
CREATE TYPE public.evidence_type AS ENUM ('direct_source', 'multi_source', 'inferred');

-- Create company_claims table
CREATE TABLE public.company_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  claim_text text NOT NULL,
  claim_type text NOT NULL,
  source_label text NOT NULL,
  source_url text,
  evidence_type public.evidence_type NOT NULL DEFAULT 'direct_source',
  confidence_score numeric(3,2) NOT NULL DEFAULT 0.50,
  signal_id uuid,
  signal_table text,
  event_date date,
  is_active boolean NOT NULL DEFAULT true,
  generated_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_company_claims_company ON public.company_claims (company_id);
CREATE INDEX idx_company_claims_type ON public.company_claims (claim_type);
CREATE INDEX idx_company_claims_active ON public.company_claims (company_id) WHERE is_active = true;
CREATE INDEX idx_company_claims_signal ON public.company_claims (signal_id, signal_table);

-- Prevent duplicate claims for the same signal
CREATE UNIQUE INDEX idx_company_claims_unique_signal 
  ON public.company_claims (company_id, signal_id, signal_table) 
  WHERE signal_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.company_claims ENABLE ROW LEVEL SECURITY;

-- Public read for active claims
CREATE POLICY "Anyone can view active claims"
  ON public.company_claims FOR SELECT
  USING (is_active = true);

-- Service role full access for edge functions
CREATE POLICY "Service role can manage claims"
  ON public.company_claims FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can manage claims
CREATE POLICY "Admins can manage claims"
  ON public.company_claims FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_company_claims_updated_at
  BEFORE UPDATE ON public.company_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
