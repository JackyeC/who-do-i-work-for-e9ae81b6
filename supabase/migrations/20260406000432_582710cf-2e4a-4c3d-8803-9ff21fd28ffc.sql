
INSERT INTO storage.buckets (id, name, public)
VALUES ('poster-images', 'poster-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Poster images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'poster-images');

CREATE POLICY "Service role can upload poster images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'poster-images');

CREATE POLICY "Service role can update poster images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'poster-images');
