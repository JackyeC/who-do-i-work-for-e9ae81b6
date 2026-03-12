
-- 1. Remove duplicate INSERT policy on career_contacts
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.career_contacts;

-- 2. Add missing DELETE policies for user-owned tables
CREATE POLICY "Users can delete own contacts" ON public.career_contacts
  FOR DELETE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own disputes" ON public.signal_disputes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own corrections" ON public.leadership_corrections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own career profile" ON public.user_career_profile
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);
