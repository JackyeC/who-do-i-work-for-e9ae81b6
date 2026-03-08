
-- Corporate structure data from OpenCorporates and entity resolution
CREATE TABLE public.company_corporate_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'subsidiary',
  jurisdiction TEXT,
  registration_number TEXT,
  registration_date DATE,
  status TEXT DEFAULT 'active',
  parent_entity_name TEXT,
  officer_name TEXT,
  officer_role TEXT,
  source_name TEXT NOT NULL DEFAULT 'opencorporates',
  source_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'direct',
  evidence_text TEXT,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_corporate_structure ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Corporate structure is publicly readable"
  ON public.company_corporate_structure FOR SELECT
  USING (true);

-- Workplace enforcement signals (EEOC, DOL, wage/hour)
CREATE TABLE public.workplace_enforcement_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  signal_category TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  agency_name TEXT NOT NULL,
  case_number TEXT,
  enforcement_date DATE,
  resolution_type TEXT,
  penalty_amount BIGINT,
  employees_affected INTEGER,
  description TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'direct',
  evidence_text TEXT,
  detection_method TEXT NOT NULL DEFAULT 'government_filing',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workplace_enforcement_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workplace enforcement signals are publicly readable"
  ON public.workplace_enforcement_signals FOR SELECT
  USING (true);

-- State-level political contributions (FollowTheMoney / future)
CREATE TABLE public.company_state_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_type TEXT DEFAULT 'candidate',
  party TEXT,
  amount BIGINT NOT NULL DEFAULT 0,
  election_year INTEGER,
  source_name TEXT NOT NULL DEFAULT 'followthemoney',
  source_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'direct',
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_state_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "State contributions are publicly readable"
  ON public.company_state_contributions FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX idx_corporate_structure_company ON public.company_corporate_structure(company_id);
CREATE INDEX idx_workplace_enforcement_company ON public.workplace_enforcement_signals(company_id);
CREATE INDEX idx_state_contributions_company ON public.company_state_contributions(company_id);
