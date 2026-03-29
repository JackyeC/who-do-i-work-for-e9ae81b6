-- Create tips table for anonymous employer misconduct reports
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  evidence_links TEXT,
  contact_email TEXT,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'verified', 'published', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous submissions)
CREATE POLICY "Anyone can submit a tip" ON public.tips
  FOR INSERT WITH CHECK (true);

-- Only authenticated users with admin role can read tips
CREATE POLICY "Admins can read tips" ON public.tips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Only admins can update tips (change status, add notes)
CREATE POLICY "Admins can update tips" ON public.tips
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_tips_status ON public.tips (status);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON public.tips (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tips_company_name ON public.tips (company_name);
