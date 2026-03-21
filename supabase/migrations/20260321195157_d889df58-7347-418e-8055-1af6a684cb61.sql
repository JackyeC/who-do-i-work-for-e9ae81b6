
-- 1. Drop the permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can read vote counts" ON public.bracket_votes;

-- 2. Add policy: authenticated users can only read their own votes
CREATE POLICY "Users read own votes"
  ON public.bracket_votes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create aggregated view (no user_id exposed)
CREATE OR REPLACE VIEW public.bracket_vote_totals
  WITH (security_invoker = true)
  AS SELECT matchup_id, voted_for, COUNT(*)::int AS vote_count
     FROM public.bracket_votes
     GROUP BY matchup_id, voted_for;

-- 4. Grant access to both roles
GRANT SELECT ON public.bracket_vote_totals TO anon, authenticated;
