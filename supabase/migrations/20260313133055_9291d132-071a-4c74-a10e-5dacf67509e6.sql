-- Fix 1: browse_ai_change_events - restrict public SELECT to authenticated only
DROP POLICY IF EXISTS "Change events are publicly readable" ON public.browse_ai_change_events;

CREATE POLICY "Authenticated users can read change events"
  ON public.browse_ai_change_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: correction_requests - add admin SELECT and DELETE for PII governance
CREATE POLICY "Admins can view correction requests"
  ON public.correction_requests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can delete correction requests"
  ON public.correction_requests
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));