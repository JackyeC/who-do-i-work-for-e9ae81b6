
-- Pipeline observability table
CREATE TABLE public.pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  articles_processed integer DEFAULT 0,
  articles_failed integer DEFAULT 0,
  error_message text,
  status text NOT NULL DEFAULT 'running',
  metadata jsonb
);

-- Allow public read (no auth needed for internal monitoring)
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pipeline runs"
  ON public.pipeline_runs FOR SELECT
  USING (true);

-- Dedup guard: prevent duplicate receipts for the same work_news story
ALTER TABLE public.receipts_enriched
  ADD CONSTRAINT receipts_enriched_work_news_id_unique UNIQUE (work_news_id);
