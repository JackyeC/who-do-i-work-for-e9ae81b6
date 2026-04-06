-- Table to store parsed congressional RSS feed items
CREATE TABLE public.congressional_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_feed TEXT NOT NULL, -- 'the_hill', 'politico', 'house_clerk'
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  published_at TIMESTAMPTZ,
  matched_company_ids UUID[] DEFAULT '{}',
  matched_keywords TEXT[] DEFAULT '{}',
  relevance_tags TEXT[] DEFAULT '{}',
  is_workplace_relevant BOOLEAN DEFAULT false,
  raw_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT congressional_news_source_url_key UNIQUE (source_url)
);

-- Enable RLS
ALTER TABLE public.congressional_news ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public government data)
CREATE POLICY "Congressional news is publicly readable"
  ON public.congressional_news FOR SELECT
  USING (true);

-- Admin-only write access
CREATE POLICY "Only admins can insert congressional news"
  ON public.congressional_news FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update congressional news"
  ON public.congressional_news FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for dossier lookups
CREATE INDEX idx_congressional_news_company_ids ON public.congressional_news USING GIN (matched_company_ids);
CREATE INDEX idx_congressional_news_published ON public.congressional_news (published_at DESC);
CREATE INDEX idx_congressional_news_relevance ON public.congressional_news USING GIN (relevance_tags);
CREATE INDEX idx_congressional_news_feed ON public.congressional_news (source_feed);

-- Auto-update timestamp
CREATE TRIGGER update_congressional_news_updated_at
  BEFORE UPDATE ON public.congressional_news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();