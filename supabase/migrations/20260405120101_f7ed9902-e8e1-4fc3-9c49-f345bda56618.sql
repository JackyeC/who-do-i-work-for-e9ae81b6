
-- 1. Create subscription check helper (SECURITY DEFINER to avoid RLS recursion)
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
  )
$$;

-- 2. company_report_sections — gate premium intelligence behind subscription
-- Drop existing permissive public/auth SELECT policies
DROP POLICY IF EXISTS "Anyone can read report sections" ON public.company_report_sections;
DROP POLICY IF EXISTS "Authenticated users read report sections" ON public.company_report_sections;

-- Subscribers, admins, and service role can read
CREATE POLICY "Subscribers and admins can read report sections"
ON public.company_report_sections
FOR SELECT
TO authenticated
USING (
  public.has_active_subscription(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

-- Service role retains full access for edge functions/pipelines
CREATE POLICY "Service role reads report sections"
ON public.company_report_sections
FOR SELECT
TO service_role
USING (true);

-- 3. company_careers_signals — gate behind subscription
DROP POLICY IF EXISTS "Authenticated users can read careers signals" ON public.company_careers_signals;

CREATE POLICY "Subscribers and admins can read careers signals"
ON public.company_careers_signals
FOR SELECT
TO authenticated
USING (
  public.has_active_subscription(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Service role reads careers signals"
ON public.company_careers_signals
FOR SELECT
TO service_role
USING (true);

-- 4. company_coverage_summary — gate behind subscription
DROP POLICY IF EXISTS "Authenticated users can read coverage summary" ON public.company_coverage_summary;

CREATE POLICY "Subscribers and admins can read coverage summary"
ON public.company_coverage_summary
FOR SELECT
TO authenticated
USING (
  public.has_active_subscription(auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Service role reads coverage summary"
ON public.company_coverage_summary
FOR SELECT
TO service_role
USING (true);

-- 5. company_dossiers — tighten existing scoped read to also require subscription
DROP POLICY IF EXISTS "Scoped read company dossiers" ON public.company_dossiers;

CREATE POLICY "Subscription-gated read company dossiers"
ON public.company_dossiers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
  OR (
    public.has_active_subscription(auth.uid())
    AND (
      EXISTS (SELECT 1 FROM user_company_watchlist w WHERE w.user_id = auth.uid() AND w.company_id = company_dossiers.company_id)
      OR EXISTS (SELECT 1 FROM tracked_companies t WHERE t.user_id = auth.uid() AND t.company_id = company_dossiers.company_id AND COALESCE(t.is_active, true))
    )
  )
);

-- 6. Add index on user_subscriptions for fast policy lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active
ON public.user_subscriptions (user_id)
WHERE status IN ('active', 'trialing');
