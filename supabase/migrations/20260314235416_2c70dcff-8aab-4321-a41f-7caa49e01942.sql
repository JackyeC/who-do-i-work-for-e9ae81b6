
CREATE TABLE public.leader_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL,
  leader_type TEXT NOT NULL DEFAULT 'executive',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  normalized_company_name TEXT,
  bio TEXT,
  education TEXT,
  career_highlights TEXT[],
  ai_narrative TEXT,
  photo_url TEXT,
  enrichment_source TEXT DEFAULT 'ai',
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(leader_id, leader_type)
);

ALTER TABLE public.leader_enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leader enrichments"
  ON public.leader_enrichments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage leader enrichments"
  ON public.leader_enrichments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
