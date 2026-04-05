CREATE TABLE public.nonprofit_dark_money (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ein TEXT NOT NULL,
  org_name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  ntee_code TEXT,
  total_revenue BIGINT,
  total_expenses BIGINT,
  total_assets BIGINT,
  total_contributions BIGINT,
  political_spending BIGINT,
  tax_period TEXT,
  form_type TEXT,
  filing_year INTEGER,
  ruling_date TEXT,
  raw_payload JSONB,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ein, filing_year)
);

ALTER TABLE public.nonprofit_dark_money ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read nonprofit data"
  ON public.nonprofit_dark_money
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage nonprofit data"
  ON public.nonprofit_dark_money
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_nonprofit_ein ON public.nonprofit_dark_money (ein);
CREATE INDEX idx_nonprofit_name ON public.nonprofit_dark_money USING gin (to_tsvector('english', org_name));
CREATE INDEX idx_nonprofit_state ON public.nonprofit_dark_money (state);
CREATE INDEX idx_nonprofit_political ON public.nonprofit_dark_money (political_spending DESC NULLS LAST) WHERE political_spending > 0;