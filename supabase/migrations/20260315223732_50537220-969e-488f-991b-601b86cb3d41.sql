-- RLS policies for compensation_data
ALTER TABLE public.compensation_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage compensation_data"
ON public.compensation_data FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can read compensation_data"
ON public.compensation_data FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon users can read compensation_data"
ON public.compensation_data FOR SELECT
TO anon
USING (true);

-- Freshness audit view
CREATE OR REPLACE VIEW public.compensation_freshness_audit AS
SELECT
  id,
  company,
  freshness_status,
  last_updated,
  updated_at,
  EXTRACT(DAY FROM now() - last_updated::timestamp) AS days_since_update,
  CASE
    WHEN freshness_status = 'fresh' AND EXTRACT(DAY FROM now() - last_updated::timestamp) <= 30 THEN 'OK'
    WHEN freshness_status = 'fresh' AND EXTRACT(DAY FROM now() - last_updated::timestamp) > 30 THEN 'NEEDS_REFRESH'
    WHEN freshness_status = 'failed' THEN 'FAILED'
    WHEN freshness_status = 'partial' THEN 'PARTIAL'
    ELSE 'UNKNOWN'
  END AS health_status
FROM public.compensation_data
ORDER BY last_updated ASC NULLS FIRST;

-- Founder notes table
CREATE TABLE public.founder_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  note TEXT NOT NULL,
  week_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.founder_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage founder_notes"
ON public.founder_notes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'owner'))
WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can read founder_notes"
ON public.founder_notes FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_founder_notes_updated_at
  BEFORE UPDATE ON public.founder_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
