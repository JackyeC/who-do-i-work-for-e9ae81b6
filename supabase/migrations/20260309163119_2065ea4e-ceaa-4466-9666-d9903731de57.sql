
-- Create issue_signals table
CREATE TABLE public.issue_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  issue_category TEXT NOT NULL,
  signal_type TEXT NOT NULL DEFAULT 'keyword_match',
  source_dataset TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  confidence_score TEXT NOT NULL DEFAULT 'medium',
  amount BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast issue-based queries
CREATE INDEX idx_issue_signals_category ON public.issue_signals(issue_category);
CREATE INDEX idx_issue_signals_entity ON public.issue_signals(entity_id);
CREATE INDEX idx_issue_signals_category_entity ON public.issue_signals(issue_category, entity_id);

-- Enable RLS
ALTER TABLE public.issue_signals ENABLE ROW LEVEL SECURITY;

-- Public read access (this is public transparency data)
CREATE POLICY "Anyone can read issue signals"
  ON public.issue_signals FOR SELECT
  USING (true);

-- Service role insert (only edge functions write)
CREATE POLICY "Service role can insert issue signals"
  ON public.issue_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update issue signals"
  ON public.issue_signals FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.issue_signals;
