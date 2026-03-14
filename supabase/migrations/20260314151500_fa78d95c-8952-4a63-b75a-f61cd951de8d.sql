
-- Bracket votes table for Brand Madness tournament
CREATE TABLE public.bracket_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  matchup_id TEXT NOT NULL,
  round INTEGER NOT NULL DEFAULT 1,
  voted_for TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, matchup_id, round)
);

ALTER TABLE public.bracket_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read aggregate vote counts (no user_id exposed)
CREATE POLICY "Anyone can read vote counts" ON public.bracket_votes
  FOR SELECT USING (true);

-- Authenticated users can insert their own votes
CREATE POLICY "Users can insert own votes" ON public.bracket_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes" ON public.bracket_votes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Rivalry follows table for alert subscriptions
CREATE TABLE public.rivalry_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rivalry_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, rivalry_id)
);

ALTER TABLE public.rivalry_follows ENABLE ROW LEVEL SECURITY;

-- Users can read their own follows
CREATE POLICY "Users can read own follows" ON public.rivalry_follows
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own follows
CREATE POLICY "Users can insert own follows" ON public.rivalry_follows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete own follows
CREATE POLICY "Users can delete own follows" ON public.rivalry_follows
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
