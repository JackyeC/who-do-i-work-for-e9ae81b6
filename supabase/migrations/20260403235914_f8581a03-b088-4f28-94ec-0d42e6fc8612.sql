
ALTER TABLE public.companies DROP CONSTRAINT companies_vetted_status_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_vetted_status_check CHECK (vetted_status = ANY (ARRAY['unverified'::text, 'verified'::text, 'certified'::text, 'fully_audited'::text]));
