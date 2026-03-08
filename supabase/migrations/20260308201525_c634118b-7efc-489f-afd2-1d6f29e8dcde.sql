
ALTER TABLE public.user_career_profile
  ADD COLUMN IF NOT EXISTS preferred_work_mode text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_titles text[] DEFAULT '{}'::text[];
