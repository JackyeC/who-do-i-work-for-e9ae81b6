
CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  current_title text,
  current_company text,
  bio_summary text,
  image_url text,
  location text,
  prior_roles jsonb DEFAULT '[]'::jsonb,
  board_roles jsonb DEFAULT '[]'::jsonb,
  advisory_roles jsonb DEFAULT '[]'::jsonb,
  political_donation_total bigint DEFAULT 0,
  confidence_score real DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.person_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  claim_key text NOT NULL,
  claim_text text,
  source_url text,
  source_type text,
  confidence_label text NOT NULL DEFAULT 'no_evidence'
    CHECK (confidence_label IN ('verified', 'multi_source', 'inferred', 'no_evidence')),
  collected_at timestamptz DEFAULT now()
);

CREATE TABLE public.entity_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  context_type text,
  context_id uuid,
  snippet text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "People are publicly readable"
  ON public.people FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Person sources are publicly readable"
  ON public.person_sources FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Entity mentions are publicly readable"
  ON public.entity_mentions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can insert people"
  ON public.people FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update people"
  ON public.people FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete people"
  ON public.people FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert person sources"
  ON public.person_sources FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update person sources"
  ON public.person_sources FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete person sources"
  ON public.person_sources FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert entity mentions"
  ON public.entity_mentions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update entity mentions"
  ON public.entity_mentions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete entity mentions"
  ON public.entity_mentions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_people_full_name ON public.people(full_name);
CREATE INDEX idx_person_sources_person_id ON public.person_sources(person_id);

CREATE TRIGGER set_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
