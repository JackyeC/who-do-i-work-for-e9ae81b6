

## Executive & Board Member Deduplication Fix

### Summary
Add deduplication, current-member filtering, smart sorting, empty states, and source notes to all executive/board member display components. Display-layer only — no data pipeline changes.

### Files to Change

**1. New utility: `src/lib/executive-utils.ts`**
Create shared helper functions used across all components:
- `deduplicatePeople(people)` — normalizes names (lowercase, strip suffixes like Jr/Sr/III), keeps the record with the most filled fields
- `isCurrentMember(person)` — filters out anyone with `departed_at`, `verification_status === 'former'`, or title containing "Former"
- `sortExecutives(executives)` — orders by C-suite rank (CEO first, then President, COO, CFO, CHRO, CTO, CMO, CLO, then other C-suite alpha, then SVP/EVP, then VP, then rest)
- `sortBoardMembers(members)` — Board Chair first, Lead Independent Director second, rest alphabetical by last name

**2. `src/components/company/LeadershipInfluenceSection.tsx`**
- Import and apply the pipeline: `filter current → deduplicate → sort` on the `executives` prop before rendering
- Add empty/pending states:
  - 0 executives: "Executive data pending — sourced from SEC proxy filings"
  - 1-2 executives: show them + "Additional leadership data pending"
- Add source note below the executive card: "Leadership data sourced from SEC proxy statements and public disclosures. Found an error? Report it →" linking to `/request-correction`
- Apply same dedup + sort to `boardMembers` prop (currently only shows count — will need the full board member data passed in)
- Board empty state: "Board composition data pending — sourced from SEC proxy filings"

**3. `src/pages/CompanyProfile.tsx`** (lines 100-110, 156-160)
- Remove the inline C-suite regex filter on `dbExecutives` query — move that logic to the shared utility
- Fetch full board member records (name, title, departed_at, is_independent) instead of just `id, is_independent`
- Pass full board data to `LeadershipInfluenceSection`

**4. `src/components/policy-intelligence/LeadershipSnapshot.tsx`**
- Import and apply `deduplicatePeople`, `isCurrentMember`, `sortExecutives`, `sortBoardMembers` to both queries before rendering
- Add source note below

**5. `src/components/ExecutivePowerNetworkCard.tsx`**
- Apply dedup to the built `networks` array (already filters `departed_at` in query, so just needs name dedup)

### What stays untouched
- All database queries, edge functions, scoring, methodology
- No schema changes needed

### Technical Details

Sort rank map for executives:
```text
CEO/Chief Executive Officer     → 0
President                       → 1
COO                             → 2
CFO                             → 3
CHRO/Chief People Officer       → 4
CTO                             → 5
CMO                             → 6
CLO/General Counsel             → 7
Other C-suite                   → 8
SVP/EVP                         → 9
VP                              → 10
Other                           → 11
```

Source note style: `text-[11px] text-[#3d3a4a]` with "Report it →" as a Link to `/request-correction`.

