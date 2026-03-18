CREATE TABLE public.advisory_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'general',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.advisory_interest ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (lead capture)
CREATE POLICY "Anyone can submit interest" ON public.advisory_interest
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read interest" ON public.advisory_interest
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));