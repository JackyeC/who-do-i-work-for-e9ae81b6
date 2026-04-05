
-- 1. Fix scan_usage: drop the blanket anon SELECT policy
DROP POLICY IF EXISTS "Anon reads own session scans" ON public.scan_usage;

-- The existing "Users can read own scans" policy already handles both
-- authenticated (user_id = auth.uid()) and anon (session_id IS NOT NULL) reads
-- with proper scoping, so no replacement needed.

-- 2. Fix company_ingestion_queue: restrict to admin/owner only
DROP POLICY IF EXISTS "Authenticated users can read ingestion queue" ON public.company_ingestion_queue;

CREATE POLICY "Admins can read ingestion queue"
  ON public.company_ingestion_queue FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'owner'::public.app_role)
  );

-- 3. Fix has_active_subscription: add auth.uid() guard
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = _user_id
      AND status IN ('active', 'trialing')
      AND _user_id = auth.uid()
  )
$$;
