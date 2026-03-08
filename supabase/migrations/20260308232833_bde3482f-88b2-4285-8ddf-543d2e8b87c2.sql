
CREATE TABLE public.career_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_title TEXT NOT NULL,
  next_role TEXT NOT NULL,
  industry TEXT,
  skills_required JSONB DEFAULT '[]'::jsonb,
  average_salary TEXT,
  career_progression_confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Career paths are publicly readable"
  ON public.career_paths
  FOR SELECT
  USING (true);
