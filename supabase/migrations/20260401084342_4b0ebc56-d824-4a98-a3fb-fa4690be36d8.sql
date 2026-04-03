
-- Enable RLS on nickname_mappings
ALTER TABLE public.nickname_mappings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read nickname mappings (reference data)
CREATE POLICY "Anyone can read nickname mappings"
ON public.nickname_mappings
FOR SELECT
TO anon, authenticated
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage nickname mappings"
ON public.nickname_mappings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Move extension to extensions schema (drop from public, recreate in extensions)
DROP EXTENSION IF EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch SCHEMA extensions;
