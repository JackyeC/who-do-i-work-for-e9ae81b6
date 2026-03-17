

## Fix 12 Remaining Security Warnings + Populate Career Intelligence Scores

### What's Wrong
1. **12 RLS linter warnings** — the previous migration used wrong policy names in DROP statements, so all 19 permissive policies still exist unchanged.
2. **All career_intelligence_score values = 0** — `compute_all_career_intelligence_scores()` was never executed.

### Fix: Single Migration

**Drop 19 permissive policies by their exact names** (confirmed from `pg_policies`):

| Table | Policy Name | Cmd |
|-------|------------|-----|
| `board_interlocks` | `Service insert board_interlocks` | INSERT |
| `climate_signals` | `Service role full access for climate_signals` | ALL |
| `companies` | `Authenticated users can insert companies` | INSERT |
| `company_report_sections` | `Authenticated inserts report sections` | INSERT |
| `company_report_sections` | `Authenticated updates report sections` | UPDATE |
| `company_sanctions_screening` | `Authenticated inserts sanctions` | INSERT |
| `company_sanctions_screening` | `Authenticated updates sanctions` | UPDATE |
| `company_wikidata` | `Authenticated inserts wikidata` | INSERT |
| `company_wikidata` | `Authenticated updates wikidata` | UPDATE |
| `compensation_data` | `Service role can manage compensation_data` | ALL |
| `contradiction_signals` | `Service role can manage contradiction signals` | ALL |
| `gun_industry_signals` | `Service insert gun_industry_signals` | INSERT |
| `healthcare_signals` | `Service insert healthcare_signals` | INSERT |
| `immigration_signals` | `Service insert immigration_signals` | INSERT |
| `leader_enrichments` | `Service role can manage leader enrichments` | ALL |
| `regulatory_violations` | `Service insert regulatory_violations` | INSERT |
| `signal_sources` | `Service role can manage signal sources` | ALL |
| `scan_jobs` | `Authenticated inserts scan jobs` | INSERT |
| `scan_jobs` | `Authenticated updates scan jobs` | UPDATE |

**Recreate all 19 with `public.has_role(auth.uid(), 'admin')` checks.**

**Keep untouched** (intentional public access): `email_signups`, `employer_rebuttals`, `job_click_events`.

**Also clean up** any duplicate admin policies on `scan_jobs` from the failed previous migration.

**Then run** `SELECT compute_all_career_intelligence_scores()` to populate scores for all ~186 companies.

### Result
- 12 linter warnings → 0
- Career intelligence scores populated → 8 panels show real data
- No UI or edge function changes needed

