-- Create jrc_stories table
CREATE TABLE public.jrc_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  headline_poster TEXT NOT NULL,
  headline_deck TEXT,
  summary_rich TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'daily_grind'
    CHECK (category IN ('c_suite', 'tech_stack', 'paycheck', 'fine_print', 'daily_grind')),
  heat_level TEXT NOT NULL DEFAULT 'footnote'
    CHECK (heat_level IN ('footnote', 'side_eye', 'screenshot', 'job_risk', 'exposed')),
  bias_source TEXT NOT NULL DEFAULT 'unclear'
    CHECK (bias_source IN ('corporate_optimism', 'workforce_sentiment', 'regulator_angle', 'investor_angle', 'unclear')),
  bias_jrc TEXT NOT NULL DEFAULT 'worker_impact'
    CHECK (bias_jrc IN ('executive_standard', 'brand_integrity', 'worker_impact', 'risk_management')),
  bias_confidence TEXT NOT NULL DEFAULT 'medium'
    CHECK (bias_confidence IN ('low', 'medium', 'high')),
  companies JSONB NOT NULL DEFAULT '[]'::jsonb,
  people JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_source_url TEXT NOT NULL,
  source_label TEXT NOT NULL,
  receipt_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  work_news_id UUID REFERENCES public.work_news(id),
  language TEXT NOT NULL DEFAULT 'en',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jrc_stories ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view published stories"
  ON public.jrc_stories
  FOR SELECT
  USING (true);

-- Admin write access via has_role
CREATE POLICY "Admins can manage stories"
  ON public.jrc_stories
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_jrc_stories_category ON public.jrc_stories(category);
CREATE INDEX idx_jrc_stories_heat_level ON public.jrc_stories(heat_level);
CREATE INDEX idx_jrc_stories_published_at ON public.jrc_stories(published_at DESC);
CREATE INDEX idx_jrc_stories_companies ON public.jrc_stories USING GIN(companies);
CREATE INDEX idx_jrc_stories_people ON public.jrc_stories USING GIN(people);

-- Timestamp trigger
CREATE TRIGGER update_jrc_stories_updated_at
  BEFORE UPDATE ON public.jrc_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();