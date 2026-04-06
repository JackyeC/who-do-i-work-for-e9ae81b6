# Dopamine Layer — Ported Changes

## Summary

Ported the dopamine/gamification layer from `who-do-i-work-for` into the Lovable repo. These components add engagement mechanics (streaks, ranks, missions, badges, readiness tracking) to the main dashboard overview.

## Files Added

### Core engine
- **`src/lib/dopamine-engine.ts`** — Rank tiers, badge definitions, daily mission rotation, career readiness scoring, and rarity visual config. Pure utility (no React).

### Dashboard components
- **`src/components/dashboard/StreakBadge.tsx`** — Daily login streak badge with fire icon. Persists via localStorage. Pulses on streak extension, celebrates 7-day milestones.
- **`src/components/dashboard/InvestigatorRank.tsx`** — Shows current rank (Rookie → Whistleblower) with animated progress bar to next tier. Driven by `useCivicImpact` data.
- **`src/components/dashboard/DailyMission.tsx`** — Rotating daily challenge card with XP reward. Navigates to relevant tab/route on action. Confetti celebration on completion.
- **`src/components/dashboard/CareerReadinessRing.tsx`** — SVG progress ring showing profile completeness (resume, values, quiz, tracking, applications, alerts). Incomplete items shown as actionable checklist.
- **`src/components/dashboard/ReceiptBadges.tsx`** — Collectible badge grid (15 badges across intelligence/career/mastery categories). Rarity system (common → legendary) with glow effects. New-badge sparkle animation.

### Hook
- **`src/hooks/use-civic-impact.ts`** — New hook that counts user signals uncovered, employers tracked, and intelligence actions from Supabase tables (`user_alerts`, `tracked_companies`, `user_usage`). This hook did not exist in the Lovable repo.

## Files Modified

- **`src/components/dashboard/DashboardOverview.tsx`** — Added imports for all 5 dopamine components + wired them into the overview layout between the HireToRetireCommandCenter and Quick Actions bar.

## Dashboard Layout (dopamine section)

Inserted after `<HireToRetireCommandCenter>`, before the Quick Actions bar:

1. **StreakBadge** — Small inline badge at top of section
2. **InvestigatorRank + CareerReadinessRing** — Side by side in a 2-column grid
3. **DailyMission** — Full width card
4. **ReceiptBadges** — Inside a collapsible section (uses existing `Collapsible` UI component)

## Hook Compatibility Check

| Hook | Source repo | Lovable repo | Action |
|------|-------------|--------------|--------|
| `use-persona.ts` | Exists | Exists (identical API) | No changes needed |
| `use-dashboard-briefing.ts` | Exists | Exists (identical API) | No changes needed |
| `use-civic-impact.ts` | Exists | **Missing** | Created from source |

## Supabase Table References

All tables referenced by the new hook exist in the Lovable repo's Supabase types:
- `user_alerts` — used for signals count
- `tracked_companies` — used for employer tracking count
- `user_usage` — used for intelligence actions count
- `user_values_profile` — used by CareerReadinessRing and ReceiptBadges
- `user_documents` — used by CareerReadinessRing and ReceiptBadges
- `applications_tracker` — used by ReceiptBadges

## Build Verification

- `npx tsc --noEmit` — **0 errors**
- `npm run build` — **Success** (built in ~29s)
