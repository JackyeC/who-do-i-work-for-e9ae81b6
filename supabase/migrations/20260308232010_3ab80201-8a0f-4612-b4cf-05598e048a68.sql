
-- Auto-apply settings table
CREATE TABLE public.auto_apply_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  min_alignment_threshold integer NOT NULL DEFAULT 70,
  max_daily_applications integer NOT NULL DEFAULT 5,
  is_paused boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_apply_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own auto-apply settings" ON public.auto_apply_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own auto-apply settings" ON public.auto_apply_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own auto-apply settings" ON public.auto_apply_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own auto-apply settings" ON public.auto_apply_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_auto_apply_settings_updated_at BEFORE UPDATE ON public.auto_apply_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply queue table
CREATE TABLE public.apply_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid REFERENCES public.company_jobs(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  job_title text NOT NULL,
  company_name text NOT NULL,
  alignment_score integer NOT NULL DEFAULT 0,
  matched_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'queued',
  generated_payload jsonb,
  error_message text,
  application_url text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.apply_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own queue" ON public.apply_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own queue" ON public.apply_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own queue" ON public.apply_queue FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own queue" ON public.apply_queue FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_apply_queue_updated_at BEFORE UPDATE ON public.apply_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
