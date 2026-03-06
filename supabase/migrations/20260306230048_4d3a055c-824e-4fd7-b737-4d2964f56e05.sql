
-- Add unique constraint for upsert on scan_schedules
ALTER TABLE public.scan_schedules ADD CONSTRAINT scan_schedules_company_scan_unique UNIQUE (company_id, scan_type);
