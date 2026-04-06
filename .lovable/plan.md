

# Better "What's Missing" Spreadsheet

## Problem
The current CSV only lists company names — it doesn't tell you **what** is missing for each one, so you can't prioritize or know what to look up.

## Plan
Generate a new spreadsheet with clear columns showing exactly what each company is missing:

**Columns:**
| Company Name | Industry | State | Has Website URL? | Has Domain? | Has Description? | Vetted Status | Identity Status | Website URL (if any) |
|---|---|---|---|---|---|---|---|---|

- **Has Website URL?** — YES / **MISSING** (highlighted red)
- **Has Domain?** — YES / **MISSING**
- **Has Description?** — YES / MISSING
- **Vetted Status** — verified / **unverified**
- **Identity Status** — complete / partial / **missing**
- If a URL exists but domain is missing, show the URL so you know it's partially done

**Formatting:**
- Red highlight on cells that say "MISSING" so gaps jump out visually
- Filter-ready headers so you can sort by what's missing
- Includes ALL companies with any gap (not just missing URLs)

**Output:** `WDIWF_Whats_Missing.xlsx` with conditional formatting, written to `/mnt/documents/`

**Technical:** Single SQL query pulling `name, industry, state, website_url, domain, identity_status, vetted_status, description IS NOT NULL` for all companies where any field is incomplete, exported via openpyxl with red fills on missing cells.

