-- Fix: Replace the Admin write companies ALL policy with proper USING + WITH CHECK
-- The existing policy has no USING clause, causing UPDATE to find 0 rows

DROP POLICY IF EXISTS "Admin write companies" ON public.companies;

CREATE POLICY "Admin write companies" ON public.companies
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));