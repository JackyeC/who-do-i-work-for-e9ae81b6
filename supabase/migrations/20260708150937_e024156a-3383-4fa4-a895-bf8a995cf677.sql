WITH stale_requests AS (
  SELECT ir.id,
         ir.employer_name,
         ir.company_id,
         trim(both '-' from lower(regexp_replace(trim(ir.employer_name), '[^a-z0-9]+', '-', 'g'))) AS base_slug
  FROM public.intelligence_requests ir
  WHERE ir.scan_job_id IS NULL
    AND COALESCE(ir.workflow_status, ir.status, 'queued') NOT IN ('completed', 'failed', 'report_sent')
), existing_companies AS (
  SELECT DISTINCT ON (sr.id)
         sr.id AS request_id,
         COALESCE(sr.company_id, c.id) AS resolved_company_id,
         sr.employer_name,
         sr.base_slug
  FROM stale_requests sr
  LEFT JOIN public.companies c
    ON c.slug = sr.base_slug
    OR lower(c.name) = lower(sr.employer_name)
  ORDER BY sr.id, c.created_at ASC NULLS LAST
), inserted_companies AS (
  INSERT INTO public.companies (name, slug, industry, state, record_status, identity_status)
  SELECT ec.employer_name,
         ec.base_slug,
         'Unknown',
         'Unknown',
         'discovered',
         'missing'
  FROM existing_companies ec
  WHERE ec.resolved_company_id IS NULL
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
), resolved AS (
  SELECT ec.request_id,
         COALESCE(ec.resolved_company_id, ic.id, c2.id) AS company_id
  FROM existing_companies ec
  LEFT JOIN inserted_companies ic ON ic.slug = ec.base_slug
  LEFT JOIN public.companies c2 ON c2.slug = ec.base_slug
), inserted_jobs AS (
  INSERT INTO public.scan_jobs (company_id, section_type, job_type, status, triggered_by, completed_stages, stage_state, attempt_count, queued_reason)
  SELECT DISTINCT r.company_id, 'dossier', 'dossier_build', 'queued', 'backfill', '{}'::text[], '{}'::jsonb, 0, 'legacy intelligence request backfill'
  FROM resolved r
  WHERE r.company_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.scan_jobs sj
      WHERE sj.company_id = r.company_id
        AND sj.job_type = 'dossier_build'
        AND sj.status IN ('queued', 'processing', 'retrying', 'pending')
    )
  RETURNING id, company_id
), active_jobs AS (
  SELECT DISTINCT ON (sj.company_id) sj.company_id, sj.id AS scan_job_id
  FROM public.scan_jobs sj
  WHERE sj.job_type = 'dossier_build'
    AND sj.status IN ('queued', 'processing', 'retrying', 'pending')
  ORDER BY sj.company_id, sj.created_at ASC
)
UPDATE public.intelligence_requests ir
SET company_id = r.company_id,
    scan_job_id = aj.scan_job_id,
    workflow_status = COALESCE(NULLIF(ir.workflow_status, ''), 'queued'),
    dossier_outcome = COALESCE(NULLIF(ir.dossier_outcome, ''), 'unknown'),
    notification_status = COALESCE(NULLIF(ir.notification_status, ''), 'not_ready'),
    updated_at = now()
FROM resolved r
JOIN active_jobs aj ON aj.company_id = r.company_id
WHERE ir.id = r.request_id
  AND ir.scan_job_id IS NULL;