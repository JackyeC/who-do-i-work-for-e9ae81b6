

## Fix: heroFadeIn compositor rendering artifact

### Problem
Six hero elements in `src/pages/Index.tsx` use `opacity: 0` inline + `animation-fill-mode: forwards`, causing GPU paint deferral and black scroll voids.

### Changes

**1. `src/pages/Index.tsx` — Remove `opacity: 0` and `forwards` from 6 hero elements:**

| Line | Current | New |
|------|---------|-----|
| 59 | `style={{ opacity: 0, animation: "heroFadeIn 0.5s ease 0.15s forwards" }}` | `style={{ animation: "heroFadeIn 0.5s ease 0.15s" }}` |
| 66–74 | `opacity: 0, animation: "heroFadeIn 0.7s ease 0.3s forwards"` | Remove `opacity: 0`, change to `animation: "heroFadeIn 0.7s ease 0.3s"` |
| 82 | `opacity: 0, animation: "heroFadeIn 0.6s ease 0.6s forwards"` | Remove `opacity: 0`, remove `forwards` |
| 90 | `opacity: 0, animation: "heroFadeIn 0.5s ease 0.9s forwards"` | Remove `opacity: 0`, remove `forwards` |
| 104 | `opacity: 0, animation: "heroFadeIn 0.4s ease 1.2s forwards"` | Remove `opacity: 0`, remove `forwards` |
| 109 | `opacity: 0, animation: "heroFadeIn 0.4s ease 1.4s forwards"` | Remove `opacity: 0`, remove `forwards` |

**2. `src/pages/Index.tsx` line 116 — Update inline keyframe:**
```css
@keyframes heroFadeIn {
  from { opacity: 0.01; transform: translateY(6px); }
  to   { opacity: 1;    transform: translateY(0);   }
}
```

**3. `src/index.css` lines 419–421 — Update global keyframe to match:**
```css
@keyframes heroFadeIn {
  from { opacity: 0.01; transform: translateY(6px); }
  to   { opacity: 1;    transform: translateY(0);   }
}
```

### What stays unchanged
Everything else — copy, colors, layout, nav, other pages, other components.

