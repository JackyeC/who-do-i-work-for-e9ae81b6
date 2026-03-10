
-- Drop all permissive ALL policies and create read-only ones

DO $$ BEGIN
  -- report_sections
  DROP POLICY IF EXISTS "Auth users manage sections" ON public.report_sections;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_sections' AND policyname='Read sections of published reports') THEN
    CREATE POLICY "Read sections of published reports" ON public.report_sections FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_claims  
  DROP POLICY IF EXISTS "Auth users manage claims" ON public.report_claims;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_claims' AND policyname='Read claims of published reports') THEN
    CREATE POLICY "Read claims of published reports" ON public.report_claims FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_evidence_links
  DROP POLICY IF EXISTS "Auth users manage evidence" ON public.report_evidence_links;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_evidence_links' AND policyname='Read evidence of published reports') THEN
    CREATE POLICY "Read evidence of published reports" ON public.report_evidence_links FOR SELECT TO authenticated, anon USING (claim_id IN (SELECT rc.id FROM public.report_claims rc WHERE rc.report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published')));
  END IF;

  -- report_entities
  DROP POLICY IF EXISTS "Auth users manage entities" ON public.report_entities;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_entities' AND policyname='Read entities of published reports') THEN
    CREATE POLICY "Read entities of published reports" ON public.report_entities FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_legislation
  DROP POLICY IF EXISTS "Auth users manage legislation" ON public.report_legislation;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_legislation' AND policyname='Read legislation of published reports') THEN
    CREATE POLICY "Read legislation of published reports" ON public.report_legislation FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_events
  DROP POLICY IF EXISTS "Auth users manage events" ON public.report_events;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_events' AND policyname='Read events of published reports') THEN
    CREATE POLICY "Read events of published reports" ON public.report_events FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_company_alignment
  DROP POLICY IF EXISTS "Auth users manage company alignment" ON public.report_company_alignment;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_company_alignment' AND policyname='Read alignment of published reports') THEN
    CREATE POLICY "Read alignment of published reports" ON public.report_company_alignment FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_actions
  DROP POLICY IF EXISTS "Auth users manage actions" ON public.report_actions;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_actions' AND policyname='Read actions of published reports') THEN
    CREATE POLICY "Read actions of published reports" ON public.report_actions FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- report_followups
  DROP POLICY IF EXISTS "Auth users manage followups" ON public.report_followups;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='report_followups' AND policyname='Read followups of published reports') THEN
    CREATE POLICY "Read followups of published reports" ON public.report_followups FOR SELECT TO authenticated, anon USING (report_id IN (SELECT id FROM public.policy_reports WHERE status = 'published'));
  END IF;

  -- scan_runs
  DROP POLICY IF EXISTS "Authenticated users can read scan runs" ON public.scan_runs;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='scan_runs' AND policyname='Users read scans for tracked companies') THEN
    CREATE POLICY "Users read scans for tracked companies" ON public.scan_runs FOR SELECT TO authenticated USING (
      company_id IN (SELECT company_id FROM public.tracked_companies WHERE user_id = auth.uid() AND is_active = true)
      OR company_id IN (SELECT company_id FROM public.user_company_watchlist WHERE user_id = auth.uid())
    );
  END IF;
END $$;
