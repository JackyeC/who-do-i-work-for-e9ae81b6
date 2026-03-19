

# Fix "Check Your First Company" Onboarding Step

## Problem

The onboarding checklist checks `tracked_companies` and `user_company_watchlist` to determine if you've explored a company. Both tables have 0 rows for your account. But you *have* interacted with companies -- your `user_usage` table shows 9 entries including career discovery and offer scans.

The step's completion logic is too narrow.

## Fix

In `src/components/dashboard/DashboardOnboarding.tsx`, broaden the `hasExploredCompany` check to also query `user_usage` for any company-related function usage (e.g., `company-discover`, `offer-clarity-scan`, `career-discovery`). If any of those tables have rows for the user, mark the step as done.

Updated query adds a 5th parallel check:

```
user_usage: count where user_id = current user (any row means they've used the platform)
```

Change the logic to:

```typescript
hasExploredCompany: (tracked.count || 0) > 0 
  || (watchlist.count || 0) > 0 
  || (usage.count || 0) > 0
```

## File Changed

- `src/components/dashboard/DashboardOnboarding.tsx` -- add `user_usage` count to the parallel query array, update `hasExploredCompany` condition

