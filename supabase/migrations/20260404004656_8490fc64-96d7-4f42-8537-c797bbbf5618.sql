
-- Function to queue claim generation for a company via pg_net
CREATE OR REPLACE FUNCTION public.trigger_claim_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  company_name text;
  supabase_url text;
  anon_key text;
BEGIN
  -- Fire-and-forget: call generate-claims edge function for this company
  SELECT name INTO company_name FROM companies WHERE id = NEW.company_id LIMIT 1;
  
  supabase_url := current_setting('app.settings.supabase_url', true);
  anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- Use pg_net if available for async call, otherwise just log
  BEGIN
    PERFORM net.http_post(
      url := coalesce(supabase_url, 'https://tdetybqdxadmowjivtjy.supabase.co') || '/functions/v1/generate-claims',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(anon_key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc')
      ),
      body := jsonb_build_object('companyId', NEW.company_id)
    );
  EXCEPTION WHEN OTHERS THEN
    -- pg_net may not be enabled; silently skip
    NULL;
  END;
  
  RETURN NEW;
END;
$$;

-- Create triggers on all signal tables
CREATE OR REPLACE TRIGGER trg_claims_on_warn
AFTER INSERT ON public.company_warn_notices
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_accountability
AFTER INSERT ON public.accountability_signals
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_civil_rights
AFTER INSERT ON public.civil_rights_signals
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_climate
AFTER INSERT ON public.climate_signals
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_court_cases
AFTER INSERT ON public.company_court_cases
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_ai_hiring
AFTER INSERT ON public.ai_hiring_signals
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_ai_hr
AFTER INSERT ON public.ai_hr_signals
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_news
AFTER INSERT ON public.company_news_signals
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_signal_scans
AFTER INSERT ON public.company_signal_scans
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();

CREATE OR REPLACE TRIGGER trg_claims_on_candidates
AFTER INSERT ON public.company_candidates
FOR EACH ROW EXECUTE FUNCTION public.trigger_claim_generation();
