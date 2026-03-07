
-- Extend profiles with resume/job fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS resume_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS target_job_titles text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS min_salary integer,
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Job match preferences table
CREATE TABLE public.job_match_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_key text NOT NULL,
  signal_label text NOT NULL,
  min_score integer DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, signal_key)
);

ALTER TABLE public.job_match_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON public.job_match_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.job_match_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.job_match_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON public.job_match_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Applications tracker table
CREATE TABLE public.applications_tracker (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  job_id uuid REFERENCES public.company_jobs(id),
  job_title text NOT NULL,
  company_name text NOT NULL,
  application_link text,
  status text NOT NULL DEFAULT 'Draft',
  alignment_score integer DEFAULT 0,
  matched_signals jsonb DEFAULT '[]',
  notes text,
  applied_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.applications_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own applications" ON public.applications_tracker
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.applications_tracker
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.applications_tracker
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own applications" ON public.applications_tracker
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_applications_tracker_updated_at
  BEFORE UPDATE ON public.applications_tracker
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
