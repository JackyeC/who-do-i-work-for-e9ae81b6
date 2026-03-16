
-- Signal verification tracking table
CREATE TABLE public.signal_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_table TEXT NOT NULL,
  signal_id UUID NOT NULL,
  
  -- Layer 1: Identity
  identity_verified BOOLEAN DEFAULT false,
  identity_sources JSONB DEFAULT '[]'::jsonb,
  identity_verified_at TIMESTAMPTZ,
  
  -- Layer 2: Claim  
  claim_verified BOOLEAN DEFAULT false,
  claim_sources JSONB DEFAULT '[]'::jsonb,
  claim_evidence_urls TEXT[] DEFAULT '{}',
  claim_verified_at TIMESTAMPTZ,
  
  -- Layer 3: Freshness
  data_last_updated TIMESTAMPTZ,
  freshness_status TEXT DEFAULT 'unknown' CHECK (freshness_status IN ('fresh', 'aging', 'stale', 'unknown')),
  
  -- Overall
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'partially_verified', 'unverified', 'disputed', 'suppressed')),
  confidence_level TEXT DEFAULT 'low' CHECK (confidence_level IN ('high', 'medium', 'low')),
  verified_by TEXT DEFAULT 'system',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(signal_table, signal_id)
);

-- Index for lookups
CREATE INDEX idx_signal_verifications_company ON public.signal_verifications(company_id);
CREATE INDEX idx_signal_verifications_status ON public.signal_verifications(verification_status);
CREATE INDEX idx_signal_verifications_lookup ON public.signal_verifications(signal_table, signal_id);

-- RLS: public read, system write
ALTER TABLE public.signal_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verifications"
  ON public.signal_verifications FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_signal_verifications_updated_at
  BEFORE UPDATE ON public.signal_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
