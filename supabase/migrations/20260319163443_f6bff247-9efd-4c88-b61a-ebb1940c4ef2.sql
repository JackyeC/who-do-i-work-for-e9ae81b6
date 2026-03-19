
CREATE TABLE public.ticker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  message text NOT NULL,
  source_tag text,
  item_type text NOT NULL DEFAULT 'general',
  is_pinned boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  is_manual boolean NOT NULL DEFAULT false,
  source_table text,
  source_record_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- Index for the ticker query: visible, not expired, ordered
CREATE INDEX idx_ticker_items_display ON public.ticker_items (is_hidden, is_pinned, created_at DESC)
  WHERE is_hidden = false;

-- RLS
ALTER TABLE public.ticker_items ENABLE ROW LEVEL SECURITY;

-- Public read for all (ticker is visible to everyone)
CREATE POLICY "Anyone can read visible ticker items"
  ON public.ticker_items FOR SELECT
  USING (is_hidden = false);

-- Only admins/owners can insert/update/delete
CREATE POLICY "Admins can manage ticker items"
  ON public.ticker_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'owner'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticker_items;
