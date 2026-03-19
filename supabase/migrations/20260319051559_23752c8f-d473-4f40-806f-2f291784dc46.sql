
-- Mark Laxman Narasimhan as departed (replaced by Brian Niccol Sept 2024)
UPDATE public.company_executives 
SET departed_at = '2024-09-09', verification_status = 'verified'
WHERE id = '09f20c7c-1f4f-45f9-a99c-950efb50d290';

-- Mark Brady Brewer as departed (left Starbucks in 2024)
UPDATE public.company_executives 
SET departed_at = '2024-01-01', verification_status = 'verified'
WHERE id = '83e09379-0e2b-4664-a408-254d80992e6f';

-- Add Brian Niccol as current Chairman & CEO
INSERT INTO public.company_executives (company_id, name, title, verification_status)
SELECT id, 'Brian Niccol', 'Chairman & Chief Executive Officer', 'verified'
FROM public.companies WHERE slug = 'starbucks';
