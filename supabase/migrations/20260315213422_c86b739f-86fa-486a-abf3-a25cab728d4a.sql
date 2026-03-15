
-- Pending company reviews: AI-drafted research awaiting Jackye's approval
CREATE TABLE public.pending_company_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_email TEXT,
  requester_note TEXT,
  
  -- AI research output
  ai_summary TEXT,
  ai_leadership TEXT,
  ai_political_activity TEXT,
  ai_controversies TEXT,
  ai_citations TEXT[] DEFAULT '{}',
  ai_model_used TEXT,
  
  -- Jackye's edits
  jackye_take TEXT,
  
  -- Status flow: pending → reviewing → approved → published | rejected
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pending_reviews_status ON public.pending_company_reviews(status);
CREATE INDEX idx_pending_reviews_created ON public.pending_company_reviews(created_at DESC);

ALTER TABLE public.pending_company_reviews ENABLE ROW LEVEL SECURITY;

-- Public can insert (request a company)
CREATE POLICY "Authenticated users can request reviews"
  ON public.pending_company_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

-- Users can see their own requests
CREATE POLICY "Users can see own requests"
  ON public.pending_company_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = requested_by);

-- Admins can see and manage all
CREATE POLICY "Admins can manage all reviews"
  ON public.pending_company_reviews FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
