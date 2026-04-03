
-- Add domain provenance fields to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS domain_source text,
  ADD COLUMN IF NOT EXISTS domain_auto_filled boolean NOT NULL DEFAULT false;

-- Create domain review queue
CREATE TABLE IF NOT EXISTS public.domain_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  discovered_url text NOT NULL,
  discovered_domain text,
  confidence text NOT NULL DEFAULT 'low',
  source_method text NOT NULL,
  source_detail text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, discovered_url)
);

CREATE INDEX IF NOT EXISTS idx_domain_review_queue_status ON public.domain_review_queue (status);
CREATE INDEX IF NOT EXISTS idx_domain_review_queue_company ON public.domain_review_queue (company_id);

ALTER TABLE public.domain_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view domain review queue"
  ON public.domain_review_queue FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update domain review queue"
  ON public.domain_review_queue FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert domain review queue"
  ON public.domain_review_queue FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role needs insert access for the edge function
CREATE POLICY "Service role can insert domain review"
  ON public.domain_review_queue FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can select domain review"
  ON public.domain_review_queue FOR SELECT
  TO service_role
  USING (true);
