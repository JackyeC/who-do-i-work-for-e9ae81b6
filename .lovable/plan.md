

# Migrate scan-patents to PatentSearch API

## Problem
The PatentsView Legacy API (`api.patentsview.org`) was discontinued May 1, 2025 and now returns 410 Gone. The `scan-patents` edge function is broken.

## Fix

### 1. Add `PATENTSVIEW_API_KEY` secret
You'll need to request a free API key from the [PatentsView Help Desk](https://patentsview.org/apis/keyrequest). I'll prompt you to enter it as a secret.

### 2. Update `supabase/functions/scan-patents/index.ts`

**URL change** (line 49):
- Old: `https://api.patentsview.org/patents/query?q=...`
- New: `https://search.patentsview.org/api/v1/patent/?q=...`

**Field name changes** in query string:
- `patent_number` → `patent_id`
- `assignees.assignee_organization` → `assignees_at_grant.assignee_organization`
- `inventors.inventor_first_name` → `inventors_at_grant.name_first`
- `inventors.inventor_last_name` → `inventors_at_grant.name_last`

**Add API key header**:
```typescript
headers: {
  "X-Api-Key": Deno.env.get("PATENTSVIEW_API_KEY") ?? "",
  "Content-Type": "application/json",
}
```

**Update response mapping** (lines 89-105):
- `p.patent_number` → `p.patent_id`
- `p.inventors` → `p.inventors_at_grant` with `.name_first` / `.name_last`
- `p.assignees` → `p.assignees_at_grant`

**Add 410 error handling** before the generic error check.

### Files

| Action | File |
|--------|------|
| Modify | `supabase/functions/scan-patents/index.ts` — migrate to new API |
| Secret | `PATENTSVIEW_API_KEY` — user provides after requesting from PatentsView |

