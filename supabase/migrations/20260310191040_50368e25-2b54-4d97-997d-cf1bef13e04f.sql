
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sec_cik TEXT,
  ADD COLUMN IF NOT EXISTS ticker TEXT,
  ADD COLUMN IF NOT EXISTS is_publicly_traded BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.companies.sec_cik IS 'SEC Central Index Key — permanent 10-digit regulatory ID';
COMMENT ON COLUMN public.companies.ticker IS 'Stock ticker symbol (null for private companies)';
COMMENT ON COLUMN public.companies.is_publicly_traded IS 'Whether the company trades on a public exchange';
