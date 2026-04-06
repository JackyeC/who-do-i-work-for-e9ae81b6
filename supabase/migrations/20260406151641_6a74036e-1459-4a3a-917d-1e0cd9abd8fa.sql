-- First deduplicate: keep newest row per headline
DELETE FROM public.work_news
WHERE id NOT IN (
  SELECT DISTINCT ON (headline) id
  FROM public.work_news
  ORDER BY headline, published_at DESC NULLS LAST
);

-- Now add the unique index on headline
CREATE UNIQUE INDEX IF NOT EXISTS work_news_headline_unique ON public.work_news (headline);

-- Add source bias columns (may already exist from partial migration)
ALTER TABLE public.work_news
  ADD COLUMN IF NOT EXISTS source_count_left integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_count_center integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_count_right integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_total integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poster_url text,
  ADD COLUMN IF NOT EXISTS drama_rating numeric NOT NULL DEFAULT 0;

-- wdiwf_news_cache dedup
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wdiwf_news_cache') THEN
    EXECUTE '
      DELETE FROM public.wdiwf_news_cache
      WHERE id NOT IN (
        SELECT DISTINCT ON (headline) id
        FROM public.wdiwf_news_cache
        ORDER BY headline, created_at DESC NULLS LAST
      )';
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS wdiwf_news_cache_headline_unique ON public.wdiwf_news_cache (headline)';
  END IF;
END $$;

-- Create poster_pool table
CREATE TABLE IF NOT EXISTS public.poster_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  poster_url text NOT NULL,
  headline_text text,
  subhead_text text,
  archetype text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.poster_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Poster pool is publicly readable"
  ON public.poster_pool FOR SELECT
  USING (true);