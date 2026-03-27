

## Fix: Duplicate Industries in Browse Dropdown

### Root cause

Line 109 of `Browse.tsx` builds the industry list:
```ts
const allIndustries = useMemo(() =>
  [...new Set(allCompanies.map((c) => c.industry))].sort(),
  [allCompanies]
);
```

This deduplicates by exact string match. Duplicates appear because:
1. Database rows have inconsistent casing or naming (e.g. "Technology" vs "Tech", "Financial Services" vs "Finance")
2. Sample data from `sampleData.ts` may use different industry names than the database

### Fix

Normalize industries before deduplication:
- Trim whitespace
- Filter out null/undefined/empty values
- Case-normalize for dedup (e.g. `.toLowerCase()` for Set key, but display the first-seen casing)

**Single change in `src/pages/Browse.tsx` line 109:**

```ts
const allIndustries = useMemo(() => {
  const seen = new Map<string, string>();
  for (const c of allCompanies) {
    const raw = (c.industry || "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (!seen.has(key)) seen.set(key, raw);
  }
  return [...seen.values()].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
}, [allCompanies]);
```

This keeps the first-seen display name while deduplicating case-insensitively, and filters out empty/null values.

### Scope
One file, one line block replaced. No other pages affected (Jobs.tsx and Rankings.tsx use their own industry lists but could benefit from the same pattern later).

