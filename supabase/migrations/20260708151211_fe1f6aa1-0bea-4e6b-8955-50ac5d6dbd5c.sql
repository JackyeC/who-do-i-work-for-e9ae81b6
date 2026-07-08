WITH waiting AS (
  SELECT ir.id AS request_id, ir.company_id
  FROM public.intelligence_requests ir
  JOIN public.scan_jobs old_job ON old_job.id = ir.scan_job_id
  WHERE ir.workflow_status = 'queued'
    AND ir.dossier_outcome = 'unknown'
    AND ir.company_id IS NOT NULL
    AND old_job.status IN ('completed', 'failed')
), new_jobs AS (
  INSERT INTO public.scan_jobs (company_id, section_type, job_type, status, triggered_by, completed_stages, stage_state, attempt_count, queued_reason)
  SELECT DISTINCT company_id, 'dossier', 'dossier_build', 'queued', 'backfill', '{}'::text[], '{}'::jsonb, 0, 'legacy request requeue after link repair'
  FROM waiting
  RETURNING id, company_id
)
UPDATE public.intelligence_requests ir
SET scan_job_id = nj.id,
    updated_at = now()
FROM waiting w
JOIN new_jobs nj ON nj.company_id = w.company_id
WHERE ir.id = w.request_id;