
ALTER TABLE public.company_community_signals
  ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS company_match_method text DEFAULT 'exact_name',
  ADD COLUMN IF NOT EXISTS raw_company_name text;

-- Ensure fetched_at has a usable default
ALTER TABLE public.company_community_signals
  ALTER COLUMN fetched_at SET DEFAULT now();

COMMENT ON COLUMN public.company_community_signals.confidence_score IS 'Match confidence 0-1: how well the external source name matched our company name';
COMMENT ON COLUMN public.company_community_signals.company_match_method IS 'How the company was matched: exact_name, normalized_name, name_plus_state, fuzzy';
COMMENT ON COLUMN public.company_community_signals.raw_company_name IS 'The raw company name returned by the external data source';
