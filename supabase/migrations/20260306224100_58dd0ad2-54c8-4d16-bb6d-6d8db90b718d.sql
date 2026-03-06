
CREATE TABLE public.social_media_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_type text NOT NULL DEFAULT 'web_search',
  query_used text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_summary text,
  sentiment text,
  contradictions jsonb DEFAULT '[]'::jsonb,
  personnel_changes jsonb DEFAULT '[]'::jsonb,
  stance_shifts jsonb DEFAULT '[]'::jsonb,
  sources jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_media_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Social media scans are publicly readable"
  ON public.social_media_scans
  FOR SELECT
  USING (true);
