

# Make Dark Money Connections Clickable & Explorable

## Overview
Add an `EntityDetailDrawer` component that opens when any dark money entity is clicked, showing full context, relationship details, and source links. Then wire it into all 4 locations where dark money items are rendered.

## Approach
Use the existing `company_dark_money` table — it already has: `name`, `org_type`, `relationship`, `description`, `estimated_amount`, `confidence`, `source`. No schema changes needed. The existing data model is sufficient for Phase 1.

## New File

### `src/components/company/EntityDetailDrawer.tsx`
A reusable drawer/dialog that accepts a dark money record and displays:
- **Header**: Entity name + type badge (e.g., "501(c)(4)", "PAC", "Nonprofit")
- **Relationship**: How connected to the company + label
- **Amount**: Formatted currency with confidence indicator
- **Context**: Auto-generated explanation based on org_type and relationship (e.g., "This 501(c)(4) organization is not required to disclose its donors, making spending through this channel difficult to trace.")
- **Source**: Clickable external link if available, or "No public source linked" message
- **Confidence**: Visual indicator (Documented / Likely / Inferred)

## Modified Files (4 locations)

### `src/components/company/LeadershipInfluenceSection.tsx`
- Import `EntityDetailDrawer`
- Add state for selected entity
- Make each dark money row clickable with `cursor-pointer` + hover effect
- Render drawer when entity selected

### `src/components/policy-intelligence/MismatchEngine.tsx`
- Same pattern: clickable rows → open drawer

### `src/pages/WhoDoIWorkFor.tsx`
- Same pattern for the Dark Money Connections card

### `src/components/WhatYoureSupportingCard.tsx`
- Same pattern for dark money records list

## Context Generation Logic
Inside `EntityDetailDrawer`, generate a plain-English explanation based on `org_type`:
- `501(c)(4)` → "This type of organization can spend on politics without disclosing donors..."
- `501(c)(6)` → "A trade association that lobbies on behalf of industry members..."
- `PAC` → "A political action committee that pools contributions..."
- `Super PAC` → "Can raise unlimited funds but must disclose donors..."
- Fallback → "An organization connected to corporate political activity."

## No Database Changes
The existing `company_dark_money` table has all needed fields. No new tables or migrations required.

