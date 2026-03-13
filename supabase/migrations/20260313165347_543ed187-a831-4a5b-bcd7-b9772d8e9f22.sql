
-- 1. Remove stale permissive policies
DROP POLICY IF EXISTS "Authenticated users can read change events" ON public.browse_ai_change_events;
DROP POLICY IF EXISTS "Authenticated users can insert scan events" ON public.company_scan_events;

-- 2. Harden has_role to only allow checking own role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND _user_id = auth.uid()
  )
$$;
