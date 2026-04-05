
-- Enable vault extension if not already
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- Store the Supabase URL and anon key in Vault (one source of truth)
SELECT vault.create_secret(
  'https://tdetybqdxadmowjivtjy.supabase.co',
  'project_url',
  'Supabase project URL for cron jobs'
);

SELECT vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXR5YnFkeGFkbW93aml2dGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjU0MTcsImV4cCI6MjA4ODQwMTQxN30.gM_5tF5Qs8f0LUfE9ZB5PM-TeHhDVe4KZF6_p60A3Lc',
  'project_anon_key',
  'Supabase anon key for cron jobs'
);

-- Create the helper function that all cron jobs will use
CREATE OR REPLACE FUNCTION public.invoke_edge_function(
  fn_name text,
  body jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'vault', 'net', 'extensions'
AS $$
DECLARE
  v_url text;
  v_key text;
  v_result bigint;
BEGIN
  -- Read from vault
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url'
  LIMIT 1;

  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'project_anon_key'
  LIMIT 1;

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE EXCEPTION 'Missing vault secrets: project_url or project_anon_key';
  END IF;

  SELECT net.http_post(
    url := v_url || '/functions/v1/' || fn_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := body
  ) INTO v_result;

  RETURN v_result;
END;
$$;
