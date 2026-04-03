-- Dream Job Profile: aggregated signals from quiz, games, preferences, resume parser (client writes)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dream_job_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.dream_job_profile IS
  'Aggregated Dream Job Profile: values, adjacent roles, game/quiz signals, matching facets. Versioned via dream_job_profile_version.';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dream_job_profile_version integer NOT NULL DEFAULT 1;

-- Email dossier sent after each application (where/when/why + public-record summary)
CREATE TABLE IF NOT EXISTS public.application_email_dossiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications_tracker (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Application dossier',
  body_markdown text NOT NULL DEFAULT '',
  email_status text NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'queued', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  provider_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS idx_app_email_dossiers_user ON public.application_email_dossiers (user_id);
CREATE INDEX IF NOT EXISTS idx_app_email_dossiers_status ON public.application_email_dossiers (email_status);

ALTER TABLE public.application_email_dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own application dossier emails"
  ON public.application_email_dossiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own application dossier emails"
  ON public.application_email_dossiers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own application dossier emails"
  ON public.application_email_dossiers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own application dossier emails"
  ON public.application_email_dossiers FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_application_email_dossiers_updated_at
  BEFORE UPDATE ON public.application_email_dossiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
