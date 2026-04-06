
CREATE TABLE public.interview_prep_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT,
  intel_summary TEXT NOT NULL,
  checklist JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_prep_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own briefs"
  ON public.interview_prep_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own briefs"
  ON public.interview_prep_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefs"
  ON public.interview_prep_briefs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_interview_prep_briefs_user_id ON public.interview_prep_briefs (user_id, created_at DESC);
