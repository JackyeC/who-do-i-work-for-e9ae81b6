
CREATE TABLE public.eeoc_dropped_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  case_name TEXT NOT NULL,
  case_number TEXT,
  court_name TEXT,
  discrimination_type TEXT NOT NULL,
  discrimination_category TEXT NOT NULL DEFAULT 'gender_identity',
  eeoc_filing_date DATE,
  eeoc_drop_date DATE,
  action_type TEXT NOT NULL DEFAULT 'moved_to_dismiss',
  status TEXT NOT NULL DEFAULT 'dropped',
  state TEXT,
  summary TEXT,
  source_url TEXT,
  court_filing_url TEXT,
  eeoc_litigation_url TEXT,
  courtlistener_id TEXT,
  confidence TEXT NOT NULL DEFAULT 'high',
  detection_method TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eeoc_dropped_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read eeoc_dropped_cases" ON public.eeoc_dropped_cases
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage eeoc_dropped_cases" ON public.eeoc_dropped_cases
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.eeoc_dropped_cases;
