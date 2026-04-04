-- Add Dream Job Profile columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dream_job_profile jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dream_job_profile_version integer DEFAULT 0;

-- Index for efficient lookups on profiles with a dream job profile set
CREATE INDEX IF NOT EXISTS idx_profiles_dream_job_profile_not_null
  ON public.profiles (id)
  WHERE dream_job_profile IS NOT NULL;