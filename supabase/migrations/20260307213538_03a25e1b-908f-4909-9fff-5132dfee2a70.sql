
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS record_status text NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS creation_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS search_query text,
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS last_scan_attempted timestamptz,
  ADD COLUMN IF NOT EXISTS scan_completion jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS identity_matched boolean DEFAULT true;
