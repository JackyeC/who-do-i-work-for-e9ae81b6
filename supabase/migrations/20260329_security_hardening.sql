-- ============================================================
-- WDIWF Security Hardening — Pre-Launch Sweep
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. BATTLE-IMAGES BUCKET: Lock down uploads to authenticated users only
-- Drop any overly permissive insert/update policies
DROP POLICY IF EXISTS "Allow public uploads to battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow update to battle-images" ON storage.objects;

-- Keep public READ (battle images are displayed on compare pages)
-- But restrict WRITE to authenticated users only
CREATE POLICY "authenticated users upload battle images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'battle-images');

CREATE POLICY "authenticated users update battle images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'battle-images')
WITH CHECK (bucket_id = 'battle-images');

-- Prevent deletion by non-service-role users
CREATE POLICY "only service role deletes battle images"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id = 'battle-images');


-- 2. COMPENSATION_DATA: Restrict anonymous access
-- Public salary benchmarks are part of the product, but anon users
-- should only see aggregated/non-sensitive rows. For now, restrict
-- to authenticated users only.
DROP POLICY IF EXISTS "Anyone can read compensation data" ON public.compensation_data;
DROP POLICY IF EXISTS "Allow read access to compensation_data" ON public.compensation_data;

CREATE POLICY "authenticated users read compensation data"
ON public.compensation_data FOR SELECT TO authenticated
USING (true);

-- Service role can still manage all data
-- (This policy likely already exists, but ensure it does)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'compensation_data'
      AND policyname = 'service role manages compensation data'
  ) THEN
    EXECUTE 'CREATE POLICY "service role manages compensation data"
      ON public.compensation_data FOR ALL TO service_role
      USING (true) WITH CHECK (true)';
  END IF;
END $$;


-- 3. REALTIME: Ensure user_alerts topic isolation
-- The user_alerts table already has proper user-scoped RLS.
-- This is a reminder: if you use Realtime broadcast for alerts,
-- subscribe on per-user topics like "alerts:<user_id>" on the client.
-- No SQL change needed here — the RLS already restricts reads.


-- 4. VERIFY: Quick audit of remaining broad policies
-- Run this SELECT after applying the above to see what's left:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE (qual = 'true' OR with_check = 'true')
--   AND schemaname IN ('public', 'storage')
--   AND NOT (roles @> ARRAY['service_role'])
-- ORDER BY schemaname, tablename;
