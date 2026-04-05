

# Tier 2 Flow Polish: Transition Speed, Action-First, Dead State Removal

## What this achieves
Every moment a user is reading instead of acting, or staring at a static screen, is friction. This plan targets three categories: speeding up transitions, putting interactive elements before prose, and eliminating blank/dead moments.

---

## Changes

### 1. Quiz transition speed tuning
**File:** `src/pages/Quiz.tsx`

The slide track uses `transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)"` (line 710-711). This is perceptibly slow when tapping through quickly.

- Reduce slide transition from **0.5s → 0.35s**
- Auto-advance after tile selection: when a user taps a tile answer, wait **400ms** then auto-advance to the next question (no need to press "Next"). Slider questions still require manual "Next" press.
- This eliminates one tap per question (7 questions = 7 fewer taps).

### 2. Hero: action before reading
**File:** `src/pages/Index.tsx`

The hero currently staggers: eyebrow (0.15s) → headline (0.3s) → subheadline paragraph (0.6s) → CTA button (0.9s) → search bar (1.2s) → bottom tagline (1.4s). The CTA and search bar appear **last**, meaning users read for 1.2 seconds before they can act.

- Move CTA + search bar animation timing **earlier**: CTA at **0.5s**, search bar at **0.7s**
- Push the subheadline paragraph to **0.8s** and bottom tagline to **1.0s** (reading content loads after action elements)
- This puts the input field in front of the user ~500ms sooner

### 3. Offer Check: eliminate loading dead space
**File:** `src/pages/OfferCheckEntry.tsx`

When results load, there are 3 plain skeletons with no context. Users see rectangles and don't know what's happening.

- Add a pulsing text label below skeletons: "Pulling public records for [company name]…"
- Use `motion.p` with `animate-pulse` so it feels alive, not dead

### 4. Dashboard tab transitions — remove exit flicker
**File:** `src/pages/Dashboard.tsx`

Tab content uses `AnimatePresence mode="wait"` with exit animation `y: -8`. The `mode="wait"` means old content must fully exit before new content enters, creating a visible blank gap.

- Change to `mode="popLayout"` so incoming content renders immediately while old content fades out underneath
- Reduce transition duration from **0.25s → 0.18s**

### 5. Intelligence Check form — action-first layout
**File:** `src/pages/IntelligenceCheck.tsx`

The form currently shows a title, description paragraph, then the form fields. Users read before acting.

- Move the first form field (employer name) into the hero area alongside the headline, so the input is visible immediately on load
- Collapse the explanatory paragraph into a single-line subtitle

### 6. Hero suggestion chips — instant fill + submit
**File:** `src/components/landing/HeroScanInput.tsx`

Currently clicking "SpaceX" etc. only fills the input — user must still press "Run My Free Scan". This is a dead moment.

- Change suggestion click to **fill AND auto-submit** after a 150ms visual fill delay, so users see the text appear then immediately navigate

---

## Technical details

| File | Key change |
|------|-----------|
| `Quiz.tsx` L710 | `0.5s → 0.35s` transition | 
| `Quiz.tsx` TileGrid `onSelect` | Add 400ms auto-advance timeout, clear on unmount |
| `Index.tsx` L89,103,81,108 | Reorder animation delays: CTA 0.5s, search 0.7s, subhead 0.8s, tagline 1.0s |
| `OfferCheckEntry.tsx` L324-329 | Add contextual loading message below skeletons |
| `Dashboard.tsx` L214,220 | `mode="popLayout"`, duration 0.18s |
| `IntelligenceCheck.tsx` | Restructure hero to inline first input |
| `HeroScanInput.tsx` L215 | `onClick` → fill query + trigger submit via ref after 150ms |

All changes are additive. No routes, tables, or existing components are removed or renamed.

