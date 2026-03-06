
CREATE TABLE public.company_worker_sentiment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_type text NOT NULL DEFAULT 'firecrawl_ai',
  overall_rating numeric,
  ceo_approval numeric,
  recommend_to_friend numeric,
  work_life_balance numeric,
  compensation_rating numeric,
  culture_rating numeric,
  career_opportunities numeric,
  top_complaints jsonb DEFAULT '[]'::jsonb,
  top_praises jsonb DEFAULT '[]'::jsonb,
  hypocrisy_flags jsonb DEFAULT '[]'::jsonb,
  ai_summary text,
  sentiment text,
  sources jsonb DEFAULT '[]'::jsonb,
  raw_results jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_worker_sentiment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worker sentiment is publicly readable"
  ON public.company_worker_sentiment FOR SELECT
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.company_worker_sentiment;
