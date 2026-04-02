
-- Company Ingestion Queue
CREATE TABLE public.company_ingestion_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_family TEXT NOT NULL CHECK (source_family IN ('sec', 'fec', 'osha', 'warn', 'news', 'careers')),
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 3),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_family)
);

ALTER TABLE public.company_ingestion_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ingestion queue"
  ON public.company_ingestion_queue FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_ingestion_queue_next_run ON public.company_ingestion_queue(next_run_at) WHERE status != 'processing';
CREATE INDEX idx_ingestion_queue_company ON public.company_ingestion_queue(company_id);

-- Company Coverage Summary
CREATE TABLE public.company_coverage_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_family TEXT NOT NULL CHECK (source_family IN ('sec', 'fec', 'osha', 'warn', 'news', 'careers', 'nlrb', 'bls')),
  signal_count INTEGER NOT NULL DEFAULT 0,
  last_signal_date TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  coverage_status TEXT NOT NULL DEFAULT 'never_checked' CHECK (coverage_status IN ('rich', 'limited', 'no_trail', 'never_checked')),
  summary_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, source_family)
);

ALTER TABLE public.company_coverage_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read coverage summary"
  ON public.company_coverage_summary FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_coverage_summary_company ON public.company_coverage_summary(company_id);

-- Company Careers Signals
CREATE TABLE public.company_careers_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_job_count INTEGER,
  benefits_mentioned JSONB DEFAULT '[]'::jsonb,
  dei_language_score NUMERIC,
  remote_policy TEXT,
  perks_vs_substance NUMERIC,
  raw_text_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_careers_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read careers signals"
  ON public.company_careers_signals FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_careers_signals_company ON public.company_careers_signals(company_id);

-- Trigger to auto-upsert into ingestion queue when a company is added to watchlist
CREATE OR REPLACE FUNCTION public.enqueue_watched_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.company_ingestion_queue (company_id, source_family, priority, next_run_at)
  VALUES
    (NEW.company_id, 'sec', 1, now()),
    (NEW.company_id, 'fec', 1, now()),
    (NEW.company_id, 'osha', 1, now()),
    (NEW.company_id, 'warn', 1, now()),
    (NEW.company_id, 'news', 1, now()),
    (NEW.company_id, 'careers', 1, now())
  ON CONFLICT (company_id, source_family) DO UPDATE SET
    priority = LEAST(EXCLUDED.priority, company_ingestion_queue.priority),
    next_run_at = LEAST(EXCLUDED.next_run_at, company_ingestion_queue.next_run_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enqueue_watched_company
  AFTER INSERT ON public.user_company_watchlist
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_watched_company();

-- Update timestamps triggers
CREATE TRIGGER update_ingestion_queue_updated_at
  BEFORE UPDATE ON public.company_ingestion_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coverage_summary_updated_at
  BEFORE UPDATE ON public.company_coverage_summary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_careers_signals_updated_at
  BEFORE UPDATE ON public.company_careers_signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
