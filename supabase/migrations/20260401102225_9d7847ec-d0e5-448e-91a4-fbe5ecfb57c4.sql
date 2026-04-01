DROP POLICY "Users can read own profile or admin" ON public.profiles;

CREATE POLICY "Users can read own profile or admin/owner"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'owner'::app_role)
);