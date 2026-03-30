-- Schedule sync-work-news to run every 2 hours for radically current ticker
-- This function pulls from NewsAPI + GDELT and writes directly to work_news
SELECT cron.schedule(
  'sync-work-news-2h',
  '30 */2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tdetybqdxadmowjivtjy.supabase.co/functions/v1/sync-work-news',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
