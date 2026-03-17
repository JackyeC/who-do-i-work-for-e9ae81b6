
CREATE TABLE public.job_alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  work_modes TEXT[] DEFAULT '{}',
  industries TEXT[] DEFAULT '{}',
  min_civic_score INTEGER DEFAULT 0,
  salary_only BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'instant')),
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.job_alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alert preferences"
  ON public.job_alert_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
