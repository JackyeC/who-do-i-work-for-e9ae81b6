
-- Create table for interview flinch signals
CREATE TABLE public.interview_flinch_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  company_name TEXT NOT NULL,
  signal_category TEXT NOT NULL,
  flinch_detected BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interview_flinch_signals ENABLE ROW LEVEL SECURITY;

-- Users can insert their own rows
CREATE POLICY "Users can insert own flinch signals"
  ON public.interview_flinch_signals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own rows
CREATE POLICY "Users can read own flinch signals"
  ON public.interview_flinch_signals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Security definer function for aggregated crowd data (no individual exposure)
CREATE OR REPLACE FUNCTION public.get_crowd_flinch_signals(_company_id UUID)
RETURNS TABLE(
  signal_category TEXT,
  total_responses BIGINT,
  flinch_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    ifs.signal_category,
    COUNT(*)::BIGINT AS total_responses,
    COUNT(*) FILTER (WHERE ifs.flinch_detected)::BIGINT AS flinch_count
  FROM public.interview_flinch_signals ifs
  WHERE ifs.company_id = _company_id
  GROUP BY ifs.signal_category
  HAVING COUNT(*) >= 3
$$;
