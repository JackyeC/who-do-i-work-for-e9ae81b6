
-- Influence ROI scores
CREATE TABLE public.company_influence_roi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  total_political_spending BIGINT NOT NULL DEFAULT 0,
  total_government_benefits BIGINT NOT NULL DEFAULT 0,
  roi_ratio NUMERIC(10,2) DEFAULT 0,
  policy_win_rate NUMERIC(5,2) DEFAULT NULL,
  roi_grade TEXT NOT NULL DEFAULT 'N/A',
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_influence_roi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Influence ROI is publicly readable" ON public.company_influence_roi FOR SELECT USING (true);

-- Corporate Hypocrisy Index
CREATE TABLE public.company_hypocrisy_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  chi_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  chi_grade TEXT NOT NULL DEFAULT 'N/A',
  direct_conflicts INTEGER NOT NULL DEFAULT 0,
  indirect_conflicts INTEGER NOT NULL DEFAULT 0,
  aligned_stances INTEGER NOT NULL DEFAULT 0,
  total_stances INTEGER NOT NULL DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_hypocrisy_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hypocrisy index is publicly readable" ON public.company_hypocrisy_index FOR SELECT USING (true);

-- Political Risk Score
CREATE TABLE public.company_political_risk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  risk_grade TEXT NOT NULL DEFAULT 'N/A',
  revolving_door_count INTEGER NOT NULL DEFAULT 0,
  dark_money_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  stakeholder_disconnect_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  flagged_org_count INTEGER NOT NULL DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_political_risk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Political risk is publicly readable" ON public.company_political_risk FOR SELECT USING (true);

-- Industry Benchmarking
CREATE TABLE public.company_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  transparency_grade TEXT NOT NULL DEFAULT 'N/A',
  cpa_zicklin_score NUMERIC(5,2) DEFAULT NULL,
  industry_rank INTEGER DEFAULT NULL,
  industry_total INTEGER DEFAULT NULL,
  peer_avg_civic_footprint NUMERIC(5,2) DEFAULT NULL,
  peer_avg_lobbying BIGINT DEFAULT NULL,
  peer_avg_pac_spending BIGINT DEFAULT NULL,
  is_industry_leader BOOLEAN NOT NULL DEFAULT false,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Benchmarks are publicly readable" ON public.company_benchmarks FOR SELECT USING (true);
