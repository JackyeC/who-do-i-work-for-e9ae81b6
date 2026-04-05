

# Emotional Feedback Layer — Every Action Reacts

## The gap
The app has zero tactile feedback on most interactive elements. The `Button` component has `active:scale-[0.97]` but raw `<button>` elements (quiz tiles, hero CTA, suggestion chips, form submits) have no press/hover response. Submissions complete silently or with minimal acknowledgment.

## Changes

### 1. Quiz tile press feedback
**File:** `src/pages/Quiz.tsx` — `TileGrid` component

Add `transform: scale(0.97)` on `:active` state to the tile buttons (currently only scale up to 1.02 on select). Also add a brief border-glow pulse when selected — a 300ms box-shadow animation using the gold color.

### 2. Quiz advance — progress bar celebration
**File:** `src/pages/Quiz.tsx`

When the progress bar reaches 100% (last question answered), flash the bar to full brightness for 400ms before transitioning to the results screen. Add a CSS transition on `box-shadow` for the progress bar element.

### 3. Hero CTA press feedback
**File:** `src/pages/Index.tsx`

The "Get a free employer intelligence check" button is a raw `<button>` with no press state. Add `active:scale-[0.97]` and `transition-transform` to match the `Button` component behavior.

### 4. Hero suggestion chips — visual fill confirmation
**File:** `src/components/landing/HeroScanInput.tsx`

When a suggestion chip is clicked, briefly highlight it (background flash to `primary/20` for 150ms) before the auto-submit fires. Add `active:scale-95` to all chips for press feedback.

### 5. "Run My Free Scan" button press state
**File:** `src/components/landing/HeroScanInput.tsx`

The submit button inside the search bar is a raw `<button>`. Add `active:scale-[0.97]` for tactile press feel, matching the global Button component.

### 6. Intelligence Check — form field focus glow
**File:** `src/pages/IntelligenceCheck.tsx`

Add a subtle `ring-1 ring-primary/30` focus style to all form inputs, so typing into a field feels acknowledged. The inlined employer_name input in the hero should pulse its border once on mount (auto-focused).

### 7. Intelligence Check — submit button ripple
**File:** `src/pages/IntelligenceCheck.tsx`

Add `active:scale-[0.97]` to the submit button. After successful submission, the confirmation icon already bounces in — add a subtle confetti-like radial gradient pulse behind it (a single 600ms CSS animation, no library needed).

### 8. Email capture — input focus glow
**File:** `src/components/landing/EmailCapture.tsx`

Add `focus-within:ring-1 focus-within:ring-primary/30` to the form wrapper so the entire input area glows when the user starts typing.

### 9. Global: file upload drop zone feedback
**File:** `src/components/landing/HeroScanInput.tsx`

When a file is dragged over the upload zone, add a `border-primary` + `bg-primary/5` state so the drop target lights up. Currently it only has `hover:border-primary/40`.

---

## Technical summary

| File | Change |
|------|--------|
| `Quiz.tsx` TileGrid | `:active` scale + selected glow pulse |
| `Quiz.tsx` progress bar | 100% celebration flash |
| `Index.tsx` hero CTA | `active:scale-[0.97]` |
| `HeroScanInput.tsx` chips | `active:scale-95` + background flash |
| `HeroScanInput.tsx` submit | `active:scale-[0.97]` |
| `HeroScanInput.tsx` drop zone | Drag-over visual state |
| `IntelligenceCheck.tsx` inputs | Focus ring glow |
| `IntelligenceCheck.tsx` submit | Press scale + success radial pulse |
| `EmailCapture.tsx` form | Focus-within glow |

All changes are CSS/inline-style additions. No layout, copy, or routing changes. No new dependencies.

