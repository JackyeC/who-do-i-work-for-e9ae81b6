ALTER TABLE public.briefing_signals
  ADD COLUMN email TEXT,
  ADD COLUMN dna_profile TEXT,
  ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT now();