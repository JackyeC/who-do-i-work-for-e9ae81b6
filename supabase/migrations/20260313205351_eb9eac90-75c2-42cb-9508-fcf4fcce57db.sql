-- Power Networks Archive: investigative dataset module

-- Dataset registry
CREATE TABLE public.power_network_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  source_type text NOT NULL DEFAULT 'official',
  source_url text,
  reliability_level text NOT NULL DEFAULT 'unverified',
  document_count integer DEFAULT 0,
  entity_count integer DEFAULT 0,
  last_synced_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ingested documents
CREATE TABLE public.power_network_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES public.power_network_datasets(id) ON DELETE CASCADE NOT NULL,
  external_doc_id text,
  title text NOT NULL,
  document_type text DEFAULT 'general',
  source_url text,
  content_text text,
  content_summary text,
  date_published date,
  date_ingested timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  has_redactions boolean DEFAULT false,
  page_count integer,
  search_vector tsvector,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pn_documents_dataset ON public.power_network_documents(dataset_id);
CREATE INDEX idx_pn_documents_search ON public.power_network_documents USING gin(search_vector);
CREATE INDEX idx_pn_documents_type ON public.power_network_documents(document_type);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION public.pn_documents_search_trigger()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public' AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content_text, '') || ' ' || COALESCE(NEW.content_summary, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER pn_documents_search_update
  BEFORE INSERT OR UPDATE ON public.power_network_documents
  FOR EACH ROW EXECUTE FUNCTION public.pn_documents_search_trigger();

-- Extracted entities
CREATE TABLE public.power_network_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  entity_type text NOT NULL,
  aliases text[] DEFAULT '{}',
  description text,
  is_victim boolean DEFAULT false,
  is_redacted boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  document_count integer DEFAULT 0,
  relationship_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pn_entities_type ON public.power_network_entities(entity_type);
CREATE INDEX idx_pn_entities_name ON public.power_network_entities(name);
CREATE INDEX idx_pn_entities_company ON public.power_network_entities(company_id) WHERE company_id IS NOT NULL;

-- Entity mentions in documents
CREATE TABLE public.power_network_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.power_network_entities(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.power_network_documents(id) ON DELETE CASCADE NOT NULL,
  context_snippet text,
  page_number integer,
  confidence numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, document_id)
);

CREATE INDEX idx_pn_mentions_entity ON public.power_network_mentions(entity_id);
CREATE INDEX idx_pn_mentions_document ON public.power_network_mentions(document_id);

-- Relationships between entities
CREATE TABLE public.power_network_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id uuid REFERENCES public.power_network_entities(id) ON DELETE CASCADE NOT NULL,
  target_entity_id uuid REFERENCES public.power_network_entities(id) ON DELETE CASCADE NOT NULL,
  relationship_type text NOT NULL,
  description text,
  date_observed date,
  confidence numeric DEFAULT 0.5,
  is_verified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pn_relationships_source ON public.power_network_relationships(source_entity_id);
CREATE INDEX idx_pn_relationships_target ON public.power_network_relationships(target_entity_id);
CREATE INDEX idx_pn_relationships_type ON public.power_network_relationships(relationship_type);

-- Evidence links
CREATE TABLE public.power_network_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid REFERENCES public.power_network_relationships(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.power_network_documents(id) ON DELETE CASCADE NOT NULL,
  excerpt text,
  page_reference text,
  source_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_pn_evidence_relationship ON public.power_network_evidence(relationship_id);
CREATE INDEX idx_pn_evidence_document ON public.power_network_evidence(document_id);

-- RLS
ALTER TABLE public.power_network_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_network_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_network_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_network_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_network_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_network_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read datasets" ON public.power_network_datasets FOR SELECT USING (true);
CREATE POLICY "Anyone can read documents" ON public.power_network_documents FOR SELECT USING (true);
CREATE POLICY "Anyone can read non-victim entities" ON public.power_network_entities FOR SELECT USING (is_victim = false AND is_redacted = false);
CREATE POLICY "Anyone can read mentions" ON public.power_network_mentions FOR SELECT USING (true);
CREATE POLICY "Anyone can read relationships" ON public.power_network_relationships FOR SELECT USING (true);
CREATE POLICY "Anyone can read evidence" ON public.power_network_evidence FOR SELECT USING (true);

CREATE POLICY "Admins can manage datasets" ON public.power_network_datasets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage documents" ON public.power_network_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage entities" ON public.power_network_entities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage mentions" ON public.power_network_mentions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage relationships" ON public.power_network_relationships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage evidence" ON public.power_network_evidence FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop old epstein tables
DROP TABLE IF EXISTS public.epstein_cross_references CASCADE;
DROP TABLE IF EXISTS public.epstein_persons CASCADE;