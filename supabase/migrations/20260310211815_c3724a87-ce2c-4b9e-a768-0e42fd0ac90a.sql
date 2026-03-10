-- Fix privilege escalation: Remove permissive UPDATE policy on user_subscriptions
-- Users should NOT be able to change their own plan_id, additional_slots, or current_period_end

-- Drop existing UPDATE policies on user_subscriptions
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'user_subscriptions' AND schemaname = 'public' AND cmd = 'UPDATE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_subscriptions', pol.policyname);
  END LOOP;
END $$;

-- Create a restricted UPDATE policy that only allows users to update non-sensitive fields
-- (In practice, subscription changes should ONLY happen via server-side edge functions)
-- This policy blocks all direct user updates
CREATE POLICY "No direct subscription updates"
  ON public.user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);