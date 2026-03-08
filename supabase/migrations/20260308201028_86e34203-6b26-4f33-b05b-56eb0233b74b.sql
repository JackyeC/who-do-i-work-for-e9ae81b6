
-- Extend company_jobs with ingestion metadata
ALTER TABLE public.company_jobs
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'careers_page',
  ADD COLUMN IF NOT EXISTS source_platform text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS work_mode text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS extracted_skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seniority_level text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS source_url text DEFAULT NULL;

-- Index for smart refresh queries
CREATE INDEX IF NOT EXISTS idx_company_jobs_source ON public.company_jobs(source_type, source_platform);
CREATE INDEX IF NOT EXISTS idx_company_jobs_verified ON public.company_jobs(last_verified_at);
