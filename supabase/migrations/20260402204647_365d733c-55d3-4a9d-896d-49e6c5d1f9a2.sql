
DROP POLICY "Anyone can view promo snippets" ON public.promo_snippets;

CREATE POLICY "Anyone can view promo snippets"
  ON public.promo_snippets FOR SELECT
  TO anon, authenticated
  USING (true);
