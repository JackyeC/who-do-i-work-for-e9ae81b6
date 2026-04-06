

## Problem

When a user searches for a company, the verdict instantly shows **"High Risk"** (red) because both `civic_footprint_score` and `employer_clarity_score` default to `0` in the database. The current logic treats `0` as `< 35` → "High Risk." But a score of 0 means **no data yet**, not high risk. The system should show a neutral "Researching" or "Under Review" state until there's enough signal to make a call.

## Fix

Update the verdict logic in **two files** to add a fourth tier for unknown/insufficient data:

### 1. `src/pages/CompanyDossier.tsx` (~line 464-470)

Add a check: if both scores are 0 or null, show a neutral verdict instead of "High Risk."

```
Investigating → score is 0 or null (gray/blue, Search icon)
Low Risk      → verdictScore >= 60 (green)
Medium Risk   → verdictScore >= 35 (yellow)  
High Risk     → verdictScore < 35 but > 0 (red)
```

New neutral tier:
- Label: **"Under Review"**
- Icon: `Search` or `FileSearch`
- Color: muted blue/gray (`text-civic-blue`)
- Copy: "We're still pulling records on this company. Check back or dig into the signals below."

### 2. `src/pages/OfferCheckEntry.tsx` (~line 48-53)

Same fix to `deriveVerdict()` — if score is 0, return an "Under Review" state instead of "High Risk."

### What stays the same
- No other pages touched
- No database changes
- No edge function changes
- The actual scoring/data pipeline is unchanged — this only affects the **label** shown when data hasn't been gathered yet

