
DROP POLICY "Shared offer checks are publicly readable" ON public.offer_checks;

CREATE POLICY "Shared offer checks are publicly readable"
  ON public.offer_checks FOR SELECT
  TO anon
  USING (
    share_metadata IS NOT NULL 
    AND share_metadata->>'is_shared' = 'true'
  );
