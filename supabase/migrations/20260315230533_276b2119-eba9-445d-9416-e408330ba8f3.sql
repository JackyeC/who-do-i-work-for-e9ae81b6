
-- company_research: approved/published research separate from pending queue
CREATE TABLE public.company_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  research_summary TEXT,
  connection_chain TEXT,
  leadership_notes TEXT,
  board_connections TEXT,
  political_spending_notes TEXT,
  source_model TEXT DEFAULT 'perplexity/sonar',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
  citations JSONB DEFAULT '[]'::jsonb,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_research ENABLE ROW LEVEL SECURITY;

-- Public can read approved research
CREATE POLICY "Anyone can read approved research"
  ON public.company_research FOR SELECT
  USING (status = 'approved');

-- Admins can manage all research
CREATE POLICY "Admins can manage research"
  ON public.company_research FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Auto-update updated_at
CREATE TRIGGER update_company_research_updated_at
  BEFORE UPDATE ON public.company_research
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add vetted_status to companies if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='vetted_status') THEN
    ALTER TABLE public.companies ADD COLUMN vetted_status TEXT DEFAULT 'unverified' CHECK (vetted_status IN ('unverified', 'verified', 'certified'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='companies' AND column_name='jackye_insight') THEN
    ALTER TABLE public.companies ADD COLUMN jackye_insight TEXT;
  END IF;
END $$;

-- Add is_featured to company_jobs if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='company_jobs' AND column_name='is_featured') THEN
    ALTER TABLE public.company_jobs ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='company_jobs' AND column_name='admin_approved') THEN
    ALTER TABLE public.company_jobs ADD COLUMN admin_approved BOOLEAN DEFAULT false;
  END IF;
END $$;
