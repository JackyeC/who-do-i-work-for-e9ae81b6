
-- Insider trading signals from SEC Form 4
CREATE TABLE public.insider_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  filer_name TEXT NOT NULL,
  filer_title TEXT,
  transaction_type TEXT NOT NULL DEFAULT 'sale',
  transaction_date DATE,
  shares_traded BIGINT,
  price_per_share NUMERIC(12,2),
  total_value NUMERIC(14,2),
  shares_owned_after BIGINT,
  sec_filing_url TEXT,
  form_type TEXT DEFAULT '4',
  is_10b5_plan BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insider_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insider trades" ON public.insider_trades FOR SELECT USING (true);

-- GDELT news sentiment signals
CREATE TABLE public.company_news_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  headline TEXT NOT NULL,
  source_name TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  sentiment_score NUMERIC(4,2),
  tone_label TEXT,
  themes TEXT[],
  is_controversy BOOLEAN DEFAULT false,
  controversy_type TEXT,
  gdelt_doc_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_news_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news signals" ON public.company_news_signals FOR SELECT USING (true);

CREATE INDEX idx_insider_trades_company ON public.insider_trades(company_id);
CREATE INDEX idx_news_signals_company ON public.company_news_signals(company_id);
CREATE INDEX idx_news_signals_controversy ON public.company_news_signals(company_id, is_controversy) WHERE is_controversy = true;
