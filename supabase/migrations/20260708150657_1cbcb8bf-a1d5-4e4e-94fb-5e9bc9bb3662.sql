SELECT cron.unschedule('drain-dossier-jobs-5m')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'drain-dossier-jobs-5m');

SELECT cron.schedule(
  'drain-dossier-jobs-5m',
  '*/5 * * * *',
  $$
  SELECT public.invoke_edge_function('drain-dossier-jobs', '{"limit":3}'::jsonb) AS request_id;
  $$
);