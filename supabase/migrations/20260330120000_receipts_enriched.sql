-- Create receipts_enriched table to store AI-generated Jackye content
CREATE TABLE IF NOT EXISTS public.receipts_enriched (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  work_news_id UUID NOT NULL REFERENCES public.work_news(id) ON DELETE CASCADE,
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
  jackye_take TEXT NOT NULL,
  debate_prompt TEXT NOT NULL,
  debate_sides TEXT[] NOT NULL DEFAULT '{}',
  receipt_connection TEXT NOT NULL,
  spice_level INTEGER NOT NULL CHECK (spice_level >= 1 AND spice_level <= 5),
  poster_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_receipts_enriched_work_news_id ON public.receipts_enriched(work_news_id);
CREATE INDEX IF NOT EXISTS idx_receipts_enriched_created_at ON public.receipts_enriched(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_enriched_spice_level ON public.receipts_enriched(spice_level DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_enriched_published_at ON public.receipts_enriched(published_at DESC);

-- RLS: public read, service-role write
ALTER TABLE public.receipts_enriched ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read receipts_enriched"
  ON public.receipts_enriched FOR SELECT
  TO anon, authenticated
  USING (true);

-- Schedule jackyefy-news to run every 2 hours at :45 past (15 min after sync-work-news at :30)
SELECT cron.schedule(
  'jackyefy-news-2h',
  '45 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tdetybqdxadmowjivtjy.supabase.co/functions/v1/jackyefy-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
