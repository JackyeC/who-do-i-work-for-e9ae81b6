
-- Merge HENNIGAN, MIKE (duplicate) into HENNIGAN, MICHAEL (primary)
-- Step 1: Move donation recipients from duplicate to primary
UPDATE public.executive_recipients
SET executive_id = 'cf063e1f-5dce-41e3-a17d-ec1b5f0385e0'
WHERE executive_id = '794aeb9c-fb12-40bb-b958-82cf0dad62c8';

-- Step 2: Update total_donations on primary (14900 + 6600 = 21500)
UPDATE public.company_executives
SET total_donations = 21500
WHERE id = 'cf063e1f-5dce-41e3-a17d-ec1b5f0385e0';

-- Step 3: Delete the duplicate record
DELETE FROM public.company_executives
WHERE id = '794aeb9c-fb12-40bb-b958-82cf0dad62c8';
