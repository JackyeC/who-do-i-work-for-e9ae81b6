
CREATE TABLE public.stretch_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_gap TEXT NOT NULL,
  project_title TEXT NOT NULL,
  why_it_matters TEXT,
  proposal_script TEXT,
  target_company TEXT,
  target_role TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  readiness_points INTEGER NOT NULL DEFAULT 0,
  ai_generated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stretch_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stretch projects"
  ON public.stretch_projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stretch projects"
  ON public.stretch_projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stretch projects"
  ON public.stretch_projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own stretch projects"
  ON public.stretch_projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
