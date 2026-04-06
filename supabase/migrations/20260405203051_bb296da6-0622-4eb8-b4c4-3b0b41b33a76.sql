
CREATE TABLE public.user_recent_company_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_recent_company_views_unique ON public.user_recent_company_views (user_id, company_id);
CREATE INDEX idx_user_recent_company_views_user ON public.user_recent_company_views (user_id, viewed_at DESC);

ALTER TABLE public.user_recent_company_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recent views"
  ON public.user_recent_company_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own views"
  ON public.user_recent_company_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own views"
  ON public.user_recent_company_views FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
