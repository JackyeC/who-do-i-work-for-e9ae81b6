-- Remove existing duplicate rows (keep the newest by created_at for each headline)
DELETE FROM receipts_enriched
WHERE id NOT IN (
  SELECT DISTINCT ON (lower(trim(headline))) id
  FROM receipts_enriched
  ORDER BY lower(trim(headline)), created_at DESC
);

-- Add unique index on headline to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_enriched_unique_headline 
ON receipts_enriched (lower(trim(headline)));