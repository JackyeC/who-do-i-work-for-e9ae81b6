-- Restrict patent assignment inserts to backend service role only
DROP POLICY IF EXISTS "Service insert patent_assignments" ON public.patent_assignments;
CREATE POLICY "Service insert patent_assignments"
ON public.patent_assignments
FOR INSERT
TO service_role
WITH CHECK (true);

-- Remove anonymous access to internal scan alerts
DROP POLICY IF EXISTS "Scan alerts are publicly readable" ON public.scan_alerts;
CREATE POLICY "Authenticated read scan alerts"
ON public.scan_alerts
FOR SELECT
TO authenticated
USING (true);

-- Move sponsor contact details out of the public jobs table
CREATE TABLE IF NOT EXISTS public.company_job_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES public.company_jobs(id) ON DELETE CASCADE,
  sponsor_email TEXT NOT NULL,
  sponsor_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_job_sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages company_job_sponsors" ON public.company_job_sponsors;
CREATE POLICY "Service role manages company_job_sponsors"
ON public.company_job_sponsors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read company_job_sponsors" ON public.company_job_sponsors;
CREATE POLICY "Admins can read company_job_sponsors"
ON public.company_job_sponsors
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP TRIGGER IF EXISTS update_company_job_sponsors_updated_at ON public.company_job_sponsors;
CREATE TRIGGER update_company_job_sponsors_updated_at
BEFORE UPDATE ON public.company_job_sponsors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.company_job_sponsors (job_id, sponsor_email, sponsor_expires_at)
SELECT cj.id, cj.sponsor_email, cj.sponsor_expires_at
FROM public.company_jobs cj
WHERE cj.sponsor_email IS NOT NULL
ON CONFLICT (job_id) DO UPDATE
SET sponsor_email = EXCLUDED.sponsor_email,
    sponsor_expires_at = EXCLUDED.sponsor_expires_at,
    updated_at = now();

ALTER TABLE public.company_jobs DROP COLUMN IF EXISTS sponsor_email;
ALTER TABLE public.company_jobs DROP COLUMN IF EXISTS sponsor_expires_at;

-- Move Stripe customer identifiers out of general employer profiles
CREATE TABLE IF NOT EXISTS public.employer_billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_billing_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages employer_billing_profiles" ON public.employer_billing_profiles;
CREATE POLICY "Service role manages employer_billing_profiles"
ON public.employer_billing_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own employer billing profile" ON public.employer_billing_profiles;
CREATE POLICY "Users can read own employer billing profile"
ON public.employer_billing_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read employer billing profiles" ON public.employer_billing_profiles;
CREATE POLICY "Admins can read employer billing profiles"
ON public.employer_billing_profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
);

DROP TRIGGER IF EXISTS update_employer_billing_profiles_updated_at ON public.employer_billing_profiles;
CREATE TRIGGER update_employer_billing_profiles_updated_at
BEFORE UPDATE ON public.employer_billing_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.employer_billing_profiles (user_id, stripe_customer_id)
SELECT ep.user_id, ep.stripe_customer_id
FROM public.employer_profiles ep
WHERE ep.stripe_customer_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE
SET stripe_customer_id = EXCLUDED.stripe_customer_id,
    updated_at = now();

ALTER TABLE public.employer_profiles DROP COLUMN IF EXISTS stripe_customer_id;