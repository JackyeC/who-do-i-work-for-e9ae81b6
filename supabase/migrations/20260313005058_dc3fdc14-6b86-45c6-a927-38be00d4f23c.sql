CREATE TABLE public.email_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public signup form)
CREATE POLICY "Anyone can sign up" ON public.email_signups
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read signups
CREATE POLICY "Admins can read signups" ON public.email_signups
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));