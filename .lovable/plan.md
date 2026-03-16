

## Climate Signal Engine — Receipts, Not Labels

Following the exact same architecture as Labor Rights and Immigration engines.

### 1. Database Table: `climate_signals`

```sql
CREATE TABLE public.climate_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'climate',
  signal_type text NOT NULL, -- sbti_target, cdp_disclosure, ghg_emissions, climate_lobbying, climate_litigation, coalition_membership
  facility_name text,
  emissions_amount numeric,
  emissions_unit text, -- metric_tons_co2e
  target_year integer,
  target_description text,
  score text, -- CDP score (A, B, C, D, F)
  location_state text,
  description text,
  source_name text NOT NULL,
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);
-- Public read RLS, indexes on company_id and signal_type
```

### 2. Edge Function: `sync-climate-signals`

Pulls from 2 free government/public APIs per company:

| Source | Endpoint | Signal Types |
|--------|----------|-------------|
| EPA GHGRP (Greenhouse Gas Reporting) | `https://data.epa.gov/efservice/ghg_emitter_sector` | `ghg_emissions` |
| EPA ECHO (Enforcement) | `https://echo.epa.gov/api` | `epa_violation`, `epa_enforcement` |

Also writes summary rows to `issue_signals` with `issue_category = 'climate'` for the unified pipeline.

### 3. Edge Function: `seed-climate-companies`

Seeds ~12 companies with known climate activity (both high-emitters and leaders):

| Company | Known Activity |
|---------|---------------|
| ExxonMobil | Top GHG emitter, climate lobbying, litigation target |
| Chevron | Major emitter, climate lawsuits |
| Shell (via US ops) | Net-zero pledge + continued fossil fuel expansion |
| Duke Energy | Largest US utility emitter |
| NextEra Energy | Largest US renewable energy producer |
| Tesla | Zero direct emissions, climate advocacy |
| Microsoft | Carbon negative pledge (2030) |
| Amazon | Climate Pledge co-founder |
| BP America | Net-zero target, greenwashing litigation |
| Marathon Petroleum | Refinery emissions, lobbying against clean fuel standards |
| Patagonia | 1% for the Planet, climate activism |
| Dow Chemical | Major industrial emitter, EPA reporting |

### 4. Daily Refresh

Add `sync-climate-signals` to the `daily-gov-data-refresh` GOV_SOURCES array.

### 5. Influence Network Map

Add climate-specific nodes to `FollowTheMoney.tsx`:
- **Companies**: Chevron, Duke Energy, NextEra Energy, Marathon Petroleum
- **Agencies**: EPA
- **Legislation**: Clean Air Act amendments, IRA clean energy provisions
- **Committees**: Senate EPW (already exists), House Energy & Commerce
- **Coalitions**: Climate Action 100+, Oil & Gas Climate Initiative
- **Politicians**: Climate committee members

Expand the existing ExxonMobil chain and add new distinct companies for the Climate filter.

### 6. SignalSourceLink

Add entries for `EPA GHGRP`, `SBTi`, `CDP`, `InfluenceMap`, `Climate Case Chart`.

### Files to Create/Modify
1. **Create** migration for `climate_signals` table
2. **Create** `supabase/functions/sync-climate-signals/index.ts`
3. **Create** `supabase/functions/seed-climate-companies/index.ts`
4. **Modify** `supabase/functions/daily-gov-data-refresh/index.ts` — add climate to nightly refresh
5. **Modify** `supabase/config.toml` — register new functions
6. **Modify** `src/pages/FollowTheMoney.tsx` — add climate company nodes with full influence chains
7. **Modify** `src/components/SignalSourceLink.tsx` — add climate source URLs

