

## What's Been Built So Far

| Phase | Status |
|---|---|
| Phase 1: Filters + Ranking | Done |
| Phase 2: Job Detail Page + SEO | Done |
| Phase 3: Ghost Job Detection | Done |
| Phase 4: Save/Track + Mobile Polish | Not started |

## What's Next: Phase 4 — Save/Track + Mobile Polish

This is the remaining phase from the approved roadmap. It connects the job board to the existing `TrackingDashboard` and tightens the mobile experience.

### 1. Save/Track from Job Cards
- Add a bookmark/save button on `JobIntegrityCard` (requires auth)
- On click, insert into `applications_tracker` with status "Draft"
- Show saved state visually (filled bookmark icon)
- Wire the existing `TrackingDashboard` so saved jobs appear there

### 2. Save/Track from Job Detail Page
- Add save + Quick Apply buttons to `JobDetailPage`
- Reuse `EasyApplyButton` component already built

### 3. Mobile Filter Drawer
- On screens < md, collapse `JobBoardFilters` into a slide-out drawer triggered by a filter icon button
- Show active filter count badge on the trigger button

### 4. Mobile Card Density
- Tighten padding on `JobIntegrityCard` for small screens
- Ensure touch targets are at least 44px
- Single-column grid on mobile (already exists, but verify spacing)

### Files to Create/Edit
- **Edit**: `JobIntegrityCard.tsx` — add save button
- **Edit**: `JobDetailPage.tsx` — add save + EasyApply
- **Edit**: `JobBoardFilters.tsx` — wrap in mobile drawer
- **Edit**: `JobIntegrityBoard.tsx` — minor layout tweaks

No database changes needed — `applications_tracker` table already exists.

