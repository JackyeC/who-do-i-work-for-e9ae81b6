
-- 1. Link Walmart Inc case to existing Walmart company
UPDATE eeoc_dropped_cases 
SET company_id = 'a7b8c9d0-e1f2-3456-abcd-567890123456'
WHERE id = 'd0a9ca1a-5f40-4f33-b1a6-a07501175f49';

-- 2. Link Starboard Group / Wendy's franchise case to existing Wendy's company
UPDATE eeoc_dropped_cases 
SET company_id = '802323e7-1bcb-4840-81c1-b1b7f7838b8d'
WHERE id = '327d8cb0-32d1-4a12-b2b7-0877c7e0fe7a';

-- 3. Create Lush Cosmetics in the directory
INSERT INTO companies (name, slug, industry, state, description, record_status, confidence_rating, last_reviewed, civic_footprint_score, total_pac_spending, corporate_pac_exists)
VALUES ('Lush Cosmetics', 'lush-cosmetics', 'Retail', 'National', 'Lush Handmade Cosmetics — global handmade cosmetics retailer known for ethical sourcing and environmental advocacy.', 'published', 'medium', now()::date, 50, 0, false);

-- 4. Create University of Pennsylvania in the directory
INSERT INTO companies (name, slug, industry, state, description, record_status, confidence_rating, last_reviewed, civic_footprint_score, total_pac_spending, corporate_pac_exists)
VALUES ('University of Pennsylvania', 'university-of-pennsylvania', 'Education', 'PA', 'The Trustees of the University of Pennsylvania — Ivy League research university and major employer in Philadelphia.', 'published', 'medium', now()::date, 50, 0, false);

-- 5. Link Lush EEOC case to new company
UPDATE eeoc_dropped_cases 
SET company_id = (SELECT id FROM companies WHERE slug = 'lush-cosmetics' LIMIT 1)
WHERE id = 'bcaa85df-4d07-4e3c-b3cd-6c72904d11e2';

-- 6. Link UPenn EEOC case to new company
UPDATE eeoc_dropped_cases 
SET company_id = (SELECT id FROM companies WHERE slug = 'university-of-pennsylvania' LIMIT 1)
WHERE id = '74ee1d9b-50a8-41cf-9522-0db38576db35';
