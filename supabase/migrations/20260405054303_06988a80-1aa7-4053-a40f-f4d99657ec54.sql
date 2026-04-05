
-- 1. Add Stripe sync columns to user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
  ON public.user_subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub 
  ON public.user_subscriptions (stripe_subscription_id);

-- Allow service_role to INSERT (for webhook creating new subscription rows)
CREATE POLICY "Service role can insert subscriptions"
  ON public.user_subscriptions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service_role to UPDATE (for webhook syncing subscription changes)
CREATE POLICY "Service role can update subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_table text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- Service role can insert audit entries (from edge functions)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated admins can also insert audit entries
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));
