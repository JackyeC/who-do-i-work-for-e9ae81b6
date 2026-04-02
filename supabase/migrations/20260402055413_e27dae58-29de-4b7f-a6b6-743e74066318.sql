CREATE TABLE public.jackye_contextual_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  take_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, section_key)
);

ALTER TABLE public.jackye_contextual_takes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read jackye takes"
  ON public.jackye_contextual_takes
  FOR SELECT
  TO anon, authenticated
  USING (true);