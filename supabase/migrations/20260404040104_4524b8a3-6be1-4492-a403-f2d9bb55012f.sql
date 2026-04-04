CREATE TABLE public.personal_work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_date date NOT NULL,
  incident_time time,
  participants text NOT NULL DEFAULT '',
  verbatim_quote text NOT NULL DEFAULT '',
  related_policy text DEFAULT '',
  original_text text,
  rewritten_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs" ON public.personal_work_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own logs" ON public.personal_work_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own logs" ON public.personal_work_logs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own logs" ON public.personal_work_logs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_personal_work_logs_user_id ON public.personal_work_logs(user_id);
CREATE INDEX idx_personal_work_logs_date ON public.personal_work_logs(user_id, incident_date DESC);

CREATE TRIGGER update_personal_work_logs_updated_at
  BEFORE UPDATE ON public.personal_work_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();