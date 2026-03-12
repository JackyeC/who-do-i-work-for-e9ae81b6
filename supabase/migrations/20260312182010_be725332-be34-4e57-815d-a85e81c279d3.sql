
-- Add new columns to company_warn_notices for freshness-first pipeline
ALTER TABLE public.company_warn_notices
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS reason_type text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS public_announcement_date date,
  ADD COLUMN IF NOT EXISTS support_services_mentioned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_services_coordinator text,
  ADD COLUMN IF NOT EXISTS workforce_board_referenced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS employer_name_raw text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS industry text;

-- Add comment explaining source_type values
COMMENT ON COLUMN public.company_warn_notices.source_type IS 'official_state_warn, structured_open_data, big_local_news, news_report, sec_8k, firecrawl_search';
COMMENT ON COLUMN public.company_warn_notices.reason_type IS 'official_warn_reason, reported_reason, not_stated';

-- Create WARN sync log table to track freshness
CREATE TABLE IF NOT EXISTS public.warn_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_url text,
  source_type text NOT NULL,
  state text,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  records_fetched integer DEFAULT 0,
  records_inserted integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for warn_sync_log (public read)
ALTER TABLE public.warn_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read warn sync log"
  ON public.warn_sync_log FOR SELECT
  TO authenticated, anon
  USING (true);

-- Create index for faster recent-first queries
CREATE INDEX IF NOT EXISTS idx_warn_notices_notice_date_desc
  ON public.company_warn_notices (notice_date DESC);

CREATE INDEX IF NOT EXISTS idx_warn_notices_source_type
  ON public.company_warn_notices (source_type);

CREATE INDEX IF NOT EXISTS idx_warn_sync_log_last_synced
  ON public.warn_sync_log (last_synced_at DESC);
