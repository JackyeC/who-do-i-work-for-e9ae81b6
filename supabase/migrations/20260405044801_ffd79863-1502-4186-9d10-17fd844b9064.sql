
CREATE TABLE public.federal_register_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  document_number TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'rule',
  title TEXT NOT NULL,
  abstract TEXT,
  agency_names TEXT[] DEFAULT '{}',
  publication_date DATE,
  effective_date DATE,
  html_url TEXT,
  pdf_url TEXT,
  matched_issue_codes TEXT[] DEFAULT '{}',
  relevance_score NUMERIC DEFAULT 0,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, document_number)
);

ALTER TABLE public.federal_register_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Federal register rules are publicly readable"
  ON public.federal_register_rules
  FOR SELECT
  USING (true);

CREATE INDEX idx_federal_register_company ON public.federal_register_rules(company_id);
CREATE INDEX idx_federal_register_pubdate ON public.federal_register_rules(publication_date DESC);
CREATE INDEX idx_federal_register_doctype ON public.federal_register_rules(document_type);
CREATE INDEX idx_federal_register_issues ON public.federal_register_rules USING GIN(matched_issue_codes);
