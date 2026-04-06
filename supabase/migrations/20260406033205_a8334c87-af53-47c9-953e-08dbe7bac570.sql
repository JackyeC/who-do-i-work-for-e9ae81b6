CREATE TABLE public.proxy_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  filing_date DATE,
  filing_url TEXT,
  
  -- Leadership Pay
  ceo_name TEXT,
  ceo_total_comp BIGINT,
  ceo_salary BIGINT,
  ceo_bonus BIGINT,
  ceo_stock BIGINT,
  ceo_other BIGINT,
  ceo_median_pay_ratio TEXT,
  comp_interpretation TEXT,
  
  -- Board / Power
  board_members JSONB DEFAULT '[]'::jsonb,
  ceo_is_chair BOOLEAN DEFAULT false,
  power_concentration TEXT DEFAULT 'unknown',
  
  -- Shareholder Votes
  shareholder_proposals JSONB DEFAULT '[]'::jsonb,
  
  -- Governance
  governance_rating TEXT DEFAULT 'unknown',
  governance_notes TEXT,
  
  -- Source
  raw_filing_text TEXT,
  provider_used TEXT DEFAULT 'gemini',
  confidence_score NUMERIC DEFAULT 0.0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.proxy_intelligence ENABLE ROW LEVEL SECURITY;

-- Public read (SEC filings are public record)
CREATE POLICY "Anyone can read proxy intelligence"
  ON public.proxy_intelligence FOR SELECT
  USING (true);

-- Index for company lookup
CREATE INDEX idx_proxy_intelligence_company ON public.proxy_intelligence(company_id);

-- Updated-at trigger
CREATE TRIGGER update_proxy_intelligence_updated_at
  BEFORE UPDATE ON public.proxy_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();