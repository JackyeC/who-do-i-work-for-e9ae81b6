
-- Company aliases for entity resolution
CREATE TABLE public.company_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL,
  alias_type TEXT NOT NULL DEFAULT 'canonical', -- canonical, legal, fuzzy, subsidiary, parent
  confidence NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, alias_name)
);

-- IP scan jobs for async tracking
CREATE TABLE public.ip_scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'on_demand', -- on_demand, nightly, weekly
  status TEXT NOT NULL DEFAULT 'queued', -- queued, running, complete, failed
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patent records from USPTO/PatentsView
CREATE TABLE public.patent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_record_id TEXT,
  patent_number TEXT,
  application_number TEXT,
  title TEXT,
  filing_date DATE,
  grant_date DATE,
  assignee_name TEXT,
  assignee_normalized TEXT,
  inventor_count INT,
  cpc_codes JSONB DEFAULT '[]'::jsonb,
  tech_keywords JSONB DEFAULT '[]'::jsonb,
  government_interest BOOLEAN DEFAULT false,
  source_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, patent_number)
);

-- Patent assignments (ownership changes)
CREATE TABLE public.patent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_record_id TEXT,
  patent_number TEXT,
  assignor TEXT,
  assignee TEXT,
  execution_date DATE,
  recorded_date DATE,
  source_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trademark records from USPTO TSDR
CREATE TABLE public.trademark_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_record_id TEXT,
  serial_number TEXT,
  registration_number TEXT,
  mark_text TEXT,
  status TEXT,
  filing_date DATE,
  registration_date DATE,
  owner_name TEXT,
  goods_services TEXT,
  classes JSONB DEFAULT '[]'::jsonb,
  source_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, serial_number)
);

-- Trademark assignments
CREATE TABLE public.trademark_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_record_id TEXT,
  mark_text TEXT,
  assignor TEXT,
  assignee TEXT,
  execution_date DATE,
  recorded_date DATE,
  source_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Computed IP signals per company
CREATE TABLE public.company_ip_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  patent_count_12m INT DEFAULT 0,
  patent_count_36m INT DEFAULT 0,
  patent_trend TEXT DEFAULT 'unknown', -- rising, flat, declining, unknown
  trademark_count_12m INT DEFAULT 0,
  trademark_trend TEXT DEFAULT 'unknown',
  ownership_change_flag BOOLEAN DEFAULT false,
  innovation_signal_score NUMERIC DEFAULT 0,
  expansion_signal_score NUMERIC DEFAULT 0,
  ip_complexity_score NUMERIC DEFAULT 0,
  top_cpc_categories JSONB DEFAULT '[]'::jsonb,
  last_scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies - public read, admin write
ALTER TABLE public.company_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_scan_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trademark_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trademark_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ip_signals ENABLE ROW LEVEL SECURITY;

-- Public read for all IP tables
CREATE POLICY "Public read company_aliases" ON public.company_aliases FOR SELECT USING (true);
CREATE POLICY "Public read ip_scan_jobs" ON public.ip_scan_jobs FOR SELECT USING (true);
CREATE POLICY "Public read patent_records" ON public.patent_records FOR SELECT USING (true);
CREATE POLICY "Public read patent_assignments" ON public.patent_assignments FOR SELECT USING (true);
CREATE POLICY "Public read trademark_records" ON public.trademark_records FOR SELECT USING (true);
CREATE POLICY "Public read trademark_assignments" ON public.trademark_assignments FOR SELECT USING (true);
CREATE POLICY "Public read company_ip_signals" ON public.company_ip_signals FOR SELECT USING (true);

-- Admin write for all IP tables
CREATE POLICY "Admin write company_aliases" ON public.company_aliases FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write ip_scan_jobs" ON public.ip_scan_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write patent_records" ON public.patent_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write patent_assignments" ON public.patent_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write trademark_records" ON public.trademark_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write trademark_assignments" ON public.trademark_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin write company_ip_signals" ON public.company_ip_signals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role insert for edge functions
CREATE POLICY "Service insert company_aliases" ON public.company_aliases FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert ip_scan_jobs" ON public.ip_scan_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert patent_records" ON public.patent_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert patent_assignments" ON public.patent_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert trademark_records" ON public.trademark_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert trademark_assignments" ON public.trademark_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert company_ip_signals" ON public.company_ip_signals FOR INSERT WITH CHECK (true);

-- Service role update for edge functions
CREATE POLICY "Service update ip_scan_jobs" ON public.ip_scan_jobs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service update patent_records" ON public.patent_records FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service update trademark_records" ON public.trademark_records FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Service update company_ip_signals" ON public.company_ip_signals FOR UPDATE USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_patent_records_company ON public.patent_records(company_id);
CREATE INDEX idx_patent_records_grant_date ON public.patent_records(grant_date);
CREATE INDEX idx_trademark_records_company ON public.trademark_records(company_id);
CREATE INDEX idx_company_aliases_company ON public.company_aliases(company_id);
CREATE INDEX idx_ip_scan_jobs_company ON public.ip_scan_jobs(company_id);
CREATE INDEX idx_patent_assignments_company ON public.patent_assignments(company_id);
CREATE INDEX idx_trademark_assignments_company ON public.trademark_assignments(company_id);
