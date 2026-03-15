
-- Work News: global workforce intelligence feed powered by GDELT
CREATE TABLE public.work_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  sentiment_score NUMERIC,
  tone_label TEXT,
  themes TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  is_controversy BOOLEAN DEFAULT false,
  controversy_type TEXT,
  jackye_take TEXT,
  jackye_take_approved BOOLEAN DEFAULT false,
  gdelt_url_hash TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_work_news_published ON public.work_news(published_at DESC);
CREATE INDEX idx_work_news_category ON public.work_news(category);
CREATE INDEX idx_work_news_controversy ON public.work_news(is_controversy) WHERE is_controversy = true;

-- RLS: public read, service-role write
ALTER TABLE public.work_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read work_news"
  ON public.work_news FOR SELECT
  TO anon, authenticated
  USING (true);
