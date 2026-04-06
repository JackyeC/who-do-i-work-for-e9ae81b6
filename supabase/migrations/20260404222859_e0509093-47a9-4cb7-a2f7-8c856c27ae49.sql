-- 1. RLS already enabled, but safe to re-run
ALTER TABLE briefing_signals ENABLE ROW LEVEL SECURITY;

-- 2. Drop the overly permissive existing read policy
DROP POLICY IF EXISTS "Public read active briefing signals" ON briefing_signals;

-- 3. Allow anonymous inserts (quiz submissions without login)
CREATE POLICY "Allow public insert"
  ON briefing_signals
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Only authenticated users can read the data
CREATE POLICY "Allow authenticated read"
  ON briefing_signals
  FOR SELECT
  TO authenticated
  USING (true);