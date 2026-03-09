
-- User Values Profile table
CREATE TABLE public.user_values_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pay_transparency_importance integer NOT NULL DEFAULT 50,
  worker_protections_importance integer NOT NULL DEFAULT 50,
  ai_transparency_importance integer NOT NULL DEFAULT 50,
  benefits_importance integer NOT NULL DEFAULT 50,
  remote_flexibility_importance integer NOT NULL DEFAULT 50,
  mission_alignment_importance integer NOT NULL DEFAULT 50,
  political_influence_sensitivity integer NOT NULL DEFAULT 50,
  government_contract_preference integer NOT NULL DEFAULT 50,
  company_size_preference text DEFAULT 'no_preference',
  startup_vs_enterprise_preference text DEFAULT 'no_preference',
  representation_disclosure_importance integer NOT NULL DEFAULT 50,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_values_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own values profile" ON public.user_values_profile FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own values profile" ON public.user_values_profile FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own values profile" ON public.user_values_profile FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own values profile" ON public.user_values_profile FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Learning Resources table
CREATE TABLE public.learning_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_tag text NOT NULL,
  resource_title text NOT NULL,
  provider_name text NOT NULL,
  resource_type text NOT NULL DEFAULT 'course',
  resource_url text,
  description text,
  estimated_time text,
  level text DEFAULT 'beginner',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learning resources are publicly readable" ON public.learning_resources FOR SELECT USING (true);

-- Career Contacts table
CREATE TABLE public.career_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  title text,
  profile_url text,
  contact_type text NOT NULL DEFAULT 'peer',
  industry text,
  role_tags text[] DEFAULT '{}',
  company_id uuid REFERENCES public.companies(id),
  source_type text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.career_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Career contacts are publicly readable" ON public.career_contacts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert contacts" ON public.career_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Trigger for updated_at on user_values_profile
CREATE TRIGGER update_user_values_profile_updated_at
  BEFORE UPDATE ON public.user_values_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
