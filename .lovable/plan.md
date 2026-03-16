

## Immigration Signal Engine — Mirroring the Labor Rights Pattern

### What We'll Build

Following the exact same architecture as the Labor Rights Signal Engine, we'll create an **Immigration Signal Engine** that surfaces documented immigration-related activity from free government APIs. No judgments — just receipts.

### Components

**1. Database Table: `immigration_signals`**

```sql
CREATE TABLE public.immigration_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  signal_category text NOT NULL DEFAULT 'immigration',
  signal_type text NOT NULL, -- h1b_sponsorship, visa_lca, immigration_lobbying, i9_violation, coalition_membership, policy_statement
  case_number text,
  filing_date date,
  resolution_date date,
  visa_type text, -- H-1B, H-2A, H-2B, L-1, etc.
  job_title text,
  wage_offered numeric,
  workers_affected integer,
  location_state text,
  description text,
  source_name text NOT NULL,
  source_url text,
  confidence text DEFAULT 'direct',
  evidence_text text,
  created_at timestamptz DEFAULT now()
);
-- Public read RLS, indexed on company_id and signal_type
```

**2. Edge Function: `sync-immigration-signals`**

Pulls from 3 free government data sources per company:

| Source | API | Signal Types |
|--------|-----|-------------|
| DOL Foreign Labor (H-1B/H-2A/H-2B LCA data) | `https://api.dol.gov/v4/get/eta/h1b_disclosure_data` | `h1b_sponsorship`, `h2a_sponsorship`, `h2b_sponsorship` |
| DOL Foreign Labor Performance | `https://www.dol.gov/agencies/eta/foreign-labor/performance` (JSON datasets) | `visa_lca` (Labor Condition Applications) |
| ICE/DOJ Enforcement (search-based) | Structured queries against public records | `i9_violation`, `immigration_enforcement` |

Also cross-references existing OpenFEC data for immigration-related lobbying (issue code "IMM") and writes summary signals to `issue_signals` for the unified pipeline.

**3. Edge Function: `seed-immigration-companies`**

Seeds ~12 companies known for immigration-related activity (documented, not judged):

| Company | Known Activity |
|---------|---------------|
| Google | Top H-1B sponsor (~8,000+ LCAs/yr) |
| Amazon | Major H-1B sponsor, warehouse H-2B |
| Microsoft | Top H-1B sponsor, immigration advocacy |
| Meta | High H-1B volume, advocacy coalition |
| Infosys | Largest H-1B sponsor by volume |
| Tata Consultancy | Major H-1B outsourcing sponsor |
| JPMorgan Chase | Large H-1B program, lobbying activity |
| Tyson Foods | H-2A/H-2B agricultural visas, ICE enforcement history |
| Walmart | H-1B + immigration lobbying |
| Deloitte | Large H-1B consulting sponsor |
| Apple | H-1B sponsor, public advocacy statements |
| Marriott | H-2B hospitality visas |

**4. Daily Refresh** — Add `sync-immigration-signals` to the `daily-gov-data-refresh` GOV_SOURCES array.

**5. Influence Network Map** — Add immigration-specific nodes to `FollowTheMoney.tsx`:
- Companies with H-1B/visa data linked to immigration legislation (e.g., DREAM Act, EAGLE Act)
- Immigration committees (Senate/House Judiciary Immigration Subcommittees)
- Advocacy coalitions (Compete America, FWD.us) as Industry/Trade nodes
- Politicians on immigration subcommittees

### Key Principle

Every signal follows the "Signal → Source → Evidence Link → Date" format. The platform documents:
- Visa sponsorship volume (DOL filings)
- Immigration lobbying activity (OpenSecrets/LDA)
- Political donations to immigration-focused legislators (OpenFEC)
- Coalition membership (public record)
- Enforcement actions (DOJ/ICE public releases)

No labels of "pro-immigration" or "anti-immigration." Just documented activity with source links.

### Files to Create/Modify
1. **Create** migration for `immigration_signals` table
2. **Create** `supabase/functions/sync-immigration-signals/index.ts`
3. **Create** `supabase/functions/seed-immigration-companies/index.ts`
4. **Modify** `supabase/functions/daily-gov-data-refresh/index.ts` — add immigration to nightly refresh
5. **Modify** `src/pages/FollowTheMoney.tsx` — add immigration company nodes with full influence chains

