
-- Application document vault
CREATE TABLE public.application_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications_tracker(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  file_name TEXT NOT NULL DEFAULT 'Untitled',
  file_url TEXT,
  content_text TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_app_docs_application ON public.application_documents(application_id);
CREATE INDEX idx_app_docs_user ON public.application_documents(user_id);

-- RLS
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application documents"
  ON public.application_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own application documents"
  ON public.application_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own application documents"
  ON public.application_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own application documents"
  ON public.application_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_app_docs_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
