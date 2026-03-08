ALTER TABLE public.executive_recipients 
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS committee_name text;