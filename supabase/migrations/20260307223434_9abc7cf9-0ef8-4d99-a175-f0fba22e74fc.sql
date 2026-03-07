
CREATE TABLE public.offer_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sections_included TEXT[] NOT NULL DEFAULT '{}',
  signals_count INTEGER NOT NULL DEFAULT 0,
  stale_sections_count INTEGER NOT NULL DEFAULT 0,
  report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  share_metadata JSONB DEFAULT '{}'::jsonb,
  is_saved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_checks ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own offer checks
CREATE POLICY "Users can read own offer checks"
  ON public.offer_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can insert their own offer checks
CREATE POLICY "Users can insert own offer checks"
  ON public.offer_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anyone can update their own offer checks
CREATE POLICY "Users can update own offer checks"
  ON public.offer_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Anyone can delete their own offer checks
CREATE POLICY "Users can delete own offer checks"
  ON public.offer_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous reads for shared offer checks (via share links)
CREATE POLICY "Shared offer checks are publicly readable"
  ON public.offer_checks FOR SELECT
  TO anon
  USING ((share_metadata->>'is_shared')::boolean = true);

-- Trigger for updated_at
CREATE TRIGGER set_offer_checks_updated_at
  BEFORE UPDATE ON public.offer_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
