
-- Add 13 values lens columns to user_values_profile
ALTER TABLE public.user_values_profile
  ADD COLUMN IF NOT EXISTS faith_christian_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS israel_middle_east_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS animal_welfare_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS dei_equity_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS anti_discrimination_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS environment_climate_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS labor_rights_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS lgbtq_rights_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS reproductive_rights_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS voting_rights_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS consumer_protection_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS healthcare_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS immigration_importance integer NOT NULL DEFAULT 50;

-- Migrate data from user_alignment_values into user_values_profile for users who have alignment values but not a values profile
INSERT INTO public.user_values_profile (user_id, pay_transparency_importance, worker_protections_importance, ai_transparency_importance, benefits_importance, representation_disclosure_importance, government_contract_preference, political_influence_sensitivity)
SELECT 
  uav.user_id,
  uav.pay_equity_weight,
  uav.worker_protections_weight,
  uav.ai_transparency_weight,
  uav.benefits_quality_weight,
  uav.dei_commitment_weight,
  uav.government_contracts_weight,
  uav.political_neutrality_weight
FROM public.user_alignment_values uav
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_values_profile uvp WHERE uvp.user_id = uav.user_id
);
