

## Plan: Add `/companies` — Mission-Driven Organizations Directory

### What We're Building
A public page at `/companies` with a browseable directory of verified mission-driven organizations, hardcoded sample data, rich filtering, and company cards with verification badges and Reality Check scores.

### Changes

**1. Create `src/pages/Companies.tsx`**

- **Hero**: Headline "Organizations walking the talk." / Subheadline "Every org here has been verified against public data. No bias. Just receipts."
- **CTA banner**: "Is your organization here? Claim your profile." linking to `/for-employers`
- **Search bar** + filter row using existing UI primitives (`Input`, `Select`, Popover+Checkbox for multi-select):
  - Mission Category (multi-select popover): Climate, Health Equity, Education, Civic/Policy, Veterans, Faith-Based, Community/Social, Economic Justice, LGBTQ Rights, Disability Rights, Rural Development, Other
  - Verification Status: All / Verified Only
  - Org Type: All / Nonprofit / B Corp / Social Enterprise / For-Purpose
  - Location: All / Remote-friendly / Northeast / Southeast / Midwest / West
  - Company Size: All / Under 50 / 50-200 / 200-1000 / 1000+
- **Company cards** (responsive grid 1/2/3 cols), each showing:
  - Colored initial avatar + org name
  - Mission statement (one-line truncated)
  - Mission Category tags (Badge components)
  - Reality Check Score (green >70, yellow 50-70, red <50)
  - Verification badges (B Corp / 501c3 / Mission Verified) as small shield icons
  - "Open Roles: X" button
  - Narrative Gap amber flag if `narrativeGap: true`
- **Sample data**: ~8 hardcoded orgs spanning the categories, ready to swap for DB later
- **Bottom note**: The neutrality statement
- Uses `usePageSEO`, `motion` stagger animation (same pattern as Browse.tsx)

**2. Update `src/App.tsx`**

- Add lazy import: `const Companies = lazy(() => import("./pages/Companies"));`
- Add route: `<Route path="/companies" element={<Companies />} />`

### Technical Notes
- No database changes needed — sample data for now
- Follows existing Browse.tsx patterns for layout, animation, and card styling
- Multi-select uses Popover + Checkbox pattern (no new dependencies)

