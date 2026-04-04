-- Replace the overly permissive anonymous INSERT policy on briefing_signals
-- with one that validates required fields and restricts to the briefing_dna signal type

DROP POLICY IF EXISTS "Allow public insert" ON public.briefing_signals;

CREATE POLICY "Anon insert briefing requests only"
  ON public.briefing_signals
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Only allow the briefing_dna signal type (lead capture flow)
    signal_type = 'briefing_dna'
    -- Require a non-empty title
    AND title IS NOT NULL AND length(trim(title)) > 0
    -- Require a non-empty source_name
    AND source_name IS NOT NULL AND length(trim(source_name)) > 0
    -- Prevent setting admin-only fields
    AND is_pinned = false
    AND is_active = true
  );