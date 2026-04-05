CREATE TABLE public.wdiwf_quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  slider_value INTEGER,
  result_profile TEXT NOT NULL,
  result_secondary TEXT,
  scores JSONB,
  meta_flags JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wdiwf_quiz_results ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated users can insert their own results
CREATE POLICY "Allow public quiz result insert"
  ON public.wdiwf_quiz_results
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read all results
CREATE POLICY "Admin can read quiz results"
  ON public.wdiwf_quiz_results
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_quiz_results_profile ON public.wdiwf_quiz_results (result_profile);
CREATE INDEX idx_quiz_results_submitted ON public.wdiwf_quiz_results (submitted_at DESC);