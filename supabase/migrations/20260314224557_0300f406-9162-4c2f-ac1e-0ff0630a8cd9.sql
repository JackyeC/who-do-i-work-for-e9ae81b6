
-- Narrative Power Intelligence Module
-- Maps who shapes narratives around companies, leaders, and industries
-- through PR firms, influencers, advocacy groups, think tanks, and media outlets.

CREATE TYPE public.narrative_signal_type AS ENUM (
  'influencer_campaign',
  'media_amplification',
  'pr_narrative_campaign',
  'advocacy_messaging',
  'propaganda_network'
);

CREATE TYPE public.narrative_actor_type AS ENUM (
  'company',
  'pr_firm',
  'pac',
  'advocacy_group',
  'media_organization',
  'influencer',
  'think_tank'
);

CREATE TYPE public.narrative_confidence AS ENUM (
  'verified',
  'investigative_reporting',
  'allegation'
);

CREATE TABLE public.narrative_power_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Signal classification
  signal_type narrative_signal_type NOT NULL,
  signal_title TEXT NOT NULL,
  
  -- Actor
  actor_name TEXT NOT NULL,
  actor_type narrative_actor_type NOT NULL,
  actor_description TEXT,
  
  -- Narrative target
  narrative_target TEXT NOT NULL,
  target_category TEXT NOT NULL DEFAULT 'public_opinion',
  
  -- Method
  narrative_method TEXT NOT NULL,
  
  -- Evidence
  evidence_source TEXT NOT NULL,
  evidence_description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  confidence_level narrative_confidence NOT NULL DEFAULT 'allegation',
  
  -- Dates
  date_range_start DATE,
  date_range_end DATE,
  
  -- Network mapping
  intermediaries TEXT[] DEFAULT '{}',
  narrative_chain TEXT,
  
  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_narrative_signals_company ON public.narrative_power_signals(company_id);
CREATE INDEX idx_narrative_signals_type ON public.narrative_power_signals(signal_type);
CREATE INDEX idx_narrative_signals_confidence ON public.narrative_power_signals(confidence_level);
CREATE INDEX idx_narrative_signals_actor ON public.narrative_power_signals(actor_type);

-- RLS: public read (public intelligence data), admin write
ALTER TABLE public.narrative_power_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for narrative_power_signals"
  ON public.narrative_power_signals
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admin insert for narrative_power_signals"
  ON public.narrative_power_signals
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin update for narrative_power_signals"
  ON public.narrative_power_signals
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin delete for narrative_power_signals"
  ON public.narrative_power_signals
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_narrative_power_signals_updated_at
  BEFORE UPDATE ON public.narrative_power_signals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
