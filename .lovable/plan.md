

## Security Hardening Plan

### Current State Assessment

After auditing the database policies:

1. **early_access_signups** — Already secure. Only admin SELECT, public INSERT with `WITH CHECK (true)`. No public read access exists. No changes needed.

2. **Company intelligence tables** (signal_scans, public_stances, dark_money, trade_associations, state_lobbying) — Only have public SELECT policies. No INSERT/UPDATE/DELETE policies exist for anonymous or regular users. Writes are already backend-only. No changes needed.

3. **bracket_votes** — This is the real vulnerability. The `"Anyone can read vote counts"` SELECT policy uses `USING (true)` for the `public` role, exposing raw rows including `user_id` to anyone.

### Changes Required

**Database migration (single SQL migration):**

- Drop the permissive public SELECT policy on `bracket_votes`
- Add a new SELECT policy allowing authenticated users to read only their own votes (`auth.uid() = user_id`)
- Create a `bracket_vote_totals` view (with `security_invoker = true`) that aggregates votes by matchup_id and voted_for, exposing only counts — no user_id
- Grant SELECT on the view to `anon` and `authenticated`

**Frontend changes (`src/pages/BrandMadness.tsx`):**

- Update the aggregate vote loading query (lines 30–46) to read from `bracket_vote_totals` view instead of the raw `bracket_votes` table
- Keep the user-specific vote query (lines 52–66) as-is since it already filters by `user_id` and will work with the new own-row policy

### Technical Details

```text
Migration SQL:
1. DROP POLICY "Anyone can read vote counts" ON bracket_votes
2. CREATE POLICY "Users read own votes" ON bracket_votes FOR SELECT TO authenticated USING (auth.uid() = user_id)
3. CREATE VIEW bracket_vote_totals AS SELECT matchup_id, voted_for, COUNT(*)::int AS vote_count FROM bracket_votes GROUP BY matchup_id, voted_for
4. Set security_invoker = true on the view
5. GRANT SELECT ON bracket_vote_totals TO anon, authenticated

Frontend (BrandMadness.tsx):
- Replace supabase.from("bracket_votes").select("matchup_id, voted_for") 
  with supabase.from("bracket_vote_totals").select("matchup_id, voted_for, vote_count")
- Update aggregation logic to use vote_count directly instead of counting rows
```

### What stays unchanged

- All company intelligence tables (already properly secured)
- Early access signups (already properly secured)
- The `ManualSignalEntry` component (inserts to `company_signal_scans` which has no anon INSERT policy — will fail silently for non-admin users, which is correct)
- User vote insertion and update logic in `BracketMatchupCard.tsx`

