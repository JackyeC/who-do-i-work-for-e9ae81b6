
-- Create document type enum
CREATE TYPE public.document_type AS ENUM ('offer_letter', 'resume', 'job_description');

-- Create document status enum
CREATE TYPE public.document_status AS ENUM ('pending', 'parsing', 'parsed', 'error', 'deleted');

-- Create user_documents table
CREATE TABLE public.user_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.document_type NOT NULL,
  file_path TEXT NOT NULL,
  original_filename TEXT,
  parsed_summary JSONB DEFAULT '{}'::jsonb,
  parsed_signals JSONB DEFAULT '{}'::jsonb,
  confidence_level TEXT DEFAULT 'pending',
  status public.document_status DEFAULT 'pending',
  file_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_career_profile table
CREATE TABLE public.user_career_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  skills TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  seniority_level TEXT,
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  preferred_locations TEXT[] DEFAULT '{}',
  values_preferences JSONB DEFAULT '{}'::jsonb,
  job_titles TEXT[] DEFAULT '{}',
  management_scope TEXT,
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_alerts table
CREATE TABLE public.job_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.company_jobs(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'dream_job_match',
  match_score NUMERIC DEFAULT 0,
  match_details JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_career_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

-- user_documents RLS
CREATE POLICY "Users can insert own documents" ON public.user_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own documents" ON public.user_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.user_documents FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.user_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- user_career_profile RLS
CREATE POLICY "Users can insert own profile" ON public.user_career_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own profile" ON public.user_career_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_career_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- job_alerts RLS
CREATE POLICY "Users can view own alerts" ON public.job_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.job_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.job_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket for career documents
INSERT INTO storage.buckets (id, name, public) VALUES ('career_docs', 'career_docs', false);

-- Storage RLS: upload to own folder
CREATE POLICY "Users can upload own career docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'career_docs' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Storage RLS: view own docs
CREATE POLICY "Users can view own career docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'career_docs' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Storage RLS: delete own docs
CREATE POLICY "Users can delete own career docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'career_docs' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text));

-- Triggers for updated_at
CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON public.user_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_career_profile_updated_at BEFORE UPDATE ON public.user_career_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
