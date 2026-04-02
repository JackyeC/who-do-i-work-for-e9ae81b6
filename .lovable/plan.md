

## Plan: Fix "Why It Matters" + Add Poster Archetypes

### File 1: `src/components/receipts/ReceiptCard.tsx` (lines 152-158)

Replace the "Why It Matters" block to prefer `article.why_it_matters` array:

```tsx
{/* ── 9. Why It Matters ── */}
<div className="p-5 rounded-lg border border-border/50 bg-card mb-5">
  <p className="text-sm font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Why It Matters</p>
  {article.why_it_matters && article.why_it_matters.length > 0 ? (
    <ul className="list-disc list-inside space-y-1.5">
      {article.why_it_matters.map((point, i) => (
        <li key={i} className="text-base text-foreground/80 leading-relaxed">{point}</li>
      ))}
    </ul>
  ) : (
    <p className="text-base text-foreground/80 leading-relaxed">
      {article.receipt_connection || article.jackye_take || "This story impacts how employers treat workers and how workers navigate their careers."}
    </p>
  )}
</div>
```

### File 2: `src/components/receipts/heat-config.ts`

Append at end of file — exported constant with 4 poster archetype family names (metadata only, no rendering impact):

```ts
export const POSTER_ARCHETYPES = [
  "Happy Corporate Lie",
  "Miracle Product Pitch",
  "Family Values Office Ad",
  "Scientific Progress Ad",
] as const;

export type PosterArchetype = (typeof POSTER_ARCHETYPES)[number];
```

### Not changed
- Heat labels — kept as-is
- No "Most Shared" sort added
- No routes, schemas, or new components

