
-- Agency contracts table for tracking ICE/CBP/DHS/DOD etc.
CREATE TABLE public.company_agency_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agency_name text NOT NULL,
  agency_acronym text,
  contract_description text,
  contract_value bigint,
  contract_id_external text,
  controversy_flag boolean NOT NULL DEFAULT false,
  controversy_category text, -- 'immigration_enforcement', 'surveillance', 'military', 'private_prisons', etc.
  controversy_description text,
  fiscal_year integer,
  source text,
  confidence text NOT NULL DEFAULT 'inferred',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Supply chain flags for international concerns
CREATE TABLE public.company_supply_chain_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  country text NOT NULL,
  flag_type text NOT NULL, -- 'forced_labor', 'human_rights', 'authoritarian_regime', 'conflict_minerals', 'environmental'
  description text,
  severity text NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  entity_name text,
  source text,
  confidence text NOT NULL DEFAULT 'inferred',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scan schedule tracking
CREATE TABLE public.scan_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_type text NOT NULL, -- 'social', 'agency', 'international'
  last_scan_at timestamptz,
  next_scan_at timestamptz,
  scan_frequency_hours integer NOT NULL DEFAULT 168, -- weekly
  is_active boolean NOT NULL DEFAULT true,
  last_scan_status text DEFAULT 'pending',
  alert_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Alerts table for new findings
CREATE TABLE public.scan_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scan_type text NOT NULL,
  alert_type text NOT NULL, -- 'new_contract', 'controversy_detected', 'stance_shift', 'new_fara_filing'
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'medium',
  is_read boolean NOT NULL DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies - all publicly readable
ALTER TABLE public.company_agency_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_supply_chain_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency contracts are publicly readable" ON public.company_agency_contracts FOR SELECT USING (true);
CREATE POLICY "Supply chain flags are publicly readable" ON public.company_supply_chain_flags FOR SELECT USING (true);
CREATE POLICY "Scan schedules are publicly readable" ON public.scan_schedules FOR SELECT USING (true);
CREATE POLICY "Scan alerts are publicly readable" ON public.scan_alerts FOR SELECT USING (true);

-- Enable realtime on alert-worthy tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_agency_contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.company_supply_chain_flags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_scans;
