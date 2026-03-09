
-- Fix 1: career_contacts - restrict to record creator only
DROP POLICY IF EXISTS "Career contacts are publicly readable" ON public.career_contacts;
CREATE POLICY "Users can read own contacts" ON public.career_contacts
  FOR SELECT TO authenticated USING (auth.uid() = created_by);

-- Fix 2: scan_runs - restrict to authenticated users only (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scan_runs') THEN
    -- Drop overly permissive policies
    DROP POLICY IF EXISTS "Scan runs are publicly readable" ON public.scan_runs;
    -- Add authenticated-only read
    EXECUTE 'CREATE POLICY "Authenticated users can read scan runs" ON public.scan_runs FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- Fix 3: browse_ai_monitors - restrict to authenticated users only
DROP POLICY IF EXISTS "Browse AI monitors are publicly readable" ON public.browse_ai_monitors;
CREATE POLICY "Authenticated users can read monitors" ON public.browse_ai_monitors
  FOR SELECT TO authenticated USING (true);

-- Fix 4: Fix overly permissive INSERT/UPDATE policies
-- Check and fix career_contacts insert/update
DROP POLICY IF EXISTS "Anyone can insert career contacts" ON public.career_contacts;
DROP POLICY IF EXISTS "Anyone can update career contacts" ON public.career_contacts;
CREATE POLICY "Users can insert own contacts" ON public.career_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own contacts" ON public.career_contacts
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
