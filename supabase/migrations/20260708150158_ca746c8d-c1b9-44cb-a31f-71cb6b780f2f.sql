ALTER TABLE public.scan_jobs
  ADD COLUMN IF NOT EXISTS job_type text NOT NULL DEFAULT 'section_refresh',
  ADD COLUMN IF NOT EXISTS lease_owner text,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS completed_stages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stage_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS queued_reason text;

ALTER TABLE public.intelligence_requests
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scan_job_id uuid REFERENCES public.scan_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS workflow_status text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS dossier_outcome text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS outcome_reason text,
  ADD COLUMN IF NOT EXISTS notification_status text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS notification_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notification_last_error text,
  ADD COLUMN IF NOT EXISTS notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS requester_token uuid NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.scan_notify_requests
  ADD COLUMN IF NOT EXISTS scan_job_id uuid REFERENCES public.scan_jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notification_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notification_last_error text,
  ADD COLUMN IF NOT EXISTS requester_token uuid NOT NULL DEFAULT gen_random_uuid();

UPDATE public.intelligence_requests
SET workflow_status = CASE
    WHEN status = 'report_sent' THEN 'completed'
    WHEN status = 'failed' THEN 'failed'
    ELSE 'queued'
  END,
  dossier_outcome = CASE
    WHEN status = 'report_sent' THEN 'ready'
    WHEN status = 'failed' THEN 'failed'
    ELSE dossier_outcome
  END,
  notification_status = CASE
    WHEN status = 'report_sent' THEN 'sent'
    WHEN status = 'failed' THEN 'pending'
    ELSE notification_status
  END,
  notified_at = CASE WHEN status = 'report_sent' THEN COALESCE(notified_at, updated_at) ELSE notified_at END;

UPDATE public.scan_jobs
SET job_type = CASE WHEN job_type = 'section_refresh' THEN COALESCE(section_type, 'dossier_build') ELSE job_type END;

CREATE INDEX IF NOT EXISTS idx_intelligence_requests_company_job ON public.intelligence_requests (company_id, scan_job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_requests_workflow ON public.intelligence_requests (workflow_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_requests_notification ON public.intelligence_requests (notification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_requests_token ON public.intelligence_requests (requester_token);
CREATE INDEX IF NOT EXISTS idx_intelligence_requests_email_recent ON public.intelligence_requests (lower(email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_dossier_active ON public.scan_jobs (company_id, job_type, status, created_at DESC) WHERE job_type = 'dossier_build' AND status IN ('pending', 'queued', 'processing', 'running');
CREATE INDEX IF NOT EXISTS idx_scan_jobs_lease ON public.scan_jobs (status, lease_expires_at, created_at) WHERE status IN ('pending', 'queued', 'processing', 'running');
CREATE INDEX IF NOT EXISTS idx_scan_notify_token ON public.scan_notify_requests (requester_token);
CREATE INDEX IF NOT EXISTS idx_scan_notify_job ON public.scan_notify_requests (scan_job_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.wdiwf_slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(trim(input)), '[^a-z0-9]+', '-', 'g')), ''), 'unknown-employer')
$$;

CREATE OR REPLACE FUNCTION public.create_or_join_dossier_request(
  p_employer_name text,
  p_role_title text,
  p_email text,
  p_location text DEFAULT NULL,
  p_job_posting_url text DEFAULT NULL,
  p_concerns text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_employer text := trim(p_employer_name);
  v_role text := COALESCE(NULLIF(trim(p_role_title), ''), 'General inquiry');
  v_slug text;
  v_company_id uuid;
  v_company_slug text;
  v_job_id uuid;
  v_request_id uuid;
  v_token uuid;
  v_recent_count integer;
BEGIN
  IF v_employer IS NULL OR length(v_employer) < 2 THEN
    RAISE EXCEPTION 'Employer name is required';
  END IF;

  IF v_email IS NULL OR v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.intelligence_requests
  WHERE lower(email) = v_email
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many recent requests for this email. Try again later.';
  END IF;

  v_slug := public.wdiwf_slugify(v_employer);

  SELECT id, slug INTO v_company_id, v_company_slug
  FROM public.companies
  WHERE slug = v_slug OR lower(name) = lower(v_employer) OR canonical_name = lower(v_employer)
  ORDER BY CASE WHEN slug = v_slug THEN 0 WHEN lower(name) = lower(v_employer) THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_company_id IS NULL THEN
    BEGIN
      INSERT INTO public.companies (name, slug, industry, state, record_status, creation_source, search_query, identity_status, identity_matched, confidence_rating)
      VALUES (v_employer, v_slug, 'Unknown', 'Unknown', 'discovered', 'intelligence_request', v_employer, 'missing', false, 'low')
      RETURNING id, slug INTO v_company_id, v_company_slug;
    EXCEPTION WHEN unique_violation THEN
      SELECT id, slug INTO v_company_id, v_company_slug
      FROM public.companies
      WHERE slug = v_slug OR lower(name) = lower(v_employer)
      LIMIT 1;

      IF v_company_id IS NULL THEN
        v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
        INSERT INTO public.companies (name, slug, industry, state, record_status, creation_source, search_query, identity_status, identity_matched, confidence_rating)
        VALUES (v_employer, v_slug, 'Unknown', 'Unknown', 'discovered', 'intelligence_request', v_employer, 'missing', false, 'low')
        RETURNING id, slug INTO v_company_id, v_company_slug;
      END IF;
    END;
  END IF;

  SELECT id INTO v_job_id
  FROM public.scan_jobs
  WHERE company_id = v_company_id
    AND job_type = 'dossier_build'
    AND status IN ('pending', 'queued', 'processing', 'running')
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_job_id IS NULL THEN
    INSERT INTO public.scan_jobs (company_id, section_type, job_type, status, triggered_by, queued_reason)
    VALUES (v_company_id, 'dossier_build', 'dossier_build', 'queued', 'requester', 'Employer intelligence request')
    RETURNING id INTO v_job_id;
  END IF;

  INSERT INTO public.intelligence_requests (
    employer_name,
    role_title,
    location,
    job_posting_url,
    concerns,
    email,
    status,
    company_id,
    scan_job_id,
    workflow_status,
    dossier_outcome,
    notification_status
  )
  VALUES (
    v_employer,
    v_role,
    NULLIF(trim(p_location), ''),
    NULLIF(trim(p_job_posting_url), ''),
    NULLIF(trim(p_concerns), ''),
    v_email,
    'queued',
    v_company_id,
    v_job_id,
    'queued',
    'unknown',
    'not_ready'
  )
  RETURNING id, requester_token INTO v_request_id, v_token;

  RETURN jsonb_build_object(
    'success', true,
    'requestId', v_request_id,
    'requesterToken', v_token,
    'companyId', v_company_id,
    'companySlug', v_company_slug,
    'scanJobId', v_job_id,
    'workflowStatus', 'queued',
    'dossierOutcome', 'unknown',
    'notificationStatus', 'not_ready'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_or_join_scan_notify_request(
  p_company_name text,
  p_email text,
  p_company_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_company_name text := trim(p_company_name);
  v_company_id uuid := p_company_id;
  v_company_slug text;
  v_slug text;
  v_job_id uuid;
  v_request_id uuid;
  v_token uuid;
  v_recent_count integer;
BEGIN
  IF v_company_name IS NULL OR length(v_company_name) < 2 THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;

  IF v_email IS NULL OR v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.scan_notify_requests
  WHERE lower(email) = v_email
    AND created_at > now() - interval '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'Too many recent notification requests for this email. Try again later.';
  END IF;

  IF v_company_id IS NOT NULL THEN
    SELECT slug INTO v_company_slug FROM public.companies WHERE id = v_company_id LIMIT 1;
  END IF;

  IF v_company_id IS NULL THEN
    v_slug := public.wdiwf_slugify(v_company_name);
    SELECT id, slug INTO v_company_id, v_company_slug
    FROM public.companies
    WHERE slug = v_slug OR lower(name) = lower(v_company_name) OR canonical_name = lower(v_company_name)
    ORDER BY CASE WHEN slug = v_slug THEN 0 WHEN lower(name) = lower(v_company_name) THEN 1 ELSE 2 END
    LIMIT 1;
  END IF;

  IF v_company_id IS NOT NULL THEN
    SELECT id INTO v_job_id
    FROM public.scan_jobs
    WHERE company_id = v_company_id
      AND job_type = 'dossier_build'
      AND status IN ('pending', 'queued', 'processing', 'running')
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NULL THEN
      INSERT INTO public.scan_jobs (company_id, section_type, job_type, status, triggered_by, queued_reason)
      VALUES (v_company_id, 'dossier_build', 'dossier_build', 'queued', 'requester', 'Dossier notification request')
      RETURNING id INTO v_job_id;
    END IF;
  END IF;

  INSERT INTO public.scan_notify_requests (email, company_id, company_name, status, scan_job_id)
  VALUES (v_email, v_company_id, v_company_name, 'pending', v_job_id)
  RETURNING id, requester_token INTO v_request_id, v_token;

  RETURN jsonb_build_object(
    'success', true,
    'requestId', v_request_id,
    'requesterToken', v_token,
    'companyId', v_company_id,
    'companySlug', v_company_slug,
    'scanJobId', v_job_id,
    'notificationStatus', 'pending'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dossier_request_status(p_requester_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'success', true,
    'requestId', ir.id,
    'employerName', ir.employer_name,
    'companySlug', c.slug,
    'workflowStatus', ir.workflow_status,
    'dossierOutcome', ir.dossier_outcome,
    'outcomeReason', ir.outcome_reason,
    'notificationStatus', ir.notification_status,
    'createdAt', ir.created_at,
    'updatedAt', ir.updated_at,
    'jobStatus', sj.status,
    'jobStartedAt', sj.started_at,
    'jobCompletedAt', sj.completed_at
  ) INTO v_result
  FROM public.intelligence_requests ir
  LEFT JOIN public.companies c ON c.id = ir.company_id
  LEFT JOIN public.scan_jobs sj ON sj.id = ir.scan_job_id
  WHERE ir.requester_token = p_requester_token
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_or_join_dossier_request(text, text, text, text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_or_join_scan_notify_request(text, text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dossier_request_status(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wdiwf_slugify(text) TO anon, authenticated, service_role;