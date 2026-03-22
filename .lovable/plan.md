

## Current State

The W? logomark JSX and Inter 900 font are **already implemented** exactly as specified:

- **`src/components/layout/TopBar.tsx` (lines 154-157)**: Contains the W? logo with `fontFamily:"'Inter',sans-serif"`, `fontWeight:900`, `letterSpacing:"-0.03em"`, `fontSize:"26px"`, colors `#111111` and `#F0C040`.
- **`index.html` (line 8)**: Already loads `Inter:wght@900`.

## Likely Issue

The "W" is hardcoded to `#111111` (near-black). If the site is rendering in **dark mode**, the "W" is invisible against the dark background. This would make it look like only "?" appears, or that the logo is missing entirely.

## Plan

1. **Update the logo span** in `TopBar.tsx` (line 154-157) to match the user's exact JSX (remove extra `lineHeight` and `display` properties, remove quotes around `Inter`) and use a **theme-aware color** for the "W":
   - Use `currentColor` or `inherit` so it picks up `text-foreground` from the parent, **or**
   - Keep `#111111` if the user truly wants it black-only (but flag the dark-mode issue).

   Since the user explicitly specified `color:"#111111"`, I will apply it exactly as given. If it's invisible in dark mode, that's a follow-up fix.

2. **No changes needed** to `index.html` — Inter 900 is already loaded.

### Files to Edit
- `src/components/layout/TopBar.tsx` — lines 154-157: replace with the user's exact JSX (minor cleanup of extra style properties).

