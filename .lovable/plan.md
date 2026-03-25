

## Add "Stop Applying. Start Aligning." to the Homepage

The tagline doesn't exist anywhere in the codebase currently. Based on your instructions, it should appear in **3 places** on `src/pages/Index.tsx` — each serving a different purpose.

### Placement 1 — Hero accent line (after the search bar micro-text, ~line 115)
A standalone statement below the data sources line. Big, bold, centered, with whitespace. No box, no emoji.

```
Stop applying. Start aligning.
```

Small, clean, Helvetica-bold with slight letter-spacing. Sits between the search bar and the ticker.

### Placement 2 — Before the Integrity Gap section (~line 289)
A full-width divider statement that reframes what comes next:

```
Stop applying. Start aligning.
What the data shows — no opinions, no rankings, just patterns.
```

This sits between the "Start Here" pricing tiers and the Integrity Gap section as a transitional beat.

### Placement 3 — Bottom CTA section (replace generic CTA copy, ~line 423)
Replace the current headline "The hiring process is about to get a lot more honest." with:

```
Stop applying. Start aligning.
```

Subtext becomes: "You don't need more applications. You need better decisions."
Buttons stay the same.

### Design rules
- Bold, centered, generous whitespace
- No box/border/card around it
- Font: `font-sans`, weight 800, slight tracking
- Muted subtext below where applicable
- No emoji

### File changed
- `src/pages/Index.tsx` — 3 insertions/edits, no deletions of existing sections

