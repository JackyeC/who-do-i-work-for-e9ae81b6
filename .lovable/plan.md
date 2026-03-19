

# Demo Company Profile — Homepage Conversion Engine

## What This Is

A new static, anonymized company intelligence preview displayed prominently on the homepage under the headline **"Most candidates never see this before they accept. You should."** — designed to showcase the Rabbit Hole Engine's output format and drive signups.

## What Changes

### 1. New Component: `DemoCompanyProfile`

A self-contained, read-only component (`src/components/landing/DemoCompanyProfile.tsx`) rendering a full 8-section mini-dossier for an anonymized company ("Large National Restaurant Brand"). Sections:

- **Company Snapshot** — Reality Gap badge (Moderate → High), summary paragraph
- **What to Watch** — 4 bullet signals (legal consolidation, discrimination settlements, pay ratio, governance concentration)
- **Workforce vs Leadership** — diversity/representation contrast
- **Compensation Signals** — CEO pay ratio, limited wage visibility
- **Policy & Influence** — PAC activity, political funding
- **Risk Signals** — EEOC cases, structural changes, reputational sensitivity
- **Reality Gap (Narrative vs Reality)** — stated values vs observed signals
- **What to Ask** — 3 interview questions with copy buttons

Uses the same design system (monospace labels, severity colors, card borders) as the real `WhatToWatch` and `WhatToAsk` components but with hardcoded synthetic data. No real company named.

### 2. Homepage Integration

Replace or augment the current static "Koch Industries" preview card (lines 144–173 of `Index.tsx`) with:

- **Headline**: `"Most candidates never see this before they accept. You should."`
- **Subhead**: `"This is what you won't see on a job board"`
- The `DemoCompanyProfile` component
- **CTA button**: `"Run this for a company you're considering"` → navigates to search or signup

The existing hero section stays intact. This new block goes **after** the Evidence Strip and **before** the PathfinderTracks section — positioning it as the proof-of-value before pricing.

### 3. Anonymization Safety

All data is hardcoded synthetic content. No company is named. The label reads **"Example: Large National Restaurant Brand"** with a small disclaimer: *"Composite example based on real signal types. Not a specific company report."*

## Technical Details

- Pure presentational component — no API calls, no database reads
- Reuses existing UI primitives: `Card`, `CardContent`, `Button`, severity color tokens
- Copy-to-clipboard on interview questions (same pattern as `WhatToAsk`)
- `SectionReveal` wrapper for scroll-triggered entrance animation
- Mobile-responsive: single-column stack on small screens, compact spacing

