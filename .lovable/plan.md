

# Candidate Prep Pack — Dossier Overhaul

## The Problem
The dossier pages show raw data layers and generic scores but don't help a candidate actually **prepare** for an interview or meeting. The Warning Label view has good bones (Verdict, Pulse, Money Trail, Influence Map, Action Items) but is missing the "here's exactly what to say/ask/avoid" prep that Gemini outlined.

## What to Build

### 1. New "Candidate Prep Pack" component
A new `src/components/dossier/CandidatePrepPack.tsx` that uses the Clarity Engine edge function (already built) to generate **real, company-specific** prep content. This is NOT static/fake data — it calls AI with the company's actual receipts.

**Sections (locked labels, every company):**
- **30-Second Reality Check** — one paragraph briefing
- **Top 5 Receipts You Should Know** — bullet list from real data (EEOC, lobbying, WARN, fines, Say-vs-Do gaps)
- **Say / Ask / Avoid** — 3 columns of talk tracks derived from receipts
- **Red / Yellow / Green Flags** — quick-glance summary of integrity, labor, political, DEI signals
- **Day 90 Reality** — what the first 90 days feel like based on patterns

### 2. Role-Aware Lens
Add a simple role picker inside the prep pack: **General / Engineering / People & HR / Sales / Leadership**. This slightly adjusts the AI prompt to customize questions and framing per function.

### 3. "Forward to Candidate" Button
A one-click export that generates a stripped-down brief (no pricing, no product language) with: 30-second brief, top 5 receipts, 5 questions to ask. Uses the existing `ExportDossierButton` pattern but outputs a candidate-friendly version.

### 4. Integration into Dossier Page
Add a third view toggle alongside "Warning Label" and "Deep Dive":
- ⚠️ Warning Label
- 📋 Deep Dive  
- 🎯 **Interview Prep**

When "Interview Prep" is selected, show the `CandidatePrepPack` instead of the current views.

## Technical Details

### New Edge Function: `candidate-prep-pack`
Similar to the existing `clarity-engine` function but with a different prompt focused on the Gemini-defined structure (30-sec brief, Say/Ask/Avoid, role-specific questions). Aggregates same data sources: `companies`, `company_executives`, `issue_signals`, `company_public_stances`, `company_warn_notices`, `eeoc_cases`.

### Files to Create
- `supabase/functions/candidate-prep-pack/index.ts` — AI-powered prep generation
- `src/components/dossier/CandidatePrepPack.tsx` — main prep pack UI with streaming markdown
- `src/components/dossier/PrepPackExport.tsx` — "Forward to Candidate" export button

### Files to Edit
- `src/pages/CompanyDossier.tsx` — add "Interview Prep" as third view toggle, render `CandidatePrepPack` when selected
- `src/components/dossier/WarningLabelView.tsx` — enhance the existing Action Items section with the Say/Ask/Avoid pattern (so Warning Label view also benefits)

### Data Flow
```text
Company receipts (DB) → candidate-prep-pack edge function → Gemini AI → Streaming response → CandidatePrepPack.tsx renders sections
```

### Role Picker
Simple local state toggle — changes a `role` param sent to the edge function which adjusts the AI prompt's framing. No new DB tables needed.

### Forward to Candidate
Renders the prep pack content into a clean HTML string, opens print dialog or copies to clipboard. No new DB tables needed.

