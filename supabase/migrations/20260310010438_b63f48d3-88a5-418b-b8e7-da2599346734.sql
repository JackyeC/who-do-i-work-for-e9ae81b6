
-- Issue legislation mapping table: structured bill → issue category mappings
CREATE TABLE public.issue_legislation_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_category text NOT NULL,
  bill_keyword text NOT NULL,
  bill_number text,
  congress_session text,
  policy_area text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_issue_legislation_map_category ON public.issue_legislation_map(issue_category);
CREATE INDEX idx_issue_legislation_map_policy_area ON public.issue_legislation_map(policy_area);

-- Allow public read for edge functions
ALTER TABLE public.issue_legislation_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.issue_legislation_map FOR SELECT USING (true);

-- Issue scan status tracking table: tracks what's been scanned per issue
CREATE TABLE public.issue_scan_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_category text NOT NULL UNIQUE,
  companies_scanned integer NOT NULL DEFAULT 0,
  records_analyzed integer NOT NULL DEFAULT 0,
  signals_generated integer NOT NULL DEFAULT 0,
  last_scan_at timestamptz,
  scan_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.issue_scan_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.issue_scan_status FOR SELECT USING (true);
