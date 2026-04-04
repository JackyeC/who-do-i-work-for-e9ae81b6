

## RLS Fix for `briefing_signals`

### Current State
- RLS is already **enabled** on `briefing_signals`
- Existing policy: `"Public read active briefing signals"` grants SELECT to both `anon` and `authenticated`
- No INSERT policy exists — meaning anonymous quiz submissions would currently be **blocked**

### What Your SQL Does
1. `ENABLE ROW LEVEL SECURITY` — already done, harmless to re-run
2. Insert policy for `anon` — **needed**, this is the missing piece that lets the quiz modal submit without login
3. Select policy for `authenticated` — adds a read policy, but the existing policy already grants read to `anon` too, so to truly restrict reads to authenticated users, we should **drop the old policy first**

### Recommended Migration

```sql
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
```

### Why the Extra DROP
Without dropping the old policy, `anon` can still SELECT all rows (Postgres OR's all matching policies). Adding the DROP ensures only authenticated users can read briefing signal data.

### Files Changed
- One database migration only. No code changes needed — `BriefingHoldingModal.tsx` already writes to this table (though it currently targets `career_waitlist`; that's a separate issue if you want it pointed at `briefing_signals` instead).

