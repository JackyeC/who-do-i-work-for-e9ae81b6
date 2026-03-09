ALTER TABLE public.issue_signals 
ADD COLUMN IF NOT EXISTS entity_name_snapshot text,
ADD COLUMN IF NOT EXISTS signal_subtype text,
ADD COLUMN IF NOT EXISTS transaction_date date;