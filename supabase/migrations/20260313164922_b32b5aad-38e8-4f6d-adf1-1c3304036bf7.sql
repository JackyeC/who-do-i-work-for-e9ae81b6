
-- 1. Restrict browse_ai_change_events to admin/owner only
DROP POLICY IF EXISTS "Admins can read change events" ON public.browse_ai_change_events;
CREATE POLICY "Admins can read change events"
  ON public.browse_ai_change_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- 2. Restrict company_scan_events INSERT to admin/owner
DROP POLICY IF EXISTS "Admins can insert scan events" ON public.company_scan_events;
CREATE POLICY "Admins can insert scan events"
  ON public.company_scan_events FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
