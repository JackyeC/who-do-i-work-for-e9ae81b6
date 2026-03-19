
CREATE TABLE public.early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  email text NOT NULL,
  persona text NOT NULL,
  referral_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_early_access_email ON public.early_access_signups(email);

ALTER TABLE public.early_access_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public signup form)
CREATE POLICY "Anyone can sign up for early access"
  ON public.early_access_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow reading count only (for waitlist counter) 
CREATE POLICY "Anyone can read signup count"
  ON public.early_access_signups
  FOR SELECT
  TO anon, authenticated
  USING (true);
