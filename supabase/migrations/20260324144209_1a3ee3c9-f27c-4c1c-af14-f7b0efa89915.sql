CREATE TABLE IF NOT EXISTS public.briefing_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company text NOT NULL,
  signal_type text NOT NULL CHECK (signal_type IN ('red_flag','amber_flag','green_badge','info')),
  headline text NOT NULL,
  detail text,
  source_name text,
  source_url text,
  published_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.briefing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.briefing_items FOR SELECT USING (is_active = true);