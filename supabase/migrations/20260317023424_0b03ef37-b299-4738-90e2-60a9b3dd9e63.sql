
-- 1) Community-sourced record updates
CREATE TABLE public.community_record_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'correction',
  evidence_url TEXT,
  evidence_description TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'pending_audit',
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_record_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own record updates"
  ON public.community_record_updates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own record updates"
  ON public.community_record_updates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all record updates"
  ON public.community_record_updates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Employer rebuttals
CREATE TABLE public.employer_rebuttals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  submitted_by_email TEXT NOT NULL,
  rebuttal_text TEXT NOT NULL,
  evidence_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review',
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_rebuttals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert rebuttals"
  ON public.employer_rebuttals FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can view approved rebuttals"
  ON public.employer_rebuttals FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Admins can manage all rebuttals"
  ON public.employer_rebuttals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Add last_audited_at to companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS last_audited_at TIMESTAMPTZ;
