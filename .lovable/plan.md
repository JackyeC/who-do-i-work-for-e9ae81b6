

## Remove BLSDemographicsCard from Company Profile

### Change
Remove the `<BLSDemographicsCard>` render from `src/pages/CompanyProfile.tsx` at line 1117, and remove the unused import at line 33.

### What stays
- `WorkforceDemographicsLayer` (company-specific EEO-1 data) — untouched
- `src/components/bls/BLSDemographicsCard.tsx` file — kept for potential future use
- All other company-specific intelligence sections — untouched

### No additions
No placeholders, no filler, no generic replacements.

