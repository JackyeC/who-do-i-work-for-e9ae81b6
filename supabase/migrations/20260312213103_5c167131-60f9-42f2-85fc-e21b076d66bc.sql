
-- Offer records: persists parsed offer data
CREATE TABLE public.offer_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  company_name TEXT NOT NULL,
  role_title TEXT,
  location TEXT,
  years_experience TEXT,
  parsed_fields JSONB DEFAULT '{}'::jsonb,
  red_flags JSONB DEFAULT '[]'::jsonb,
  green_flags JSONB DEFAULT '[]'::jsonb,
  extracted_clauses JSONB DEFAULT '{}'::jsonb,
  missing_fields TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Offer scores: persists scoring results
CREATE TABLE public.offer_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offer_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  final_label TEXT NOT NULL,
  final_recommendation TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  category_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_explanations JSONB NOT NULL DEFAULT '{}'::jsonb,
  negotiation_targets JSONB DEFAULT '[]'::jsonb,
  top_red_flags JSONB DEFAULT '[]'::jsonb,
  top_green_flags JSONB DEFAULT '[]'::jsonb,
  why_this_score TEXT,
  personalization_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User offer preferences for personalization
CREATE TABLE public.user_offer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  compensation_priority INTEGER DEFAULT 3,
  flexibility_priority INTEGER DEFAULT 3,
  healthcare_priority INTEGER DEFAULT 3,
  growth_priority INTEGER DEFAULT 3,
  mission_alignment_priority INTEGER DEFAULT 3,
  legal_risk_sensitivity INTEGER DEFAULT 3,
  stability_priority INTEGER DEFAULT 3,
  remote_work_priority INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.offer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_offer_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own offer records" ON public.offer_records
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own offer scores" ON public.offer_scores
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own offer preferences" ON public.user_offer_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
