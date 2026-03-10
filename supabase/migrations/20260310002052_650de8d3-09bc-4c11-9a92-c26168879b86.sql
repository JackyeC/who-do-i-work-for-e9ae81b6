
-- Personality/work-style profile for career mapping
CREATE TABLE public.user_personality_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_style TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  personality_traits TEXT[] DEFAULT '{}',
  communication_style TEXT DEFAULT NULL,
  leadership_preference TEXT DEFAULT NULL,
  work_environment TEXT DEFAULT NULL,
  ai_summary TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_personality_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own personality profile"
  ON public.user_personality_profile
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SMART goals table linked to growth tracks
CREATE TABLE public.career_smart_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.employee_growth_tracker(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  specific TEXT,
  measurable TEXT,
  achievable TEXT,
  relevant TEXT,
  time_bound TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  is_ai_generated BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.career_smart_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own SMART goals"
  ON public.career_smart_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
