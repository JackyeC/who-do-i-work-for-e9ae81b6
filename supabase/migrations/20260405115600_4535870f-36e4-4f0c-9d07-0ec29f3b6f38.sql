
CREATE OR REPLACE FUNCTION public.trigger_claim_generation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Fire-and-forget: call generate-claims edge function for this company
  BEGIN
    PERFORM public.invoke_edge_function(
      'generate-claims',
      jsonb_build_object('companyId', NEW.company_id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_net may not be enabled or vault not ready; silently skip
    NULL;
  END;
  
  RETURN NEW;
END;
$$;
