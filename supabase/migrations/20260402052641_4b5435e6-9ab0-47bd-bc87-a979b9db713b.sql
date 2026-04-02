
CREATE TABLE public.accountability_ingestion_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  source_tier INTEGER NOT NULL DEFAULT 1 CHECK (source_tier IN (1, 2)),
  signals_found INTEGER NOT NULL DEFAULT 0,
  signals_inserted INTEGER NOT NULL DEFAULT 0,
  raw_payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error', 'no_data')),
  error_message TEXT,
  ingested_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestion_log_company ON public.accountability_ingestion_log(company_id);
CREATE INDEX idx_ingestion_log_source ON public.accountability_ingestion_log(source_key);

ALTER TABLE public.accountability_ingestion_log ENABLE ROW LEVEL SECURITY;

-- Only admins can see ingestion logs
CREATE POLICY "Admins can view ingestion logs"
  ON public.accountability_ingestion_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert ingestion logs"
  ON public.accountability_ingestion_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also add a source_hash column to accountability_signals for deduplication
ALTER TABLE public.accountability_signals
  ADD COLUMN IF NOT EXISTS source_hash TEXT,
  ADD COLUMN IF NOT EXISTS ingestion_source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accountability_signals_source_hash
  ON public.accountability_signals(source_hash) WHERE source_hash IS NOT NULL;
