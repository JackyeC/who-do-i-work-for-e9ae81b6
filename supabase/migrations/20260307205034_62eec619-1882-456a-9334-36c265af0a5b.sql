
CREATE TABLE public.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  company_profile_url text,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  issue_type text NOT NULL DEFAULT 'data_error',
  description text NOT NULL,
  source_links text[] DEFAULT '{}',
  review_status text NOT NULL DEFAULT 'new',
  reviewer_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.correction_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a correction
CREATE POLICY "Anyone can submit corrections"
  ON public.correction_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Submitters cannot read/update/delete - admin only via service role
