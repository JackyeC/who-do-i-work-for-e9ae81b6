-- Fix: Restrict accountability_signals INSERT to admins only
-- The current policy allows any authenticated user to insert signals for any company

DROP POLICY IF EXISTS "Authenticated users can submit accountability signals" ON accountability_signals;

CREATE POLICY "Admins insert accountability signals"
  ON accountability_signals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));