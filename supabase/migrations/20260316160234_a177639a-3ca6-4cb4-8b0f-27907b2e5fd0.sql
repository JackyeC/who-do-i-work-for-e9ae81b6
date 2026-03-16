
-- Phase 1: Add intelligence columns to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sub_industry text,
  ADD COLUMN IF NOT EXISTS founded_year integer,
  ADD COLUMN IF NOT EXISTS funding_stage text,
  ADD COLUMN IF NOT EXISTS is_startup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS market_cap bigint,
  ADD COLUMN IF NOT EXISTS founder_names text[],
  ADD COLUMN IF NOT EXISTS founder_previous_companies text[],
  ADD COLUMN IF NOT EXISTS category_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS career_intelligence_score numeric(3,1) DEFAULT 0;

-- GIN index for fast category_tags filtering
CREATE INDEX IF NOT EXISTS idx_companies_category_tags ON public.companies USING GIN (category_tags);

-- Index for startup filtering
CREATE INDEX IF NOT EXISTS idx_companies_is_startup ON public.companies (is_startup) WHERE is_startup = true;

-- Index for career intelligence score sorting
CREATE INDEX IF NOT EXISTS idx_companies_career_intel_score ON public.companies (career_intelligence_score DESC);

-- Career Intelligence Score computation function
CREATE OR REPLACE FUNCTION public.compute_career_intelligence_score(_company_id uuid)
RETURNS numeric(3,1)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  salary_transparency numeric := 0;
  layoff_risk numeric := 0;
  lobbying_activity numeric := 0;
  employee_sentiment numeric := 0;
  hiring_stability numeric := 0;
  executive_turnover numeric := 0;
  final_score numeric;
  comp_count integer;
  warn_count integer;
  lobby_spend numeric;
  sentiment_count integer;
  job_count integer;
  exec_changes integer;
BEGIN
  -- Salary Transparency (0-10): based on compensation data availability
  SELECT COUNT(*) INTO comp_count FROM company_compensation WHERE company_id = _company_id;
  salary_transparency := LEAST(comp_count * 2.0, 10);

  -- Layoff Risk (0-10, inverted): fewer WARN notices = higher score
  SELECT COUNT(*) INTO warn_count FROM warn_notices WHERE company_id = _company_id;
  layoff_risk := GREATEST(10 - (warn_count * 2.0), 0);

  -- Lobbying Activity (0-10, inverted): less lobbying = higher score
  SELECT COALESCE(lobbying_spend, 0) INTO lobby_spend FROM companies WHERE id = _company_id;
  lobbying_activity := CASE
    WHEN lobby_spend <= 0 THEN 8
    WHEN lobby_spend < 100000 THEN 7
    WHEN lobby_spend < 1000000 THEN 5
    WHEN lobby_spend < 10000000 THEN 3
    ELSE 1
  END;

  -- Employee Sentiment (0-10): from worker_sentiment data
  SELECT COUNT(*) INTO sentiment_count FROM worker_sentiment WHERE company_id = _company_id AND sentiment = 'positive';
  employee_sentiment := LEAST(sentiment_count * 1.5, 10);

  -- Hiring Stability (0-10): active job postings signal stability
  SELECT COUNT(*) INTO job_count FROM company_jobs WHERE company_id = _company_id AND is_active = true;
  hiring_stability := LEAST(job_count * 0.5, 10);

  -- Executive Turnover (0-10, inverted): fewer departures = higher score
  SELECT COUNT(*) INTO exec_changes FROM company_executives WHERE company_id = _company_id AND departed_at IS NOT NULL;
  executive_turnover := GREATEST(10 - (exec_changes * 2.0), 0);

  -- Weighted formula
  final_score := ROUND(
    (0.20 * salary_transparency) +
    (0.15 * layoff_risk) +
    (0.15 * lobbying_activity) +
    (0.20 * employee_sentiment) +
    (0.15 * hiring_stability) +
    (0.15 * executive_turnover)
  , 1);

  -- Update the company record
  UPDATE companies SET career_intelligence_score = final_score WHERE id = _company_id;

  RETURN final_score;
END;
$$;

-- Batch compute function for all companies
CREATE OR REPLACE FUNCTION public.compute_all_career_intelligence_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer := 0;
  company_row RECORD;
BEGIN
  FOR company_row IN SELECT id FROM companies LOOP
    PERFORM compute_career_intelligence_score(company_row.id);
    affected := affected + 1;
  END LOOP;
  RETURN affected;
END;
$$;
