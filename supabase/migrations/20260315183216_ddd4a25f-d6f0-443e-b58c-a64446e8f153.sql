
-- EEO-1 Workforce Demographics Data
CREATE TABLE public.company_eeo1_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  report_year INT NOT NULL,
  job_category TEXT NOT NULL,
  total_employees INT DEFAULT 0,
  male_count INT DEFAULT 0,
  female_count INT DEFAULT 0,
  white_count INT DEFAULT 0,
  black_count INT DEFAULT 0,
  hispanic_count INT DEFAULT 0,
  asian_count INT DEFAULT 0,
  native_american_count INT DEFAULT 0,
  pacific_islander_count INT DEFAULT 0,
  two_or_more_races_count INT DEFAULT 0,
  source TEXT DEFAULT 'eeoc_public',
  source_url TEXT,
  confidence TEXT DEFAULT 'direct',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, report_year, job_category)
);

-- Diversity Disclosure Tracking
CREATE TABLE public.company_diversity_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  disclosure_type TEXT NOT NULL,
  year INT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  report_url TEXT,
  notes TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'scan',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, disclosure_type, year)
);

-- Executive demographics for inclusion snapshot
CREATE TABLE public.company_leadership_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  leadership_level TEXT NOT NULL,
  total_count INT DEFAULT 0,
  female_count INT DEFAULT 0,
  male_count INT DEFAULT 0,
  nonbinary_count INT DEFAULT 0,
  white_count INT DEFAULT 0,
  black_count INT DEFAULT 0,
  hispanic_count INT DEFAULT 0,
  asian_count INT DEFAULT 0,
  other_race_count INT DEFAULT 0,
  report_year INT,
  source TEXT DEFAULT 'sec_proxy',
  source_url TEXT,
  confidence TEXT DEFAULT 'inferred',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, leadership_level, report_year)
);

-- Enable RLS
ALTER TABLE public.company_eeo1_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_diversity_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_leadership_demographics ENABLE ROW LEVEL SECURITY;

-- Public read policies (public company data)
CREATE POLICY "Anyone can read eeo1 data" ON public.company_eeo1_data FOR SELECT USING (true);
CREATE POLICY "Anyone can read diversity disclosures" ON public.company_diversity_disclosures FOR SELECT USING (true);
CREATE POLICY "Anyone can read leadership demographics" ON public.company_leadership_demographics FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "Admins can manage eeo1 data" ON public.company_eeo1_data FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage diversity disclosures" ON public.company_diversity_disclosures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage leadership demographics" ON public.company_leadership_demographics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
