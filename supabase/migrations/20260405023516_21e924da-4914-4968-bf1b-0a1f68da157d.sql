CREATE TABLE public.wdiwf_congressional_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_type TEXT NOT NULL, -- 'member', 'bill', 'vote'
  congress_number INTEGER NOT NULL DEFAULT 119,
  chamber TEXT, -- 'house', 'senate'
  bioguide_id TEXT,
  member_name TEXT,
  party TEXT,
  state TEXT,
  district TEXT,
  bill_number TEXT,
  bill_title TEXT,
  bill_type TEXT,
  sponsor_bioguide_id TEXT,
  vote_number INTEGER,
  vote_question TEXT,
  vote_result TEXT,
  vote_date DATE,
  raw_payload JSONB,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wdiwf_congressional_data ENABLE ROW LEVEL SECURITY;

-- Public read access (congressional data is public information)
CREATE POLICY "Anyone can read congressional data"
  ON public.wdiwf_congressional_data
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only admins can insert/update
CREATE POLICY "Admin can manage congressional data"
  ON public.wdiwf_congressional_data
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_congressional_data_type ON public.wdiwf_congressional_data (data_type);
CREATE INDEX idx_congressional_bioguide ON public.wdiwf_congressional_data (bioguide_id) WHERE bioguide_id IS NOT NULL;
CREATE INDEX idx_congressional_bill ON public.wdiwf_congressional_data (bill_number) WHERE bill_number IS NOT NULL;
CREATE INDEX idx_congressional_congress ON public.wdiwf_congressional_data (congress_number);