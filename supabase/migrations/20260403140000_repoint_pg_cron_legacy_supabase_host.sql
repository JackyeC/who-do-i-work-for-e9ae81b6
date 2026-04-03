-- Repair pg_cron rows that still call the old Supabase project hostname.
-- Historical migrations embedded https://tdetybqdxadmowjivtjy.supabase.co; live cron.job.command
-- strings keep that value until updated.
--
-- JWT inside Authorization headers may still reference the old project in its payload — rotate after
-- this migration using DEV_NOTES.md § "pg_cron JWT rotation" (or unschedule + recreate jobs).

UPDATE cron.job
SET command = replace(
  command,
  'https://tdetybqdxadmowjivtjy.supabase.co',
  'https://aeulesuqxcnaonlxcjcm.supabase.co'
)
WHERE command LIKE '%tdetybqdxadmowjivtjy.supabase.co%';
