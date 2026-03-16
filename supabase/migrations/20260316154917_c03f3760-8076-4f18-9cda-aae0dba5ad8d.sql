
-- Click tracking table for "Apply" button analytics
CREATE TABLE public.job_click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.company_jobs(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID,
  click_type TEXT NOT NULL DEFAULT 'apply',
  destination_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for analytics queries
CREATE INDEX idx_job_clicks_company ON public.job_click_events(company_id, created_at DESC);
CREATE INDEX idx_job_clicks_job ON public.job_click_events(job_id, created_at DESC);

-- RLS: anyone can insert (even anon for public job board), only admins read
ALTER TABLE public.job_click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log clicks" ON public.job_click_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read clicks" ON public.job_click_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
