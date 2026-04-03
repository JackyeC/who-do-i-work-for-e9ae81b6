
-- Remove duplicate headlines, keeping the most recent row
DELETE FROM public.work_news a
USING public.work_news b
WHERE a.id < b.id AND a.headline = b.headline;

-- Now add the unique constraint
ALTER TABLE public.work_news DROP CONSTRAINT IF EXISTS work_news_headline_unique;
ALTER TABLE public.work_news DROP CONSTRAINT IF EXISTS work_news_headline_unique;
ALTER TABLE public.work_news ADD CONSTRAINT work_news_headline_unique UNIQUE (headline);
