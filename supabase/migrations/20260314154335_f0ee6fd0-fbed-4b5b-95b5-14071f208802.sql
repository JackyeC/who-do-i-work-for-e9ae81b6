
-- Add beta_tester to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beta_tester';

-- Create beta feedback table
CREATE TABLE public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  page_url TEXT,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  message TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Logged-in users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Owner/admin can read all feedback
CREATE POLICY "Admins can read all feedback"
  ON public.beta_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'));
