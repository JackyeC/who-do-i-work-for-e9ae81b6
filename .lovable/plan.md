

# JRC EDIT Spec — Gap Analysis

The previous message already implemented the vast majority of this spec. Here's what's built vs. the remaining gaps:

## Already Implemented (Previous Message)

| Spec Requirement | Status |
|---|---|
| Heat level colors (Slate→Sage→Blue→Amber→Red) | Done — `heat-config.ts` |
| 5 editorial categories mapped from 7 data categories | Done — `heat-config.ts` |
| JRC EDIT watermark on cards + posters (1s fade-in) | Done — `ReceiptCard.tsx`, `ReceiptPoster.tsx` |
| Magazine Gloss hover (white sweep + 2° tilt) | Done — `index.css` |
| Easter Egg snarky tooltips on heat chips | Done — `HeatChip.tsx` |
| 9-field card schema (Category, Source, Bias, Heat, Receipt, Take, Why It Matters, Use This, Read the Source) | Done — `ReceiptCard.tsx` |
| Bias hidden on mobile, shown on expand | Done |
| Dynamic "Use This" CTA per category | Done |
| "Fix This" / "Solve My Puzzle" secondary CTA | Done |
| Special Edition interstitial every 5th card | Done — `SpecialEditionCard.tsx` |
| Floating Bubble with Jackye-isms + 3 CTAs | Done — `FloatingBubble.tsx` |
| Email Capture Modal ("Join the Heat Map") | Done — `EmailCaptureModal.tsx` |
| JSON-LD with Review + Analysis schema | Done — `Receipts.tsx` |
| llms.txt | Done — `public/llms.txt` |
| Share bar (LinkedIn, X, FB, Save Image) | Done |
| Category filtering + sorting (Newest/Hottest/Drama) | Done |

## Remaining Gaps (3 items)

### 1. Logic-Gate Content (Email wall for Heat 4-5 "Use This")
The spec says Heat 4-5 stories should require email capture before showing "Use This" templates. Currently, the "Use This" CTA links directly without gating.

**Fix**: In `ReceiptCard.tsx`, when `spice_level >= 4`, clicking "Use This" triggers the `EmailCaptureModal` instead of navigating directly. Store unlock state in localStorage.

### 2. "Direct Answer" Block for RAG
Each article should start with a 2-3 sentence plain-text summary block before the editorial content, optimized for AI citation extraction.

**Fix**: Add a `<p>` block at the top of each `ReceiptCard` (before the poster) with a neutral summary derived from the headline + receipt_connection. Hidden visually with `sr-only` or shown as subtle lead text.

### 3. Email Capture Modal Not Wired
The `EmailCaptureModal` component exists but `showEmailCapture` is never set to `true` anywhere in `Receipts.tsx`.

**Fix**: Wire the modal to trigger on "Exposed" story clicks and Heat 4-5 "Use This" gate logic.

---

## Implementation

### Files to edit
- `src/components/receipts/ReceiptCard.tsx` — add logic-gate for Heat 4-5 "Use This", add Direct Answer block
- `src/pages/Receipts.tsx` — wire EmailCaptureModal trigger via callback prop

### No new files needed. No database changes.

