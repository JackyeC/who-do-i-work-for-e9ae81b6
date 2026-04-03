-- Stage 2 test seed data — not auto-executed
-- Run manually: psql -f supabase/seed/person-entity-test-data.sql

INSERT INTO public.people (full_name, slug, current_title, current_company, bio_summary, confidence_score)
VALUES
  ('Jane Doe', 'jane-doe', 'Chief People Officer', 'Acme Corp', 'Veteran HR executive with 20+ years in tech hiring.', 0.85),
  ('John Smith', 'john-smith', 'VP of Engineering', 'Beta Industries', 'Engineering leader focused on inclusive team building.', 0.72);

INSERT INTO public.person_sources (person_id, claim_key, claim_text, source_url, source_type, confidence_label)
VALUES
  ((SELECT id FROM public.people WHERE slug = 'jane-doe'), 'current_role', 'CPO at Acme Corp since 2021', 'https://example.com/profile', 'linkedin', 'verified'),
  ((SELECT id FROM public.people WHERE slug = 'jane-doe'), 'board_seat', 'Serves on TechForAll advisory board', NULL, 'manual', 'inferred'),
  ((SELECT id FROM public.people WHERE slug = 'john-smith'), 'current_role', 'VP Eng at Beta Industries', 'https://example.com/john', 'company_page', 'multi_source');

INSERT INTO public.entity_mentions (entity_type, entity_id, context_type, context_id, snippet)
VALUES
  ('person', (SELECT id FROM public.people WHERE slug = 'jane-doe'), 'company_executive', NULL, 'Jane Doe was named CPO in a press release dated March 2021.');
