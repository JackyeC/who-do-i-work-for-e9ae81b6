
-- 1. Signal scan versions
CREATE TABLE public.company_signal_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_timestamp timestamptz NOT NULL DEFAULT now(),
  signal_category text NOT NULL,
  signal_type text NOT NULL,
  signal_value text,
  confidence_level text NOT NULL DEFAULT 'moderate_inference',
  source_url text,
  raw_excerpt text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signal_scans_company ON public.company_signal_scans(company_id);
CREATE INDEX idx_signal_scans_timestamp ON public.company_signal_scans(company_id, scan_timestamp DESC);
CREATE INDEX idx_signal_scans_category ON public.company_signal_scans(company_id, signal_category);

ALTER TABLE public.company_signal_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signal scans are publicly readable" ON public.company_signal_scans FOR SELECT USING (true);

-- 2. Signal change log
CREATE TABLE public.signal_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_timestamp timestamptz NOT NULL DEFAULT now(),
  signal_category text NOT NULL,
  change_type text NOT NULL,
  previous_value text,
  new_value text,
  confidence_change text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_change_log_company ON public.signal_change_log(company_id);
CREATE INDEX idx_change_log_timestamp ON public.signal_change_log(company_id, scan_timestamp DESC);

ALTER TABLE public.signal_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signal changes are publicly readable" ON public.signal_change_log FOR SELECT USING (true);

-- 3. User company watchlist
CREATE TABLE public.user_company_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  watch_timestamp timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_watchlist_user ON public.user_company_watchlist(user_id);
CREATE INDEX idx_watchlist_company ON public.user_company_watchlist(company_id);

ALTER TABLE public.user_company_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own watchlist" ON public.user_company_watchlist FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own watchlist" ON public.user_company_watchlist FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist" ON public.user_company_watchlist FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. User alerts
CREATE TABLE public.user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  signal_category text NOT NULL,
  change_description text NOT NULL,
  change_type text NOT NULL,
  date_detected timestamptz NOT NULL DEFAULT now(),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_user ON public.user_alerts(user_id, is_read);
CREATE INDEX idx_alerts_timestamp ON public.user_alerts(user_id, created_at DESC);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own alerts" ON public.user_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.user_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
