-- Drop the safe view — the existing get_my_linkedin_profile() RPC 
-- already returns only safe fields and is SECURITY DEFINER with proper scoping.
-- Clients should use the RPC instead.
DROP VIEW IF EXISTS public.linkedin_profiles_safe;