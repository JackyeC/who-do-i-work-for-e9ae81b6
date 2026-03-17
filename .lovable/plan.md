

## Assessment: Most of This Already Exists

The platform already has the core "Institutional DNA" infrastructure built:

- **InstitutionalDNACard** component with Heritage/Project 2025 and CAP categorization
- **institutional-dna-scan** edge function using Perplexity to research connections
- **institutional_alignment_signals** database table
- Category labels ("Traditional Family Policy Networks" / "Progress-Oriented Policy Networks")
- Evidence sourcing with "View Receipt" links
- Bipartisan funder detection
- Disclaimer text about documented links

### What's Missing (New Work)

Only two features from the prompt are not yet implemented:

**1. Community "Family-First" Tag**
Allow authenticated users to tag a company as "Family-First" (Traditional or Progressive alignment), stored in a new database table and displayed on the company profile.

**2. Disclaimer Text Update**
The existing disclaimer is close but should be updated to match the exact requested copy about aligning careers with the future users believe in.

### Plan

**Database Migration**
- Create `company_family_tags` table: `id`, `company_id`, `user_id`, `family_model` (enum: `traditional`, `progressive`), `created_at`
- RLS: authenticated users can insert/select; one tag per user per company (unique constraint)

**New Component: FamilyFirstTag**
- Small UI on the company profile allowing logged-in users to tag a company as "Family-First"
- Shows current community consensus (e.g., "12 users tagged Traditional, 5 tagged Progressive")
- Insider Context tooltip explaining the tag meaning based on funding receipts

**Update InstitutionalDNACard**
- Replace the disclaimer text with the requested copy: "Institutional alignment indicates which policy blueprints a company or its leadership supports through funding or board membership. WDIWF provides these receipts so you can align your career with the future you believe in."

**Integration**
- Add `FamilyFirstTag` to CompanyProfile.tsx near the Institutional DNA card

### Files to Create/Modify
- `supabase/migrations/...` -- new `company_family_tags` table
- `src/components/company/FamilyFirstTag.tsx` -- new component
- `src/components/dossier/InstitutionalDNACard.tsx` -- update disclaimer
- `src/pages/CompanyProfile.tsx` -- integrate FamilyFirstTag

