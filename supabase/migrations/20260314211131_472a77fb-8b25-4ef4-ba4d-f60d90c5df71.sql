
-- Court records from PACER/RECAP (CourtListener)
CREATE TABLE public.company_court_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  case_name text NOT NULL,
  case_number text,
  court_name text,
  date_filed date,
  date_terminated date,
  case_type text DEFAULT 'civil',
  nature_of_suit text,
  cause text,
  status text DEFAULT 'open',
  plaintiff_or_defendant text DEFAULT 'defendant',
  damages_amount bigint,
  summary text,
  courtlistener_id text,
  courtlistener_url text,
  pacer_case_id text,
  source text DEFAULT 'courtlistener',
  confidence text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.company_court_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read court cases" ON public.company_court_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert court cases" ON public.company_court_cases FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update court cases" ON public.company_court_cases FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_court_cases_company ON public.company_court_cases(company_id);
CREATE INDEX idx_court_cases_type ON public.company_court_cases(case_type);
