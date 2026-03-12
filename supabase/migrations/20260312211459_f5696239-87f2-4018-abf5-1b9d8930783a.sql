
ALTER TABLE public.user_values_profile
  ADD COLUMN IF NOT EXISTS disability_inclusion_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS gender_equality_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS pay_equity_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS workplace_safety_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS union_rights_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS gig_worker_treatment_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS pollution_waste_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS sustainable_supply_chains_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS energy_fossil_fuel_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS data_privacy_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS anti_corruption_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS political_transparency_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS education_access_importance integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS community_investment_importance integer NOT NULL DEFAULT 50;
