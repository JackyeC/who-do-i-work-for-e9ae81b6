
-- Epstein Exposed: imported persons
CREATE TABLE public.epstein_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  aliases TEXT[],
  bio TEXT,
  tags TEXT[],
  black_book BOOLEAN DEFAULT false,
  stats JSONB,
  raw_data JSONB,
  imported_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Epstein Exposed: imported documents metadata
CREATE TABLE public.epstein_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT,
  source TEXT,
  category TEXT,
  linked_person_slugs TEXT[],
  summary TEXT,
  raw_data JSONB,
  imported_at TIMESTAMPTZ DEFAULT now()
);

-- Epstein Exposed: imported flights
CREATE TABLE public.epstein_flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  flight_date DATE,
  origin TEXT,
  destination TEXT,
  passengers JSONB,
  raw_data JSONB,
  imported_at TIMESTAMPTZ DEFAULT now()
);

-- Cross-reference results: links company executives/leaders to Epstein persons
CREATE TABLE public.epstein_cross_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  executive_id UUID REFERENCES public.company_executives(id) ON DELETE SET NULL,
  board_member_id UUID REFERENCES public.board_members(id) ON DELETE SET NULL,
  epstein_person_id UUID REFERENCES public.epstein_persons(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL DEFAULT 'name_match',
  match_confidence TEXT NOT NULL DEFAULT 'medium',
  match_details JSONB,
  connection_count INTEGER DEFAULT 0,
  flight_count INTEGER DEFAULT 0,
  document_count INTEGER DEFAULT 0,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_epstein_persons_name ON public.epstein_persons USING gin (to_tsvector('english', name));
CREATE INDEX idx_epstein_persons_category ON public.epstein_persons (category);
CREATE INDEX idx_epstein_cross_refs_company ON public.epstein_cross_references (company_id);
CREATE INDEX idx_epstein_cross_refs_person ON public.epstein_cross_references (epstein_person_id);
CREATE INDEX idx_epstein_documents_source ON public.epstein_documents (source);

-- RLS: These are public-interest data tables, readable by all authenticated users
ALTER TABLE public.epstein_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epstein_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epstein_flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epstein_cross_references ENABLE ROW LEVEL SECURITY;

-- Read policies for all authenticated users
CREATE POLICY "Authenticated users can read epstein_persons" ON public.epstein_persons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read epstein_documents" ON public.epstein_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read epstein_flights" ON public.epstein_flights FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read epstein_cross_references" ON public.epstein_cross_references FOR SELECT TO authenticated USING (true);

-- Write policies: admin/owner only
CREATE POLICY "Admins can manage epstein_persons" ON public.epstein_persons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Admins can manage epstein_documents" ON public.epstein_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Admins can manage epstein_flights" ON public.epstein_flights FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Admins can manage epstein_cross_references" ON public.epstein_cross_references FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));
