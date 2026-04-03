
-- Create company_source_documents table
CREATE TABLE public.company_source_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  source_url TEXT NOT NULL,
  source_domain TEXT,
  published_date DATE,
  summary TEXT,
  why_it_matters TEXT,
  is_primary_source BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_company_source_documents_company_id ON public.company_source_documents(company_id);
CREATE INDEX idx_company_source_documents_type ON public.company_source_documents(document_type);

-- Enable RLS
ALTER TABLE public.company_source_documents ENABLE ROW LEVEL SECURITY;

-- Public read access (transparency data)
CREATE POLICY "Source documents are publicly readable"
  ON public.company_source_documents
  FOR SELECT
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated users can add source documents"
  ON public.company_source_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only admins can update
CREATE POLICY "Admins can update source documents"
  ON public.company_source_documents
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete source documents"
  ON public.company_source_documents
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
