
-- Industry-to-congressional-topic mapping for smart company matching
CREATE TABLE IF NOT EXISTS public.industry_topic_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry text NOT NULL,
  topic_tag text NOT NULL,
  topic_keywords text[] NOT NULL DEFAULT '{}',
  UNIQUE(industry, topic_tag)
);

ALTER TABLE public.industry_topic_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read industry_topic_map"
  ON public.industry_topic_map FOR SELECT
  USING (true);

-- Seed mappings
INSERT INTO public.industry_topic_map (industry, topic_tag, topic_keywords) VALUES
  ('Technology', 'tech', ARRAY['ai', 'artificial intelligence', 'data privacy', 'algorithm', 'automation', 'semiconductor', 'cloud', 'software']),
  ('Technology', 'labor', ARRAY['layoff', 'workforce', 'remote work', 'h-1b', 'worker']),
  ('Financial Services', 'finance', ARRAY['sec', 'banking', 'wall street', 'fdic', 'cfpb', 'financial']),
  ('Aerospace & Defense', 'defense', ARRAY['defense', 'pentagon', 'military', 'dod', 'contract']),
  ('Healthcare', 'healthcare', ARRAY['healthcare', 'aca', 'medicare', 'medicaid', 'health insurance']),
  ('Pharmaceuticals', 'healthcare', ARRAY['drug pricing', 'fda', 'pharma', 'prescription']),
  ('Energy', 'energy', ARRAY['climate', 'epa', 'emissions', 'renewable', 'fossil fuel', 'oil', 'gas']),
  ('Retail', 'labor', ARRAY['minimum wage', 'worker', 'union', 'gig economy', 'overtime']),
  ('Manufacturing', 'labor', ARRAY['osha', 'safety', 'union', 'nlrb', 'tariff', 'trade']),
  ('Manufacturing', 'energy', ARRAY['emissions', 'epa', 'climate']),
  ('Telecommunications', 'tech', ARRAY['broadband', 'fcc', 'net neutrality', 'spectrum']),
  ('Media & Entertainment', 'tech', ARRAY['ai', 'copyright', 'streaming', 'content moderation']),
  ('Automotive', 'energy', ARRAY['ev', 'electric vehicle', 'emissions', 'nhtsa', 'fuel economy']),
  ('Automotive', 'labor', ARRAY['uaw', 'auto worker', 'union', 'manufacturing']),
  ('Automotive', 'tech', ARRAY['autonomous', 'self-driving', 'ai']),
  ('Consumer Goods', 'labor', ARRAY['supply chain', 'worker', 'minimum wage']),
  ('Semiconductors', 'tech', ARRAY['chips act', 'semiconductor', 'chip', 'fab', 'intel']),
  ('Consulting', 'labor', ARRAY['contractor', 'gig', 'outsourcing']),
  ('Consulting', 'tech', ARRAY['ai', 'automation', 'digital transformation'])
ON CONFLICT DO NOTHING;
