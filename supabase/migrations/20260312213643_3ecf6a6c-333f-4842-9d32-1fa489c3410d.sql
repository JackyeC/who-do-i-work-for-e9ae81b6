
-- Add auto-delete column to user_documents
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS delete_after_days INTEGER DEFAULT 30;

-- Add auto-delete column to offer_letter_reviews
ALTER TABLE public.offer_letter_reviews ADD COLUMN IF NOT EXISTS delete_after_days INTEGER DEFAULT 30;

-- Add auto-delete column to offer_records
ALTER TABLE public.offer_records ADD COLUMN IF NOT EXISTS delete_after_days INTEGER DEFAULT 30;
