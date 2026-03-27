
Issue confirmed. The publish pipeline is still blocked by one unresolved backend dependency, and the game route alias is currently missing in routing.

What broke
1) Publish blocker (root cause)
- File: `supabase/functions/parse-career-document/index.ts`
- Still contains `npm:` dynamic imports:
  - `npm:mammoth@1.6.0`
  - `npm:jszip@3.10.1`
  - `npm:pdf-parse/lib/pdf-parse.js`
- This causes the edge-function build to fail, and publish/update cannot proceed.

2) Game URL 404 (secondary)
- File: `src/App.tsx`
- `/peoplepuzzles` route exists, but `/play` route alias is missing right now, so `/play` returns 404.

Implementation plan
1) Hard-fix parser imports in one pass
- Update `supabase/functions/parse-career-document/index.ts`:
  - `npm:mammoth@1.6.0` → `https://esm.sh/mammoth@1.6.0`
  - `npm:jszip@3.10.1` → `https://esm.sh/jszip@3.10.1`
  - `npm:pdf-parse/lib/pdf-parse.js` → `https://esm.sh/pdf-parse@1.1.1/lib/pdf-parse.js`
- Keep code behavior identical; only resolver/runtime compatibility changes.

2) Restore game route alias
- Update `src/App.tsx`:
  - Add ` <Route path="/play" element={<PeoplePuzzles />} /> `
  - Keep existing `/peoplepuzzles` route untouched.

3) Sanity pass for regressions
- Re-scan `supabase/functions/**` for any remaining `npm:` specifiers.
- Confirm no duplicate/invalid route definitions for `PeoplePuzzles`.

4) Publish-unblock verification checklist
- Confirm backend function compiles without `npm:` resolution errors.
- Confirm frontend routes:
  - `/peoplepuzzles` loads iframe page
  - `/play` loads same game page
- Confirm published URL resolves without internal error on those paths.

Technical details
- Why the build error listed many function files:
  - The backend type/build check traverses the full functions workspace; one unresolved import in a shared checked graph can make the output look global even when root cause is in a single file.
- Why this blocks publish:
  - Frontend publish is gated by project build health; failing backend compile in this workspace can prevent update/publish completion.
- Why `/play` failed:
  - Route alias was removed/overwritten; only canonical route remained.

Success criteria
- No `npm:` imports left in `supabase/functions/parse-career-document/index.ts`.
- No backend build error for `npm:mammoth`.
- `/play` and `/peoplepuzzles` both render the game.
- Publish/Update button completes normally.
