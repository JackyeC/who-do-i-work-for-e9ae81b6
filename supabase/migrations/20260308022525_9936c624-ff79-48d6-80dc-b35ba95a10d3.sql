
-- Private storage bucket for offer letters
INSERT INTO storage.buckets (id, name, public) VALUES ('offer-letters', 'offer-letters', false);

-- Storage RLS: users can only access their own files
CREATE POLICY "Users can upload own offer letters"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'offer-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own offer letters"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'offer-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own offer letters"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'offer-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Offer letter reviews table
CREATE TABLE public.offer_letter_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  file_path TEXT,
  file_deleted BOOLEAN NOT NULL DEFAULT false,
  original_filename TEXT,
  input_type TEXT NOT NULL DEFAULT 'file', -- 'file' or 'pasted_text'
  extracted_text TEXT,
  extracted_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  detected_clauses JSONB NOT NULL DEFAULT '[]'::jsonb,
  offer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  comparison_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_letter_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own offer reviews"
ON public.offer_letter_reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own offer reviews"
ON public.offer_letter_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own offer reviews"
ON public.offer_letter_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own offer reviews"
ON public.offer_letter_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_offer_letter_reviews_updated_at
  BEFORE UPDATE ON public.offer_letter_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
