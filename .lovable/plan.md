

# The Receipts → JRC EDIT Rebrand: Audit & Gap Analysis

This is a massive spec. Here's what already exists, what's missing, and a phased plan to bridge the gap without breaking any protected infrastructure.

## What Already Exists (Matching the Spec)

| Spec Requirement | Current Status |
|---|---|
| Vertical scrolling feed of editorial cards | Built — `Receipts.tsx` with `ReceiptCard.tsx` |
| Heat Level system (5 levels, labels, colors) | Built — `heat-config.ts`, `HeatChip.tsx`, `SpicePeppers.tsx` |
| Source Bias spectrum (5-point) | Built — `BiasBar.tsx`, `ReceiptsSidebar.tsx` legend |
| Jackye's Take (expandable) | Built — toggle in `ReceiptCard.tsx` |
| The Receipt / receipt_connection | Built — shown inside expanded take |
| Category filtering + sorting (Newest/Hottest/Drama) | Built — `ReceiptsFilters.tsx` |
| Heat level filtering | Built — filter pills in `ReceiptsFilters.tsx` |
| Share buttons (LinkedIn, X, FB) | Built — share bar in `ReceiptCard.tsx` |
| Download as image (html2canvas) | Built — "Save Image" button |
| JSON-LD structured data | Built — `usePageSEO` hook with jsonLd |
| Realtime feed updates | Built — `useReceiptsFeed` with Supabase Realtime |
| Poster system | Built — `ReceiptPoster.tsx`, `PosterLightbox.tsx` |
| Sidebar (newsletter signup, hottest takes, bias legend) | Built — `ReceiptsSidebar.tsx` |
| Search across receipts | Built — `ReceiptsFilters.tsx` |

## What's Missing or Mismatched

### 1. Categories Don't Match the Spec
**Spec says**: The Daily Grind, The C-Suite, The Tech Stack, The Paycheck, The Fine Print (5 editorial categories)
**Currently**: structure, money, behavior, influence, momentum, context, off_the_record (7 data categories)

**Decision needed**: The current 7 categories map to the data ingestion framework (which is protected infrastructure). The spec's 5 categories are editorial labels. We should **map** the 7 data categories to the 5 editorial display labels rather than replacing the data model.

### 2. Heat Level Colors Don't Match
**Spec**: Slate Gray → Sage → Electric Blue → Amber → Emergency Red
**Currently**: muted-foreground → civic-gold → orange-400 → destructive → hot-pink

### 3. "JRC EDIT" Branding — Not Built
- No "JRC EDIT" watermark on cards/images
- No Didot/Bodoni serif headlines
- No handwritten script font for "The Take"
- No "Magazine Gloss" hover effect (white sweep + 2° tilt)
- No Easter Egg snarky tooltips on heat labels

### 4. Card Schema — Partially Built (6 of 9 fields)
**Built**: Category, Source, Heat Level, The Receipt, The Take, Read the Source
**Missing**: Bias (hidden on mobile, visible on expand — bias bar exists but always visible), Why It Matters, Use This (dynamic CTA)

### 5. Floating Bubble — Not Built
No persistent floating circular element with headshot, pulsing ring, snarky one-liners, or slide-in CTA menu.

### 6. Conversion Engine — Not Built
- No dynamic "Use This" CTA logic per category
- No "Fix This" / "Is your company doing this?" secondary CTA
- No logic-gate content (email capture for Heat 4-5 templates)
- No "Join the Heat Map" email capture modal
- No "Special Edition" interstitial every 5th card

### 7. /llms.txt — Not Built

### 8. GEO "Direct Answer" Block — Not Built
No plain-text 2-3 sentence summary at top of each article for AI extraction.

---

## Proposed Implementation Plan (Phased)

### Phase 1: Visual Rebrand (Biggest Impact, Lowest Risk)
1. **Update heat level colors** in `heat-config.ts` to match spec (Slate → Sage → Electric Blue → Amber → Red)
2. **Map data categories to editorial labels** — update `CATEGORY_DISPLAY` in `ReceiptCard.tsx` to: structure→"THE FINE PRINT", money→"THE PAYCHECK", behavior→"THE DAILY GRIND", influence→"THE C-SUITE", momentum→"THE DAILY GRIND", context→"THE TECH STACK", off_the_record→"THE DAILY GRIND"
3. **Add "JRC EDIT" watermark** to `ReceiptPoster.tsx` and card footer — thin serif, bottom-right, 1s fade-in
4. **Add "Magazine Gloss" hover effect** — CSS class with white sweep gradient + subtle tilt on card hover
5. **Easter Egg tooltips** on heat labels in `HeatChip.tsx`

### Phase 2: Card Schema Completion
6. **Add "Why It Matters"** field — hidden on mobile collapsed, shown on expand (can use `receipt_connection` or add new field)
7. **Add dynamic "Use This" CTA** at bottom of expanded card — text/link changes based on category mapping
8. **Add "Fix This" secondary CTA** — "Is your company doing this? → Solve My Puzzle" link on every expanded card
9. **Bias field** — already rendered, just needs mobile hide/show logic on expand

### Phase 3: Floating Bubble + Conversion
10. **Create `FloatingBubble.tsx`** — persistent bottom-right circle with headshot, pulsing heat-color ring, hover speech bubble with rotating Jackye-isms, click opens slide-in menu with 3 CTAs
11. **"Special Edition" interstitial** — every 5th card in feed renders a consulting CTA card
12. **Email capture modal** — triggered on Heat 4-5 "Use This" clicks and "Exposed" story clicks

### Phase 4: GEO & SEO
13. **Update JSON-LD** on Receipts to use `Review` + `Analysis` schema with full author attribution
14. **Create `/llms.txt`** — markdown file with site authority summary
15. **Add "Direct Answer" block** — 2-3 sentence plain-text summary at top of each article

### Technical Details

**Files to edit:**
- `src/components/receipts/heat-config.ts` — update colors
- `src/components/receipts/HeatChip.tsx` — add tooltips
- `src/components/receipts/ReceiptCard.tsx` — category mapping, "Use This" CTA, "Fix This" CTA, "Why It Matters", mobile bias toggle
- `src/components/receipts/ReceiptPoster.tsx` — JRC EDIT watermark
- `src/index.css` or `tailwind.config.ts` — Magazine Gloss hover class

**Files to create:**
- `src/components/receipts/FloatingBubble.tsx`
- `src/components/receipts/SpecialEditionCard.tsx`
- `src/components/receipts/EmailCaptureModal.tsx`
- `public/llms.txt`

**No database changes required** — this is all UI/presentation layer.

