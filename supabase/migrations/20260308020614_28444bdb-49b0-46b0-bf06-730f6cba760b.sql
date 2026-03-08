
-- Add full_name and skills to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];

-- Add additional preference columns for values-based matching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_transparency_required BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pay_transparency_required BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS required_benefits TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_safety_score INTEGER DEFAULT 0;
