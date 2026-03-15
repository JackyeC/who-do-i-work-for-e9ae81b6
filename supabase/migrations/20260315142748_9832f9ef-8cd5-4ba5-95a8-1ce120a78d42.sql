
-- Section-level intelligence cache
CREATE TABLE public.company_report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- leadership, careers, news, reputation, recruiter_intelligence
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary TEXT,
  source_urls TEXT[] DEFAULT '{}',
  provider_used TEXT, -- firecrawl, scrapingbee, apify, ats_api, government_api, manual
  confidence_score NUMERIC(3,2) DEFAULT 0.5,
  last_successful_update TIMESTAMPTZ,
  last_attempted_update TIMESTAMPTZ,
  last_error TEXT,
  freshness_ttl_hours INTEGER NOT NULL DEFAULT 168, -- 7 days default
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, section_type)
);

-- Scan job tracking
CREATE TABLE public.scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  section_type TEXT, -- null = full scan, or specific section
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, skipped
  provider_used TEXT,
  provider_fallback_chain TEXT[] DEFAULT '{}',
  error_type TEXT, -- credits_exhausted, invalid_api_key, timeout, provider_outage, unknown
  error_message TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'system', -- system, user_refresh, admin_rescan, schedule
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_report_sections_company ON public.company_report_sections(company_id);
CREATE INDEX idx_report_sections_freshness ON public.company_report_sections(company_id, section_type, last_successful_update);
CREATE INDEX idx_scan_jobs_company ON public.scan_jobs(company_id, created_at DESC);
CREATE INDEX idx_scan_jobs_status ON public.scan_jobs(status, created_at DESC);

-- RLS
ALTER TABLE public.company_report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_jobs ENABLE ROW LEVEL SECURITY;

-- Public read for report sections (company data is public)
CREATE POLICY "Anyone can read report sections"
  ON public.company_report_sections FOR SELECT
  USING (true);

-- Only service role / edge functions write report sections
CREATE POLICY "Service role inserts report sections"
  ON public.company_report_sections FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates report sections"
  ON public.company_report_sections FOR UPDATE
  USING (true);

-- Scan jobs: public read, service write
CREATE POLICY "Anyone can read scan jobs"
  ON public.scan_jobs FOR SELECT
  USING (true);

CREATE POLICY "Service role inserts scan jobs"
  ON public.scan_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates scan jobs"
  ON public.scan_jobs FOR UPDATE
  USING (true);
