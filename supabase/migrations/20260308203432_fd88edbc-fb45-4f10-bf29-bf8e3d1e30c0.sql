
-- Role pathways: maps transitions between job roles
CREATE TABLE IF NOT EXISTS public.role_pathway (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_role TEXT NOT NULL,
  target_role TEXT NOT NULL,
  move_type TEXT NOT NULL DEFAULT 'lateral', -- lateral, upward, diagonal
  required_skills TEXT[] DEFAULT '{}',
  optional_skills TEXT[] DEFAULT '{}',
  difficulty_score INTEGER DEFAULT 5,
  avg_months_to_pivot INTEGER DEFAULT 12,
  recommended_certifications TEXT[] DEFAULT '{}',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.role_pathway ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Role pathways are publicly readable"
  ON public.role_pathway FOR SELECT
  USING (true);

-- Employee growth tracker: tracks user progress toward target roles
CREATE TABLE IF NOT EXISTS public.employee_growth_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  target_role TEXT NOT NULL,
  target_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  completed_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  skills_match_pct INTEGER DEFAULT 0,
  values_alignment_score INTEGER DEFAULT 0,
  gap_analysis JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'exploring', -- exploring, in_progress, achieved
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_growth_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own growth tracks"
  ON public.employee_growth_tracker FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own growth tracks"
  ON public.employee_growth_tracker FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own growth tracks"
  ON public.employee_growth_tracker FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own growth tracks"
  ON public.employee_growth_tracker FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Internal project gigs: short-term skill-building opportunities
CREATE TABLE IF NOT EXISTS public.project_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  skills_offered TEXT[] DEFAULT '{}',
  duration_weeks INTEGER DEFAULT 4,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project gigs are publicly readable"
  ON public.project_gigs FOR SELECT
  USING (true);

-- Trigger for updated_at on growth tracker
CREATE TRIGGER update_growth_tracker_updated_at
  BEFORE UPDATE ON public.employee_growth_tracker
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
