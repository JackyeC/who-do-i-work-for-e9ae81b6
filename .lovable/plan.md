

# Fix Flagged Candidate Reasoning + Recruiter View Quality

## Two Problems

### 1. Flagged candidate reasons not visible in PACDetailDrawer
The `flag_reason` data **exists in the database** (e.g., "Anti-net neutrality stance", "Sponsored anti-privacy legislation") and is already shown inline on some pages (WhoDoIWorkFor, CandidateDetailDrawer, PolicyReceiptsPanel). But in the **PACDetailDrawer** — the main place users explore PAC spending — flagged candidates only show a red "Flagged" badge with no reason. The reasons are collapsed into a single combined string at the bottom of the section, which is easy to miss.

### 2. Recruiter View card shows fake/generic data
The `useCompanyIntegrity` hook tries to call an external API (`wdiwf-integrity-api.onrender.com`), and when it fails (which it does), it falls back to a **mock function** that generates meaningless text like *"Meta shows moderate risk indicators based on WDIWF's intelligence pipeline."* The scores (Reality Gap: 70, Insider Score: 65) are computed from `companyName.length % 4` — literally the character count of the name. This is misleading.

## Plan

### Step 1: Show flag_reason inline on each candidate in PACDetailDrawer
In `src/components/PACDetailDrawer.tsx`, add the `flag_reason` text directly under each flagged candidate row (lines 294–308), so users can see **why** each person is flagged right next to their name and amount. Keep the summary block at the bottom as a recap.

### Step 2: Replace mock Recruiter View with real DB-derived data
In `src/hooks/use-company-integrity.ts`, replace the `getMockResult` fallback with a function that queries actual database tables:
- **Reality Gap score**: derive from `company_public_stances` gap values (count of "Large"/"Medium" gaps → higher score)
- **Insider Score**: use `insider_score` if stored, or derive from executive concentration data
- **Risk level**: compute from civic_footprint_score + signal count
- **Summary**: generate from actual company data (jackye_insight, signal categories, score)

This ensures the Recruiter View card shows real, company-specific intelligence instead of character-count-derived nonsense.

### Step 3: Add "why flagged" context to the Recruiter View summary
When the company has flagged candidates in its PAC data, include a line in the recruiter summary noting how many flagged recipients exist and their top reasons.

## Files to Modify
- `src/components/PACDetailDrawer.tsx` — inline flag_reason per candidate
- `src/hooks/use-company-integrity.ts` — replace mock with real DB queries

