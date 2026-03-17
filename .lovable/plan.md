

## Reputation Pivot: From Prosecutor to Performance Coach

This overhaul shifts the platform's tone from accusatory to solution-oriented, making it easier to sell the $599 employer packages. Four changes:

### 1. New "Narrative Gap" Section on Company Profiles

Create `src/components/company/NarrativeGapCard.tsx` — a card displayed on every company profile that detects when data is sparse or stale and shows:

> *"Current public records are incomplete. [Company Name] has an opportunity to provide context and verify their 2026 alignment."*

Includes a gold "Claim This Profile & Provide Context" button linking to `/for-employers` (the certification checkout flow). Logic: show when `last_audited_at` is null/stale OR when fewer than 3 major signal groups have data.

### 2. Replace "Update the Record" Button with "Claim This Profile"

In `UpdateTheRecordButton.tsx`:
- Change button text from "Update the Record" to **"Claim This Profile & Provide Context"**
- Change styling to gold/amber variant (matching the certification tier branding)
- Keep the community submission dialog for non-employers, but add a prominent CTA at the top of the dialog linking to the $599 Certified Transparency Audit checkout

Update `AddYourStoryCTA.tsx`:
- Change copy from "Founding Partner" language to **"Narrative Alignment Package"** — *"Standard public data is only half the story. Claim your Narrative Alignment Package to provide the full context for your future talent."*

### 3. Soften Red Flags → "Review Required" (Amber)

Audit and update the key signal display components that use red/destructive styling for data signals:
- `src/components/values-check/ValuesCheckSection.tsx` — change "Conflict" badges from red to amber, label as "Review Required"
- `src/components/intelligence/EarlyWarningSignals.tsx` — swap red icons/borders to amber
- `src/components/JackyeNote.tsx` — soften red alert language
- Add amber tooltip text: *"This receipt suggests a complex institutional link. We recommend employers provide an 'Insider Context' statement to clarify their stance."*

This does NOT apply to destructive UI actions (delete buttons, error toasts) — only data signal presentation.

### 4. "Recruitment Advantage" Score

Create `src/components/company/RecruitmentAdvantageScore.tsx`:
- A small score card (0–100) on the company profile
- Factors: data completeness (do they have compensation data, DEI reports, employer rebuttal?), data freshness (`last_audited_at` recency), certification status (Gold Shield = bonus), transparency signals count
- Companies with stale/missing data score lower — framed as "Invisible to values-aligned talent" not "bad"
- Display on CompanyProfile.tsx near the CIS score

### 5. Naming Update: $599 → "Narrative Alignment Package"

Update references across:
- `src/pages/Pricing.tsx` — rename "Founding Partner" to "Narrative Alignment Package" with Gold Shield badge retained
- `src/pages/ForEmployers.tsx` — same rename
- `src/components/AddYourStoryCTA.tsx` — update copy
- `src/components/jobs/JobListRow.tsx` — update tooltip text

### Files to Create
- `src/components/company/NarrativeGapCard.tsx`
- `src/components/company/RecruitmentAdvantageScore.tsx`

### Files to Modify
- `src/components/company/UpdateTheRecordButton.tsx` — gold CTA + copy change
- `src/components/AddYourStoryCTA.tsx` — new copy
- `src/pages/CompanyProfile.tsx` — integrate NarrativeGapCard + RecruitmentAdvantageScore
- `src/pages/Pricing.tsx` — rename tier
- `src/pages/ForEmployers.tsx` — rename tier
- `src/components/jobs/JobListRow.tsx` — update tooltip
- `src/components/JackyeNote.tsx` — soften tone
- Signal display components — red → amber for data signals

