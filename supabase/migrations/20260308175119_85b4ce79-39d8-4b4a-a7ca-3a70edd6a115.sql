ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website_url text DEFAULT NULL;