
# /newsletter Architecture & Redesign Plan

## 1. Architecture Decision: Separate Page

**Recommendation: `/newsletter` should be its own dedicated page component.**

**Why:**
- `Receipts.tsx` is already a complex 400-line page with its own feed system (`useReceiptsFeed`), filters, sidebar, poster lightbox, and deep investigations section
- The newsletter page has different goals: **subscribe-first**, **editorial curation**, **habit-forming live modules**, and **Jackye's voice front-and-center**
- `Newsletter.tsx` already exists as an orphaned component with its own feed (`useWorkNews`), story cards, filter bar, and subscribe flow — it just got disconnected from the route
- Layering newsletter modules into Receipts.tsx will create an unmaintainable monolith

**Action:** Point `/newsletter` route → `Newsletter.tsx` (restore) and redesign Newsletter.tsx as the premium editorial destination.

---

## 2. Component Inventory

### ✅ PRESERVE (already good, on-brand)
| Component | Why Keep |
|---|---|
| `WorkNewsTicker` | Live ticker at top — core to "CNN factor" |
| `ReceiptPoster` / `PosterLightbox` | Image-led poster moments — distinctive |
| `SpicePeppers` / `HeatChip` | Spice system — brand signature |
| `BiasBar` | Source transparency — trust signal |
| `EmailCapture` (landing) | Polished subscribe component with Turnstile |
| `ReceiptsSidebar` | Hottest Takes, bias legend, newsletter CTA |
| `StoryCard` (in Newsletter.tsx) | Jackye's Take always-open card — core format |
| `FoundingMemberBadge` | User engagement layer |

### 🔧 REDESIGN (structurally sound, needs editorial polish)
| Component | What Changes |
|---|---|
| Newsletter hero | Elevate to WWD-style masthead: editorial serif title, stronger type hierarchy, breathing room |
| Subscribe bar | Match the polished `EmailCapture` pattern (glow, backdrop blur, proper spacing) |
| Filter bar | Tighter, more editorial — pill style with count badges |
| Story feed layout | Move from generic grid to editorial rhythm: lead story (large), 2-up, wire items, repeating modules |
| "The Wire" section | Tighter wire-format cards, more density, less padding |

### 🆕 ADD (new editorial modules for "CNN factor")
| Module | Purpose |
|---|---|
| **"Moving Now"** banner | 1-2 breaking/developing stories, red accent, timestamp |
| **"Jackye's Current Take"** | Highlighted pull-quote block — rotates with feed |
| **"Quick Receipts"** | Dense 4-6 item bullet-style section, scannable |
| **"What to Watch"** | 2-3 developing stories with "still developing" badge |
| **"Most Read"** sidebar widget | Engagement signal (can use existing hot5 logic) |

### 🗑️ REMOVE
| Item | Why |
|---|---|
| Deep Investigations grid (from Receipts.tsx) | Belongs on `/receipts`, not newsletter |
| Duplicate subscribe logic in Receipts.tsx | Newsletter owns its own subscribe flow |
| Newsletter.tsx orphan status | Reconnect to route |

---

## 3. Proposed Page Structure

```
┌─────────────────────────────────────────┐
│  WorkNewsTicker (live, filtered)        │
├─────────────────────────────────────────┤
│  MASTHEAD                               │
│  "The Receipts" — large editorial serif  │
│  Tagline + Jackye attribution           │
│  ─── Subscribe Bar (polished) ───       │
│  "Free forever. No spam."              │
├─────────────────────────────────────────┤
│  🔴 MOVING NOW (if breaking stories)    │
│  1-2 developing headlines, timestamps   │
├──────────────────────┬──────────────────┤
│  FILTER BAR          │                  │
├──────────────────────┤                  │
│  LEAD STORY (large)  │  SIDEBAR         │
│  poster + take       │  · Most Read     │
│                      │  · Bias Legend   │
├──────────────────────┤  · Subscribe CTA │
│  JACKYE'S TAKES      │  · Quick Receipts│
│  2-up grid           │                  │
├──────────────────────┤                  │
│  WHAT TO WATCH       │                  │
│  2-3 developing      │                  │
├──────────────────────┤                  │
│  THE WIRE            │                  │
│  Dense 3-col grid    │                  │
├──────────────────────┴──────────────────┤
│  FOOTER CTA + attribution              │
└─────────────────────────────────────────┘
```

---

## 4. Image / Poster Plan

- **Lead story**: Full-width `ReceiptPoster` with poster click → lightbox
- **Jackye's Takes section**: Cards include poster thumbnail (small) on left, take on right
- **Visual rhythm**: Every 5th card gets a poster moment (already exists via `SpecialEditionCard` pattern)
- **No text-only zones** longer than 3 cards without a visual break

---

## 5. Implementation Plan

1. **Route swap**: Point `/newsletter` → `Newsletter.tsx`
2. **Remove newsletter logic from Receipts.tsx** (revert the subscribe bar addition, keep Receipts clean)
3. **Redesign Newsletter.tsx** hero/masthead with editorial typography
4. **Upgrade subscribe bar** to match `EmailCapture` polish
5. **Add editorial modules**: Moving Now, Jackye's Current Take, Quick Receipts, What to Watch
6. **Add sidebar** (reuse `ReceiptsSidebar` or build newsletter-specific variant)
7. **Integrate poster moments** into the feed layout
8. **Verify ticker filtering** is consistent

No destructive changes until approved.
