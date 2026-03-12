
CREATE TABLE public.signal_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT NOT NULL,
  signal_id TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT
);

ALTER TABLE public.signal_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own disputes"
  ON public.signal_disputes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own disputes"
  ON public.signal_disputes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
