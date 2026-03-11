
-- BLS Wage Benchmarks cache table
CREATE TABLE public.bls_wage_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occupation_code TEXT NOT NULL,
  occupation_title TEXT NOT NULL,
  area_code TEXT NOT NULL DEFAULT '0000000',
  area_title TEXT NOT NULL DEFAULT 'National',
  industry_code TEXT NOT NULL DEFAULT '000000',
  hourly_mean NUMERIC,
  hourly_median NUMERIC,
  annual_mean NUMERIC,
  annual_median NUMERIC,
  hourly_10th NUMERIC,
  hourly_25th NUMERIC,
  hourly_75th NUMERIC,
  hourly_90th NUMERIC,
  annual_10th NUMERIC,
  annual_25th NUMERIC,
  annual_75th NUMERIC,
  annual_90th NUMERIC,
  total_employment INTEGER,
  data_year INTEGER NOT NULL,
  source_program TEXT NOT NULL DEFAULT 'OES',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(occupation_code, area_code, industry_code, data_year)
);

-- BLS Benefits benchmarks
CREATE TABLE public.bls_benefits_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  benefit_type TEXT NOT NULL,
  benefit_category TEXT NOT NULL,
  participation_rate NUMERIC,
  employer_cost_per_hour NUMERIC,
  worker_type TEXT NOT NULL DEFAULT 'all',
  industry_group TEXT,
  data_year INTEGER NOT NULL,
  data_quarter INTEGER,
  source_program TEXT NOT NULL DEFAULT 'NCS',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- BLS Employment Cost Index trends
CREATE TABLE public.bls_eci_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id TEXT NOT NULL,
  series_title TEXT NOT NULL,
  period TEXT NOT NULL,
  year INTEGER NOT NULL,
  value NUMERIC NOT NULL,
  percent_change_12mo NUMERIC,
  industry_group TEXT,
  occupation_group TEXT,
  compensation_type TEXT NOT NULL DEFAULT 'total',
  source_program TEXT NOT NULL DEFAULT 'ECI',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(series_id, year, period)
);

-- BLS Earnings by demographics
CREATE TABLE public.bls_demographic_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demographic_group TEXT NOT NULL,
  demographic_value TEXT NOT NULL,
  median_weekly_earnings NUMERIC,
  median_annual_earnings NUMERIC,
  earnings_ratio NUMERIC,
  comparison_group TEXT DEFAULT 'all_workers',
  data_year INTEGER NOT NULL,
  data_quarter INTEGER,
  source_program TEXT NOT NULL DEFAULT 'CPS',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_bls_wages_occupation ON public.bls_wage_benchmarks(occupation_code, area_code);
CREATE INDEX idx_bls_wages_title ON public.bls_wage_benchmarks USING gin(to_tsvector('english', occupation_title));
CREATE INDEX idx_bls_eci_series ON public.bls_eci_trends(series_id, year);
CREATE INDEX idx_bls_demographics ON public.bls_demographic_earnings(demographic_group, data_year);

-- RLS: Public read access (this is public government data)
ALTER TABLE public.bls_wage_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bls_benefits_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bls_eci_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bls_demographic_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "BLS wage data is publicly readable" ON public.bls_wage_benchmarks FOR SELECT USING (true);
CREATE POLICY "BLS benefits data is publicly readable" ON public.bls_benefits_benchmarks FOR SELECT USING (true);
CREATE POLICY "BLS ECI data is publicly readable" ON public.bls_eci_trends FOR SELECT USING (true);
CREATE POLICY "BLS demographic data is publicly readable" ON public.bls_demographic_earnings FOR SELECT USING (true);
