
-- Add entity resolution columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS canonical_name text,
  ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'missing',
  ADD COLUMN IF NOT EXISTS domain_confidence text;

-- Create index on canonical_name for duplicate detection
CREATE INDEX IF NOT EXISTS idx_companies_canonical_name ON public.companies (canonical_name);

-- Create potential_duplicates table
CREATE TABLE IF NOT EXISTS public.potential_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_a_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_b_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  similarity_score numeric NOT NULL DEFAULT 0,
  match_reason text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_a_id, company_b_id)
);

ALTER TABLE public.potential_duplicates ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can manage duplicates
CREATE POLICY "Admins can view potential duplicates"
  ON public.potential_duplicates FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update potential duplicates"
  ON public.potential_duplicates FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert potential duplicates"
  ON public.potential_duplicates FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to compute canonical_name and identity_status
CREATE OR REPLACE FUNCTION public.compute_identity_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  cleaned text;
BEGIN
  -- Normalize name: lowercase, strip suffixes, trim
  cleaned := trim(lower(NEW.name));
  cleaned := regexp_replace(cleaned, ',?\s*(inc\.?|llc|corp\.?|corporation|ltd\.?|l\.?p\.?|holdings|group|company|co\.?|enterprises|industries|international)\s*$', '', 'gi');
  cleaned := regexp_replace(cleaned, '[^a-z0-9\s]', '', 'g');
  cleaned := regexp_replace(cleaned, '\s+', ' ', 'g');
  cleaned := trim(cleaned);
  
  NEW.canonical_name := cleaned;
  
  -- Compute identity_status
  IF NEW.name IS NOT NULL AND NEW.website_url IS NOT NULL AND NEW.domain IS NOT NULL THEN
    NEW.identity_status := 'complete';
  ELSIF NEW.name IS NOT NULL AND (NEW.website_url IS NOT NULL OR NEW.domain IS NOT NULL) THEN
    NEW.identity_status := 'partial';
  ELSE
    NEW.identity_status := 'missing';
  END IF;
  
  -- Derive domain from website_url if missing
  IF NEW.domain IS NULL AND NEW.website_url IS NOT NULL THEN
    NEW.domain := regexp_replace(
      regexp_replace(NEW.website_url, '^https?://(www\.)?', ''),
      '/.*$', ''
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on insert and update
CREATE TRIGGER trg_compute_identity_status
  BEFORE INSERT OR UPDATE OF name, website_url, domain
  ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_identity_status();

-- Backfill existing records
UPDATE public.companies SET canonical_name = canonical_name;
