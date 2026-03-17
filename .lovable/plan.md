

## Show Founders, Ownership & Company Identity for Private Companies

### Problem
179 private companies in the database have zero founder data. The `StartupDNACard` component exists but is never rendered on the Company Profile. The "Private Company Intelligence Notice" only says "we don't have SEC data" — it doesn't tell users **who runs the company** or its backstory.

### What to Build

**1. New component: `PrivateCompanyIdentityCard`**

A dedicated card rendered **only for private companies** (`is_publicly_traded === false`) that surfaces:
- **Founders / Owners** (from `founder_names` column)
- **Founder backgrounds** (from `founder_previous_companies`)  
- **Founded year** and **Funding stage** (existing columns)
- **Parent company** (existing column, with link if in DB)
- **Employee count** (existing column)
- **Company description** (existing column)
- **Ownership structure** (from `company_corporate_structure` table)

When founder data is missing (currently 179/179 private companies), it shows a clear "Ownership data not yet available — trigger a scan to populate" message with a scan button.

**2. Enrich the `enrich-private-company` edge function**

Add a Perplexity AI prompt section that specifically asks for:
- Founder/owner names
- Founded year
- Company history and key milestones
- Current ownership structure (family-owned, PE-backed, employee-owned, etc.)

Then write the results back to `companies.founder_names`, `companies.founded_year`, `companies.parent_company`, and `companies.description`.

The function already has a Perplexity section — extend its prompt and the write-back logic to populate these fields.

**3. Render `StartupDNACard` for startups**

For companies where `is_startup === true`, render the existing `StartupDNACard` in the profile (it's already built, just not wired up).

**4. Render `PrivateCompanyIdentityCard` in CompanyProfile.tsx**

Place it directly after the "Private Company Intelligence Notice" card (line ~659), before the Narrative Gap Card. This is the natural position — "here's what kind of company this is" right after "this is a private company."

### Technical Changes

| File | Change |
|------|--------|
| `src/components/company/PrivateCompanyIdentityCard.tsx` | **New** — renders founder, ownership, history for private companies |
| `src/pages/CompanyProfile.tsx` | Import and render `PrivateCompanyIdentityCard` + `StartupDNACard` for private/startup companies |
| `supabase/functions/enrich-private-company/index.ts` | Extend Perplexity prompt to request founder names, history, ownership type; write back to `companies` table |

### No Schema Changes
All required columns (`founder_names`, `founded_year`, `parent_company`, `funding_stage`, `founder_previous_companies`, `description`, `employee_count`) already exist on the `companies` table.

