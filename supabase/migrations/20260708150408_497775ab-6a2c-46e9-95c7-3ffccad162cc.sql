CREATE OR REPLACE FUNCTION public.claim_dossier_job(
  p_job_id uuid,
  p_lease_owner text,
  p_lease_seconds integer DEFAULT 300
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.scan_jobs%rowtype;
BEGIN
  UPDATE public.scan_jobs
  SET status = 'processing',
      lease_owner = p_lease_owner,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      last_heartbeat_at = now(),
      started_at = COALESCE(started_at, now()),
      attempt_count = attempt_count + 1
  WHERE id = p_job_id
    AND job_type = 'dossier_build'
    AND status IN ('pending', 'queued', 'processing', 'running')
    AND (lease_expires_at IS NULL OR lease_expires_at < now() OR lease_owner = p_lease_owner)
    AND attempt_count < max_attempts
  RETURNING * INTO v_job;

  IF v_job.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job is not claimable');
  END IF;

  UPDATE public.intelligence_requests
  SET workflow_status = 'processing',
      status = 'processing',
      updated_at = now()
  WHERE scan_job_id = p_job_id
    AND workflow_status IN ('queued', 'processing');

  RETURN jsonb_build_object(
    'success', true,
    'jobId', v_job.id,
    'companyId', v_job.company_id,
    'attemptCount', v_job.attempt_count,
    'leaseOwner', v_job.lease_owner,
    'leaseExpiresAt', v_job.lease_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_dossier_job(
  p_job_id uuid,
  p_lease_owner text,
  p_lease_seconds integer DEFAULT 300
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.scan_jobs
  SET lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      last_heartbeat_at = now()
  WHERE id = p_job_id
    AND job_type = 'dossier_build'
    AND lease_owner = p_lease_owner
    AND status IN ('processing', 'running');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_dossier_job(
  p_job_id uuid,
  p_lease_owner text,
  p_status text,
  p_error_type text DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_status NOT IN ('completed', 'failed', 'queued') THEN
    RAISE EXCEPTION 'Invalid final job status';
  END IF;

  UPDATE public.scan_jobs
  SET status = p_status,
      completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN now() ELSE completed_at END,
      lease_owner = NULL,
      lease_expires_at = NULL,
      last_heartbeat_at = now(),
      error_type = p_error_type,
      error_message = p_error_message,
      last_error_at = CASE WHEN p_error_message IS NOT NULL THEN now() ELSE last_error_at END
  WHERE id = p_job_id
    AND job_type = 'dossier_build'
    AND lease_owner = p_lease_owner;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_dossier_job(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.heartbeat_dossier_job(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_dossier_job(uuid, text, text, text, text) TO service_role;