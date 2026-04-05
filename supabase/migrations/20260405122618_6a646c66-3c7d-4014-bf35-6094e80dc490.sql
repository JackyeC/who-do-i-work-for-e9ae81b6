
-- Trigger function: log INSERT/UPDATE/DELETE on critical tables to audit_log
CREATE OR REPLACE FUNCTION public.fn_audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (action, actor_id, target_table, target_id, metadata)
  VALUES (
    TG_OP,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
      'unknown'
    ),
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'timestamp', now()
    )
  );
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Attach triggers to critical tables
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

CREATE TRIGGER audit_company_dossiers
  AFTER INSERT OR UPDATE OR DELETE ON public.company_dossiers
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

CREATE TRIGGER audit_accountability_signals
  AFTER INSERT OR UPDATE OR DELETE ON public.accountability_signals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

CREATE TRIGGER audit_company_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.company_claims
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

CREATE TRIGGER audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

CREATE TRIGGER audit_work_news
  AFTER INSERT OR UPDATE OR DELETE ON public.work_news
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();
