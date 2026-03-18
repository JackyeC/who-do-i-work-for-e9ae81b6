ALTER TABLE public.company_signal_scans 
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS value_normalized text;