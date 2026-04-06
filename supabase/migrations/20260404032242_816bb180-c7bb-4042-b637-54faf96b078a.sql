-- ═══ FIX 1: Pipeline Run Logs — restrict to admin only ═══

DROP POLICY IF EXISTS "Anyone can read pipeline runs" ON public.pipeline_runs;

CREATE POLICY "Admins can read pipeline runs"
  ON public.pipeline_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ═══ FIX 2: LinkedIn OAuth Token — remove client-side token exposure ═══

-- Drop existing permissive SELECT policy that returns all columns
DROP POLICY IF EXISTS "Users can read own LinkedIn profile" ON public.linkedin_profiles;

-- Create a safe view that excludes token fields
CREATE OR REPLACE VIEW public.linkedin_profiles_safe AS
  SELECT id, user_id, linkedin_id, name, email, 
         profile_url, profile_picture_url, 
         expires_at, created_at, updated_at
  FROM public.linkedin_profiles;

-- Grant access to the safe view
GRANT SELECT ON public.linkedin_profiles_safe TO authenticated;

-- Add a new SELECT policy that only allows service_role to read the base table directly
-- (Edge functions using service_role bypass RLS anyway, but this ensures 
-- no authenticated client can SELECT from the base table)
CREATE POLICY "Only service role can read linkedin profiles"
  ON public.linkedin_profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Authenticated users read via the safe view or the existing get_my_linkedin_profile RPC
-- The view inherits the base table's RLS through the SECURITY INVOKER default,
-- but since we removed the authenticated SELECT policy, clients must use the RPC instead.