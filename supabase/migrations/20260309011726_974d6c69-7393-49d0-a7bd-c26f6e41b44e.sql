-- Create user_alignment_values table for Career Alignment Score
CREATE TABLE public.user_alignment_values (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Core values weights (0-100)
  pay_equity_weight integer NOT NULL DEFAULT 50,
  worker_protections_weight integer NOT NULL DEFAULT 50,
  ai_transparency_weight integer NOT NULL DEFAULT 50,
  benefits_quality_weight integer NOT NULL DEFAULT 50,
  organizational_affiliations_weight integer NOT NULL DEFAULT 50,
  government_contracts_weight integer NOT NULL DEFAULT 50,
  political_neutrality_weight integer NOT NULL DEFAULT 50,
  environmental_commitment_weight integer NOT NULL DEFAULT 50,
  dei_commitment_weight integer NOT NULL DEFAULT 50,
  veteran_support_weight integer NOT NULL DEFAULT 50,
  -- Career preferences
  preferred_industries text[] DEFAULT '{}',
  avoid_industries text[] DEFAULT '{}',
  min_civic_footprint_score integer DEFAULT 0,
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Ensure one profile per user
  CONSTRAINT user_alignment_values_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.user_alignment_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own alignment values"
  ON public.user_alignment_values
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alignment values"
  ON public.user_alignment_values
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alignment values"
  ON public.user_alignment_values
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alignment values"
  ON public.user_alignment_values
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_alignment_values_updated_at
  BEFORE UPDATE ON public.user_alignment_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();