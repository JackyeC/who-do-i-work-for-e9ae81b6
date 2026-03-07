
-- Entities table: canonical store for searched companies/orgs
CREATE TABLE public.pipeline_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  searched_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}'::TEXT[],
  parent_company TEXT,
  ticker TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(canonical_name)
);

-- Money In: donations, lobbying, PAC spending flowing into influence
CREATE TABLE public.pipeline_money_in (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.pipeline_entities(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  amount BIGINT,
  date DATE,
  filing_url TEXT,
  confidence_score NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Influence Network: people, committees, revolving door connections
CREATE TABLE public.pipeline_influence_network (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.pipeline_entities(id) ON DELETE CASCADE,
  node_name TEXT NOT NULL,
  node_type TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  related_to TEXT,
  source_url TEXT,
  confidence_score NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Benefits Out: contracts, grants, subsidies received
CREATE TABLE public.pipeline_benefits_out (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES public.pipeline_entities(id) ON DELETE CASCADE,
  benefit_type TEXT NOT NULL,
  description TEXT,
  amount BIGINT,
  agency TEXT,
  date DATE,
  source_url TEXT,
  confidence_score NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: all publicly readable
ALTER TABLE public.pipeline_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_money_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_influence_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_benefits_out ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pipeline entities are publicly readable" ON public.pipeline_entities FOR SELECT USING (true);
CREATE POLICY "Pipeline money_in is publicly readable" ON public.pipeline_money_in FOR SELECT USING (true);
CREATE POLICY "Pipeline influence_network is publicly readable" ON public.pipeline_influence_network FOR SELECT USING (true);
CREATE POLICY "Pipeline benefits_out is publicly readable" ON public.pipeline_benefits_out FOR SELECT USING (true);

-- Indexes for fast lookups
CREATE INDEX idx_pipeline_money_in_entity ON public.pipeline_money_in(entity_id);
CREATE INDEX idx_pipeline_network_entity ON public.pipeline_influence_network(entity_id);
CREATE INDEX idx_pipeline_benefits_entity ON public.pipeline_benefits_out(entity_id);
CREATE INDEX idx_pipeline_entities_canonical ON public.pipeline_entities(canonical_name);

-- Auto-update timestamp trigger
CREATE TRIGGER update_pipeline_entities_updated_at
  BEFORE UPDATE ON public.pipeline_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
