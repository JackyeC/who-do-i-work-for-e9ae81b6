
CREATE TABLE public.scan_notify_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_notify_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request scan notifications"
ON public.scan_notify_requests
FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_scan_notify_pending ON public.scan_notify_requests (company_id, status) WHERE status = 'pending';
