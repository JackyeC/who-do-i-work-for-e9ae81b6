ALTER TABLE public.company_jobs 
  ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsor_expires_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sponsor_email text DEFAULT NULL;