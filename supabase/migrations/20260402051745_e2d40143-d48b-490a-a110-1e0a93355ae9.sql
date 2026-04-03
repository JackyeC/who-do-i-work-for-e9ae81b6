
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can submit signals" ON public.accountability_signals;

-- Tighter insert: authenticated users only, and we could add moderation later
CREATE POLICY "Authenticated users can submit accountability signals"
  ON public.accountability_signals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
