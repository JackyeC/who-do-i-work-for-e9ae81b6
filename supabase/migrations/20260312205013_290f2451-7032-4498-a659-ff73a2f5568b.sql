
-- Add metadata fields to company_executives
ALTER TABLE public.company_executives
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add last_verified_at and source to board_members
ALTER TABLE public.board_members
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz DEFAULT now();

-- Create leadership_corrections table for user-submitted corrections
CREATE TABLE public.leadership_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  leader_name text NOT NULL,
  correction_type text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  evidence_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leadership_corrections ENABLE ROW LEVEL SECURITY;

-- Users can insert their own corrections
CREATE POLICY "Users can submit corrections"
  ON public.leadership_corrections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own corrections
CREATE POLICY "Users can view own corrections"
  ON public.leadership_corrections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
