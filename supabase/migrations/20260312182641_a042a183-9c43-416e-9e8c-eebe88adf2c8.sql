
-- Usage tracking table for AI function rate limiting
CREATE TABLE public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  function_name text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by user + function + time
CREATE INDEX idx_user_usage_lookup ON public.user_usage (user_id, function_name, used_at DESC);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage"
  ON public.user_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert is done via service role in edge functions, no user insert policy needed

-- Cleanup: auto-delete records older than 30 days to keep table lean
-- (handled via scheduled job or manual cleanup)
