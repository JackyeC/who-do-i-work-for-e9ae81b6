
DROP POLICY IF EXISTS "Service role can upload poster images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update poster images" ON storage.objects;

CREATE POLICY "Only service role can upload poster images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'poster-images' AND (SELECT auth.role()) = 'service_role');

CREATE POLICY "Only service role can update poster images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'poster-images' AND (SELECT auth.role()) = 'service_role');
