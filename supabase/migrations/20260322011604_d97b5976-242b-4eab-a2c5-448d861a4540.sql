-- Fix 1: Restrict audit_requests INSERT to authenticated users only
DROP POLICY "Anyone can submit audit requests" ON public.audit_requests;
CREATE POLICY "Authenticated users can submit audit requests"
  ON public.audit_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix 2: Remove user_email column from beta_feedback (redundant with user_id -> auth.users)
ALTER TABLE public.beta_feedback DROP COLUMN IF EXISTS user_email;