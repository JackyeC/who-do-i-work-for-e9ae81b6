WITH stale_requests AS (
  SELECT ir.id,
         ir.employer_name,
         trim(both '-' from lower(regexp_replace(trim(ir.employer_name), '[^a-z0-9]+', '-', 'g'))) AS base_slug
  FROM public.intelligence_requests ir
  WHERE ir.scan_job_id IS NULL
    AND COALESCE(ir.workflow_status, ir.status, 'queued') NOT IN ('completed', 'failed', 'report_sent')
), matched AS (
  SELECT DISTINCT ON (sr.id)
         sr.id AS request_id,
         c.id AS company_id,
         sj.id AS scan_job_id
  FROM stale_requests sr
  JOIN public.companies c
    ON c.slug = sr.base_slug
    OR lower(c.name) = lower(sr.employer_name)
  JOIN public.scan_jobs sj
    ON sj.company_id = c.id
   AND sj.job_type = 'dossier_build'
  ORDER BY sr.id, sj.created_at DESC
)
UPDATE public.intelligence_requests ir
SET company_id = matched.company_id,
    scan_job_id = matched.scan_job_id,
    workflow_status = CASE WHEN ir.workflow_status = 'completed' THEN ir.workflow_status ELSE 'queued' END,
    dossier_outcome = COALESCE(NULLIF(ir.dossier_outcome, ''), 'unknown'),
    notification_status = COALESCE(NULLIF(ir.notification_status, ''), 'not_ready'),
    updated_at = now()
FROM matched
WHERE ir.id = matched.request_id;