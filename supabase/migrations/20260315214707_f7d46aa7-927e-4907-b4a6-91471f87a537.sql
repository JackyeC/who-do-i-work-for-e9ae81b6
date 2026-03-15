
-- Compensation intelligence data
CREATE TABLE public.compensation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  median_total_compensation_usd INTEGER,
  salary_by_grade JSONB DEFAULT '[]'::jsonb,
  top_roles JSONB DEFAULT '[]'::jsonb,
  source_summary JSONB DEFAULT '[]'::jsonb,
  last_updated DATE,
  freshness_status TEXT DEFAULT 'stale' CHECK (freshness_status IN ('fresh', 'stale', 'failed', 'partial')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Case-insensitive unique index on company name
CREATE UNIQUE INDEX idx_compensation_data_company ON public.compensation_data (lower(company));

-- Indexes for queries
CREATE INDEX idx_compensation_data_freshness ON public.compensation_data (freshness_status);
CREATE INDEX idx_compensation_data_last_updated ON public.compensation_data (last_updated);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_compensation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_compensation_updated_at
  BEFORE UPDATE ON public.compensation_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_compensation_updated_at();

-- RLS: public read, service-role write
ALTER TABLE public.compensation_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read compensation_data"
  ON public.compensation_data FOR SELECT
  TO anon, authenticated
  USING (true);
