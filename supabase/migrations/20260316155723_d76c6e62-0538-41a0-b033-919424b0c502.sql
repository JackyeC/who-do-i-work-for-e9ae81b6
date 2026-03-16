
-- Insider Testimonials: "I Work Here & Love It"
CREATE TABLE public.insider_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  testimonial_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  CONSTRAINT testimonial_length CHECK (char_length(testimonial_text) BETWEEN 10 AND 280)
);

ALTER TABLE public.insider_testimonials ENABLE ROW LEVEL SECURITY;

-- Users can insert their own testimonials
CREATE POLICY "Users can submit testimonials"
  ON public.insider_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own testimonials
CREATE POLICY "Users can view own testimonials"
  ON public.insider_testimonials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can view approved testimonials
CREATE POLICY "Anyone can view approved testimonials"
  ON public.insider_testimonials FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Admins can update testimonial status
CREATE POLICY "Admins can manage testimonials"
  ON public.insider_testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Dream Job Requests
CREATE TABLE public.dream_job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_role TEXT NOT NULL,
  dream_company_name TEXT NOT NULL,
  matched_company_id UUID REFERENCES public.companies(id),
  intelligence_status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dream_job_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit dream jobs"
  ON public.dream_job_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own dream jobs"
  ON public.dream_job_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all dream jobs"
  ON public.dream_job_requests FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dream jobs"
  ON public.dream_job_requests FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
