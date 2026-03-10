
-- Tracked companies table for slot-based subscriptions
CREATE TABLE public.tracked_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  tracked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  untracked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.tracked_companies ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tracked companies
CREATE POLICY "Users can view own tracked companies"
  ON public.tracked_companies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own tracked companies
CREATE POLICY "Users can track companies"
  ON public.tracked_companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tracked companies (untrack)
CREATE POLICY "Users can update own tracked companies"
  ON public.tracked_companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tracked companies
CREATE POLICY "Users can delete own tracked companies"
  ON public.tracked_companies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookup
CREATE INDEX idx_tracked_companies_user_active ON public.tracked_companies(user_id, is_active) WHERE is_active = true;
