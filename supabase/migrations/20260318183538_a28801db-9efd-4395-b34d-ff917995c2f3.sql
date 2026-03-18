
CREATE TABLE public.state_women_status_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_code text NOT NULL,
  state_name text NOT NULL,
  employment_earnings_grade text,
  poverty_opportunity_grade text,
  work_family_grade text,
  violence_safety_grade text,
  reproductive_rights_grade text,
  health_wellbeing_grade text,
  political_participation_grade text,
  composite_grade text,
  data_year integer NOT NULL DEFAULT 2018,
  source_url text DEFAULT 'https://statusofwomendata.org',
  source_name text DEFAULT 'IWPR Status of Women in the States',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (state_code, data_year)
);

ALTER TABLE public.state_women_status_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read state women status grades"
  ON public.state_women_status_grades
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.state_women_status_grades IS 'IWPR Status of Women state-level grades across 7 dimensions (A-F scale)';
