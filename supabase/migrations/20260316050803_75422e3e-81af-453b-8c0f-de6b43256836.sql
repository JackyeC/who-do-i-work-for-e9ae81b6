SELECT cron.schedule(
  'bulk-refresh-companies-daily',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := 'https://tdetybqdxadmowjivtjy.supabase.co/functions/v1/bulk-refresh-companies',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc"}'::jsonb,
    body := '{"batchSize": 15, "staleDays": 2}'::jsonb
  ) AS request_id;
  $$
)