-- Restrict internal intelligence tables to company-scoped viewers and admins/owners
DROP POLICY IF EXISTS "Authenticated read scan alerts" ON public.scan_alerts;
CREATE POLICY "Scoped read scan alerts"
ON public.scan_alerts
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.user_company_watchlist w
    WHERE w.user_id = auth.uid()
      AND w.company_id = public.scan_alerts.company_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.tracked_companies t
    WHERE t.user_id = auth.uid()
      AND t.company_id = public.scan_alerts.company_id
      AND COALESCE(t.is_active, true)
  )
);

DROP POLICY IF EXISTS "Authenticated users can read dossiers" ON public.company_dossiers;
CREATE POLICY "Scoped read company dossiers"
ON public.company_dossiers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.user_company_watchlist w
    WHERE w.user_id = auth.uid()
      AND w.company_id = public.company_dossiers.company_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.tracked_companies t
    WHERE t.user_id = auth.uid()
      AND t.company_id = public.company_dossiers.company_id
      AND COALESCE(t.is_active, true)
  )
);

DROP POLICY IF EXISTS "Anyone can read leader enrichments" ON public.leader_enrichments;
CREATE POLICY "Scoped read leader enrichments"
ON public.leader_enrichments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'owner'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.user_company_watchlist w
    WHERE w.user_id = auth.uid()
      AND w.company_id = public.leader_enrichments.company_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.tracked_companies t
    WHERE t.user_id = auth.uid()
      AND t.company_id = public.leader_enrichments.company_id
      AND COALESCE(t.is_active, true)
  )
);