ALTER TABLE public.career_paths
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS source_role_title TEXT,
  ADD COLUMN IF NOT EXISTS target_role_title TEXT,
  ADD COLUMN IF NOT EXISTS path_type TEXT,
  ADD COLUMN IF NOT EXISTS median_years_to_pivot FLOAT,
  ADD COLUMN IF NOT EXISTS success_rate_pct INT,
  ADD COLUMN IF NOT EXISTS required_skills_delta TEXT[],
  ADD COLUMN IF NOT EXISTS data_source TEXT,
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();
