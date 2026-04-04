-- Fix: Replace spoofable header-based SELECT policy with admin-only access
DROP POLICY IF EXISTS "Users can view own requests" ON intelligence_requests;

CREATE POLICY "Admins can view intelligence requests"
  ON intelligence_requests FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));
