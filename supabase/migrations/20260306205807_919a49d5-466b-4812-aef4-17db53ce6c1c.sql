-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_company TEXT,
  industry TEXT NOT NULL,
  revenue TEXT,
  employee_count TEXT,
  description TEXT,
  state TEXT NOT NULL,
  careers_url TEXT,
  confidence_rating TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_rating IN ('high', 'medium', 'low')),
  civic_footprint_score INTEGER NOT NULL DEFAULT 0 CHECK (civic_footprint_score >= 0 AND civic_footprint_score <= 100),
  corporate_pac_exists BOOLEAN NOT NULL DEFAULT false,
  total_pac_spending BIGINT NOT NULL DEFAULT 0,
  lobbying_spend BIGINT,
  government_contracts BIGINT,
  subsidies_received BIGINT,
  effective_tax_rate TEXT,
  worker_relevance TEXT,
  consumer_relevance TEXT,
  last_reviewed DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_party_breakdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  party TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT 'hsl(215, 15%, 47%)'
);

CREATE TABLE public.company_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  party TEXT NOT NULL CHECK (party IN ('R', 'D', 'I')),
  state TEXT NOT NULL,
  district TEXT,
  amount BIGINT NOT NULL DEFAULT 0,
  donation_type TEXT NOT NULL DEFAULT 'corporate-pac' CHECK (donation_type IN ('corporate-pac', 'executive-personal', 'super-pac')),
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT
);

CREATE TABLE public.company_executives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  total_donations BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE public.executive_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  executive_id UUID NOT NULL REFERENCES public.company_executives(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount BIGINT NOT NULL DEFAULT 0,
  party TEXT NOT NULL CHECK (party IN ('R', 'D', 'I'))
);

CREATE TABLE public.company_super_pacs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pac_type TEXT NOT NULL CHECK (pac_type IN ('super-pac', '527')),
  amount BIGINT NOT NULL DEFAULT 0,
  relationship TEXT NOT NULL CHECK (relationship IN ('direct', 'leadership-linked', 'corporate-affiliated')),
  description TEXT,
  confidence TEXT NOT NULL DEFAULT 'inferred' CHECK (confidence IN ('direct', 'inferred', 'unverified'))
);

CREATE TABLE public.company_dark_money (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  org_type TEXT NOT NULL CHECK (org_type IN ('501c4', '501c6', 'other')),
  estimated_amount BIGINT,
  relationship TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'inferred' CHECK (confidence IN ('direct', 'inferred', 'unverified')),
  description TEXT,
  source TEXT
);

CREATE TABLE public.company_revolving_door (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  person TEXT NOT NULL,
  prior_role TEXT NOT NULL,
  new_role TEXT NOT NULL,
  relevance TEXT,
  confidence TEXT NOT NULL DEFAULT 'inferred' CHECK (confidence IN ('direct', 'inferred', 'unverified'))
);

CREATE TABLE public.company_spending_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle TEXT NOT NULL,
  pac_spending BIGINT NOT NULL DEFAULT 0,
  lobbying_spend BIGINT NOT NULL DEFAULT 0,
  executive_giving BIGINT NOT NULL DEFAULT 0,
  UNIQUE (company_id, cycle)
);

CREATE TABLE public.company_trade_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE public.company_flagged_orgs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  org_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'inferred' CHECK (confidence IN ('direct', 'inferred', 'unverified')),
  description TEXT,
  source TEXT
);

CREATE TABLE public.company_board_affiliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE public.company_public_stances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  public_position TEXT NOT NULL,
  spending_reality TEXT NOT NULL,
  gap TEXT NOT NULL DEFAULT 'mixed' CHECK (gap IN ('aligned', 'mixed', 'contradictory'))
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_party_breakdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_super_pacs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_dark_money ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_revolving_door ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_spending_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_trade_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_flagged_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_board_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_public_stances ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Companies are publicly readable" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Party breakdown is publicly readable" ON public.company_party_breakdown FOR SELECT USING (true);
CREATE POLICY "Candidates are publicly readable" ON public.company_candidates FOR SELECT USING (true);
CREATE POLICY "Executives are publicly readable" ON public.company_executives FOR SELECT USING (true);
CREATE POLICY "Executive recipients are publicly readable" ON public.executive_recipients FOR SELECT USING (true);
CREATE POLICY "Super PACs are publicly readable" ON public.company_super_pacs FOR SELECT USING (true);
CREATE POLICY "Dark money orgs are publicly readable" ON public.company_dark_money FOR SELECT USING (true);
CREATE POLICY "Revolving door entries are publicly readable" ON public.company_revolving_door FOR SELECT USING (true);
CREATE POLICY "Spending history is publicly readable" ON public.company_spending_history FOR SELECT USING (true);
CREATE POLICY "Trade associations are publicly readable" ON public.company_trade_associations FOR SELECT USING (true);
CREATE POLICY "Flagged orgs are publicly readable" ON public.company_flagged_orgs FOR SELECT USING (true);
CREATE POLICY "Board affiliations are publicly readable" ON public.company_board_affiliations FOR SELECT USING (true);
CREATE POLICY "Public stances are publicly readable" ON public.company_public_stances FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_industry ON public.companies(industry);
CREATE INDEX idx_companies_state ON public.companies(state);
CREATE INDEX idx_companies_score ON public.companies(civic_footprint_score DESC);
CREATE INDEX idx_candidates_company ON public.company_candidates(company_id);
CREATE INDEX idx_executives_company ON public.company_executives(company_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();