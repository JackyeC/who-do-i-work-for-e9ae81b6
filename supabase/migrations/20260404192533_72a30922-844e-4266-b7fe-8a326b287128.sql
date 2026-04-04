
CREATE TABLE public.intelligence_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  location TEXT,
  job_posting_url TEXT,
  concerns TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.intelligence_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public lead capture form, no auth required)
CREATE POLICY "Anyone can submit intelligence requests"
  ON public.intelligence_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own requests
CREATE POLICY "Users can view own requests"
  ON public.intelligence_requests
  FOR SELECT
  USING (email = current_setting('request.headers')::json->>'x-user-email' OR user_id = auth.uid());

CREATE TRIGGER update_intelligence_requests_updated_at
  BEFORE UPDATE ON public.intelligence_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
