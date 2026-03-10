
-- User connections from LinkedIn CSV uploads
CREATE TABLE public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT,
  title TEXT,
  email TEXT,
  connection_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.user_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX idx_user_connections_company ON public.user_connections(company);

-- Connection to company mapping
CREATE TABLE public.connection_company_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.user_connections(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  match_confidence NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(connection_id, company_id)
);

ALTER TABLE public.connection_company_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connection maps"
  ON public.connection_company_map
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_connections uc
      WHERE uc.id = connection_id AND uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_connections uc
      WHERE uc.id = connection_id AND uc.user_id = auth.uid()
    )
  );

CREATE INDEX idx_connection_company_map_connection ON public.connection_company_map(connection_id);
CREATE INDEX idx_connection_company_map_company ON public.connection_company_map(company_id);
