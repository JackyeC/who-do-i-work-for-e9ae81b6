
-- Company values signals detected by scans
CREATE TABLE public.company_values_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  value_category TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_summary TEXT,
  evidence_text TEXT,
  evidence_url TEXT,
  confidence TEXT NOT NULL DEFAULT 'inferred',
  severity TEXT NOT NULL DEFAULT 'neutral',
  detected_by TEXT NOT NULL DEFAULT 'ai_scan',
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User values preferences for filtering
CREATE TABLE public.user_values_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value_category TEXT NOT NULL,
  is_positive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, value_category)
);

-- Enable RLS
ALTER TABLE public.company_values_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_values_preferences ENABLE ROW LEVEL SECURITY;

-- company_values_signals: publicly readable
CREATE POLICY "Values signals are publicly readable" ON public.company_values_signals FOR SELECT USING (true);

-- user_values_preferences: user-scoped CRUD
CREATE POLICY "Users can view own values prefs" ON public.user_values_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own values prefs" ON public.user_values_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own values prefs" ON public.user_values_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own values prefs" ON public.user_values_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);
