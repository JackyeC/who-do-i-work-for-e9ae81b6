
-- 1. Policy Reports (core report)
CREATE TABLE public.policy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  executive_summary TEXT,
  full_report_text TEXT,
  author_name TEXT NOT NULL DEFAULT 'Jackye Clayton',
  author_slug TEXT DEFAULT 'jackye-clayton',
  publication_date TIMESTAMPTZ,
  report_type TEXT NOT NULL DEFAULT 'intelligence_report',
  status TEXT NOT NULL DEFAULT 'draft',
  primary_issue_category TEXT,
  issue_categories_json JSONB DEFAULT '[]'::jsonb,
  confidence_level TEXT DEFAULT 'medium',
  verification_status TEXT DEFAULT 'analysis_with_linked_evidence',
  featured_image_url TEXT,
  hero_quote TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Report Sections
CREATE TABLE public.report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_order INTEGER NOT NULL DEFAULT 0,
  section_title TEXT NOT NULL,
  section_subtitle TEXT,
  section_summary TEXT,
  full_section_text TEXT,
  issue_category TEXT,
  confidence_level TEXT DEFAULT 'medium',
  verification_status TEXT DEFAULT 'analysis_with_linked_evidence',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Report Claims
CREATE TABLE public.report_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  claim_order INTEGER NOT NULL DEFAULT 0,
  claim_title TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'factual_claim',
  issue_category TEXT,
  confidence_level TEXT DEFAULT 'medium',
  verification_status TEXT DEFAULT 'analysis_with_linked_evidence',
  evidence_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Report Evidence Links
CREATE TABLE public.report_evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  claim_id UUID REFERENCES public.report_claims(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'news_report',
  source_url TEXT,
  source_title TEXT,
  source_description TEXT,
  evidence_excerpt TEXT,
  source_date DATE,
  verification_status TEXT DEFAULT 'unverified',
  confidence_score TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Report Entities
CREATE TABLE public.report_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  claim_id UUID REFERENCES public.report_claims(id) ON DELETE SET NULL,
  entity_id UUID,
  entity_name_snapshot TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'company',
  relationship_description TEXT,
  confidence_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Report Legislation
CREATE TABLE public.report_legislation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  bill_name TEXT NOT NULL,
  bill_number TEXT,
  legislative_body TEXT,
  jurisdiction TEXT,
  legislative_session TEXT,
  current_status TEXT,
  description TEXT,
  issue_category TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Report Events
CREATE TABLE public.report_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  event_title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'deadline',
  event_date DATE,
  end_date DATE,
  event_description TEXT,
  source_url TEXT,
  issue_category TEXT,
  confidence_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Report Company Alignment
CREATE TABLE public.report_company_alignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  entity_id UUID,
  entity_name_snapshot TEXT NOT NULL,
  alignment_theme TEXT,
  alignment_summary TEXT,
  dirty_receipt_label TEXT,
  evidence_note TEXT,
  issue_category TEXT,
  confidence_level TEXT DEFAULT 'medium',
  verification_status TEXT DEFAULT 'analysis_with_linked_evidence',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Report Actions
CREATE TABLE public.report_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  action_order INTEGER NOT NULL DEFAULT 0,
  action_title TEXT NOT NULL,
  action_description TEXT,
  action_type TEXT NOT NULL DEFAULT 'manual_review',
  related_entity_id UUID,
  related_issue_category TEXT,
  priority_level TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Report Follow-ups
CREATE TABLE public.report_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.policy_reports(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.report_sections(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority_level TEXT DEFAULT 'medium',
  related_issue_category TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.policy_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_legislation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_company_alignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_followups ENABLE ROW LEVEL SECURITY;

-- Public read access for published reports
CREATE POLICY "Anyone can read published reports" ON public.policy_reports FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can read sections of published reports" ON public.report_sections FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read claims of published reports" ON public.report_claims FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read evidence of published reports" ON public.report_evidence_links FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read entities of published reports" ON public.report_entities FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read legislation of published reports" ON public.report_legislation FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read events of published reports" ON public.report_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read alignment of published reports" ON public.report_company_alignment FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read actions of published reports" ON public.report_actions FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));
CREATE POLICY "Anyone can read followups of published reports" ON public.report_followups FOR SELECT USING (EXISTS (SELECT 1 FROM public.policy_reports WHERE id = report_id AND status = 'published'));

-- Authenticated users can manage all report tables (admin function)
CREATE POLICY "Auth users manage reports" ON public.policy_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage sections" ON public.report_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage claims" ON public.report_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage evidence" ON public.report_evidence_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage entities" ON public.report_entities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage legislation" ON public.report_legislation FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage events" ON public.report_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage alignment" ON public.report_company_alignment FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage actions" ON public.report_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage followups" ON public.report_followups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_policy_reports_slug ON public.policy_reports(slug);
CREATE INDEX idx_policy_reports_status ON public.policy_reports(status);
CREATE INDEX idx_policy_reports_issue ON public.policy_reports(primary_issue_category);
CREATE INDEX idx_report_sections_report ON public.report_sections(report_id);
CREATE INDEX idx_report_claims_report ON public.report_claims(report_id);
CREATE INDEX idx_report_claims_section ON public.report_claims(section_id);
CREATE INDEX idx_report_evidence_report ON public.report_evidence_links(report_id);
CREATE INDEX idx_report_evidence_claim ON public.report_evidence_links(claim_id);
CREATE INDEX idx_report_entities_report ON public.report_entities(report_id);
CREATE INDEX idx_report_entities_entity ON public.report_entities(entity_id);
CREATE INDEX idx_report_legislation_report ON public.report_legislation(report_id);
CREATE INDEX idx_report_events_report ON public.report_events(report_id);
CREATE INDEX idx_report_alignment_report ON public.report_company_alignment(report_id);
CREATE INDEX idx_report_alignment_entity ON public.report_company_alignment(entity_id);
CREATE INDEX idx_report_actions_report ON public.report_actions(report_id);
CREATE INDEX idx_report_followups_report ON public.report_followups(report_id);

-- Updated_at triggers
CREATE TRIGGER update_policy_reports_updated_at BEFORE UPDATE ON public.policy_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_sections_updated_at BEFORE UPDATE ON public.report_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_claims_updated_at BEFORE UPDATE ON public.report_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_legislation_updated_at BEFORE UPDATE ON public.report_legislation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_alignment_updated_at BEFORE UPDATE ON public.report_company_alignment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_followups_updated_at BEFORE UPDATE ON public.report_followups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
