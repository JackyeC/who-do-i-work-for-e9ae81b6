-- Employer profiles table for job credits and certification
CREATE TABLE public.employer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  work_email text,
  job_credits integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own employer profile
CREATE POLICY "Users can read own employer profile"
  ON public.employer_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own employer profile"
  ON public.employer_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own employer profile"
  ON public.employer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all employer profiles"
  ON public.employer_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Add expires_at to company_jobs
ALTER TABLE public.company_jobs
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Function to auto-deactivate expired jobs
CREATE OR REPLACE FUNCTION public.deactivate_expired_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.company_jobs
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;