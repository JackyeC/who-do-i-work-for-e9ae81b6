
-- Signal Stories: the atomic unit of The Work Signal
CREATE TABLE public.signal_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  category TEXT NOT NULL DEFAULT 'daily_grind'
    CHECK (category IN ('c_suite', 'tech_stack', 'paycheck', 'fine_print', 'daily_grind')),
  signal_type TEXT NOT NULL DEFAULT 'developing'
    CHECK (signal_type IN ('breaking', 'developing', 'overnight')),
  headline TEXT NOT NULL,
  heat_level TEXT NOT NULL DEFAULT 'medium'
    CHECK (heat_level IN ('low', 'medium', 'high')),
  source_name TEXT,
  source_url TEXT,
  receipt TEXT,
  jrc_take TEXT,
  why_it_matters_applicants TEXT,
  why_it_matters_employees TEXT,
  why_it_matters_execs TEXT,
  before_you_say_yes TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'live')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live signal stories"
  ON public.signal_stories FOR SELECT
  USING (status = 'live');

CREATE POLICY "Admins can manage signal stories"
  ON public.signal_stories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_signal_stories_status_published
  ON public.signal_stories (status, published_at DESC);

CREATE INDEX idx_signal_stories_category
  ON public.signal_stories (category);

-- Daily Wraps
CREATE TABLE public.daily_wraps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wrap_date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'Today''s Work Signal',
  intro TEXT,
  top_signal_story_ids UUID[] DEFAULT '{}',
  summary_take TEXT,
  published_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'live')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_wraps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live daily wraps"
  ON public.daily_wraps FOR SELECT
  USING (status = 'live');

CREATE POLICY "Admins can manage daily wraps"
  ON public.daily_wraps FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Weekly Issues (Friday newsletter)
CREATE TABLE public.weekly_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_date DATE NOT NULL UNIQUE,
  subject_line_primary TEXT NOT NULL,
  subject_line_alternates TEXT[] DEFAULT '{}',
  intro TEXT,
  pattern_of_week TEXT,
  signal_story_ids UUID[] DEFAULT '{}',
  lead_circle_cta_title TEXT,
  lead_circle_cta_body TEXT,
  signoff TEXT DEFAULT 'See you Monday with the next Work Signal.',
  published_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'live')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live weekly issues"
  ON public.weekly_issues FOR SELECT
  USING (status = 'live');

CREATE POLICY "Admins can manage weekly issues"
  ON public.weekly_issues FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Promo Snippets
CREATE TABLE public.promo_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL
    CHECK (target_type IN ('signal_story', 'daily_wrap', 'weekly_issue')),
  target_id UUID NOT NULL,
  subject_lines TEXT[] DEFAULT '{}',
  push_lines TEXT[] DEFAULT '{}',
  social_hooks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promo snippets"
  ON public.promo_snippets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage promo snippets"
  ON public.promo_snippets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Timestamp triggers
CREATE TRIGGER update_signal_stories_updated_at
  BEFORE UPDATE ON public.signal_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_wraps_updated_at
  BEFORE UPDATE ON public.daily_wraps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_issues_updated_at
  BEFORE UPDATE ON public.weekly_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promo_snippets_updated_at
  BEFORE UPDATE ON public.promo_snippets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
