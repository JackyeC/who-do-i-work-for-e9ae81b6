
CREATE TABLE public.entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_entity_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  related_entity_name text NOT NULL,
  relationship_type text NOT NULL DEFAULT 'alias',
  source_url text,
  confidence_score numeric NOT NULL DEFAULT 0.5,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_relationship_type CHECK (relationship_type IN (
    'parent_company', 'subsidiary', 'brand_name', 'pac_name',
    'trade_association', 'affiliate', 'executive_linked_entity',
    'alias', 'legal_variant', 'ticker'
  )),
  CONSTRAINT unique_entity_relationship UNIQUE (primary_entity_id, related_entity_name, relationship_type)
);

CREATE INDEX idx_entity_relationships_company ON public.entity_relationships(primary_entity_id);
CREATE INDEX idx_entity_relationships_name ON public.entity_relationships(related_entity_name);

ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entity relationships are publicly readable"
  ON public.entity_relationships FOR SELECT
  USING (true);

ALTER TABLE public.entity_linkages
  ADD COLUMN IF NOT EXISTS matched_entity_name text,
  ADD COLUMN IF NOT EXISTS matched_entity_type text,
  ADD COLUMN IF NOT EXISTS original_source_query text;

ALTER TABLE public.scan_runs
  ADD COLUMN IF NOT EXISTS entity_resolution_log jsonb DEFAULT '{}'::jsonb;
