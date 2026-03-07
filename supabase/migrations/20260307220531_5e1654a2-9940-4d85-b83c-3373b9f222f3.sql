
CREATE TABLE public.scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_status text NOT NULL DEFAULT 'queued',
  triggered_by text NOT NULL DEFAULT 'user',
  scan_started_at timestamp with time zone NOT NULL DEFAULT now(),
  scan_completed_at timestamp with time zone,
  total_modules_run integer NOT NULL DEFAULT 0,
  modules_completed integer NOT NULL DEFAULT 0,
  modules_failed integer NOT NULL DEFAULT 0,
  modules_with_signals integer NOT NULL DEFAULT 0,
  modules_with_no_signals integer NOT NULL DEFAULT 0,
  total_sources_scanned integer NOT NULL DEFAULT 0,
  total_signals_found integer NOT NULL DEFAULT 0,
  module_statuses jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings text[] DEFAULT '{}'::text[],
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scan runs are publicly readable"
  ON public.scan_runs FOR SELECT
  USING (true);

CREATE INDEX idx_scan_runs_company_id ON public.scan_runs(company_id);
CREATE INDEX idx_scan_runs_status ON public.scan_runs(scan_status);
