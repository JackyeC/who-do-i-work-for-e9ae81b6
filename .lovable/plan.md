

## Off-the-Record Signals — Implementation Plan

### Files

| File | Action |
|------|--------|
| `supabase/functions/off-the-record-scan/index.ts` | **Create** — edge function |
| `src/components/company/OffTheRecordSignals.tsx` | **Create** — UI component |
| `src/pages/CompanyProfile.tsx` | **Edit** — add to SECTION_RENDERERS |
| `src/lib/personaConfig.ts` | **Edit** — add `off_the_record` to persona section orders |

### 1. Edge Function: `off-the-record-scan`

Single edge function using `resilientSearch` + Gemini summarization. Caches in existing `social_media_scans` table with `scan_type = 'off_the_record'`.

**Flow:**
1. Check cache (7-day TTL) — return cached themes if fresh
2. Run 3 forum-targeted search queries via `resilientSearch`:
   - `site:reddit.com "${companyName}" (layoffs OR PIP OR culture OR RTO OR burnout OR interview)`
   - `site:teamblind.com OR site:fishbowlapp.com "${companyName}" (culture OR compensation OR management OR hiring freeze)`
   - `"${companyName}" employee review forum (toxic OR work-life balance OR leadership OR layoffs)`
3. Pass results to Gemini (`google/gemini-2.5-flash`) with a prompt to extract 2–4 recurring themes, each with: `label`, `summary`, `confidence` (low/medium only), `recency`, `mentionCount`, `sentimentDirection`
4. Threshold: LLM instructed to return empty array if fewer than 3 independent mentions support any theme
5. Store themes in `social_media_scans.results` as JSONB, set `scan_type = 'off_the_record'`
6. Return `{ success, themes[], insufficient: boolean, source }`

**No second-model pass by default** — only the primary Gemini call. The prompt will instruct the model to be conservative and flag uncertainty.

**Rate limit handling**: 429/402 errors surfaced to client.

### 2. UI Component: `OffTheRecordSignals.tsx`

Self-contained component with `useQuery` that calls the edge function.

**Props**: `companyId: string`, `companyName: string`

**Rendering rules:**
- If no themes or `insufficient: true` → return `null` (section disappears)
- Section header: "Off-the-Record Signals"
- Subtext: "Patterns from recent public discussion. Not a verified company disclosure."
- 2–4 theme cards, each showing:
  - Bold label
  - One-sentence summary
  - Confidence badge (Low/Medium) via existing `ConfidenceBadge` component
  - Recency indicator (e.g., "Last 30–60 days") using colored dot style from `SignalFreshness`
- Context note at bottom (reusing `ContextNote` pattern): "These patterns are derived from public discussion forums. They reflect recurring themes, not verified facts."
- Optional collapsible "View source threads" per theme (collapsed by default, never shows raw posts)

### 3. CompanyProfile.tsx Integration

Add `off_the_record` key to `SECTION_RENDERERS` (~line 1369, before the closing `}`):

```tsx
off_the_record: () => (
  <section className="mb-10 scroll-mt-28">
    <OffTheRecordSignals companyId={dbCompanyId || ""} companyName={name} />
  </section>
),
```

No `SectionHeader` wrapper — component self-manages its header and hides when no data.

### 4. Persona Config Updates

Add `off_the_record` to each persona's section lists as a **secondary/supporting** section:

- **job_seeker**: Add to `stability_health` bucket sections (after `workforce_stability`)
- **employee**: Add to `reputation` bucket sections (after `public_records`)
- **recruiter**: Add to `talent_brand` bucket sections
- **hr_tech_buyer / journalist / employer**: Add to `secondarySections`

This places it below primary structured signals, consistent with its role as a supporting layer.

### 5. Config.toml

Add entry for the new edge function:
```toml
[functions.off-the-record-scan]
verify_jwt = false
```

### No Schema Changes

Reuses `social_media_scans` table with `scan_type = 'off_the_record'`. All existing columns accommodate the data (themes stored in `results` JSONB, summary in `ai_summary`).

