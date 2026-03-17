
CREATE OR REPLACE FUNCTION public.compute_career_intelligence_score(_company_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT COUNT(*) INTO comp_count FROM compensation_data WHERE company = _company_id::text;
  salary_transparency := LEAST(comp_count * 2.0, 10);

  SELECT COUNT(*) INTO warn_count FROM company_warn_notices WHERE company_id = _company_id;
  layoff_risk := GREATEST(10 - (warn_count * 2.0), 0);

  SELECT COALESCE(lobbying_spend, 0) INTO lobby_spend FROM companies WHERE id = _company_id;
  lobbying_activity := CASE
    WHEN lobby_spend <= 0 THEN 8
    WHEN lobby_spend < 100000 THEN 7
    WHEN lobby_spend < 1000000 THEN 5
    WHEN lobby_spend < 10000000 THEN 3
    ELSE 1
  END;

  SELECT COUNT(*) INTO sentiment_count FROM company_worker_sentiment WHERE company_id = _company_id AND sentiment = 'positive';
  employee_sentiment := LEAST(sentiment_count * 1.5, 10);

  SELECT COUNT(*) INTO job_count FROM company_jobs WHERE company_id = _company_id AND is_active = true;
  hiring_stability := LEAST(job_count * 0.5, 10);

  SELECT COUNT(*) INTO exec_changes FROM company_executives WHERE company_id = _company_id AND departed_at IS NOT NULL;
  executive_turnover := GREATEST(10 - (exec_changes * 2.0), 0);

  final_score := ROUND(
    (0.20 * salary_transparency) +
    (0.15 * layoff_risk) +
    (0.15 * lobbying_activity) +
    (0.20 * employee_sentiment) +
    (0.15 * hiring_stability) +
    (0.15 * executive_turnover)
  , 1);

  UPDATE companies SET career_intelligence_score = final_score WHERE id = _company_id;
  RETURN final_score;
END;
$function$;

SELECT compute_all_career_intelligence_scores();
