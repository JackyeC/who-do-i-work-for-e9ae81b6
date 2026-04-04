

# Legal Defense & Documentation Features

## Overview

Four new features integrated into the existing WDIWF platform, maintaining the forensic/strategic tone and existing architecture patterns.

---

## Feature 1: Code Word Scanner (Dossier Component)

**What it does:** A new card inside the company dossier that scans known company materials (job postings, career page data, public stances) for phrases commonly identified as "code words" for bias per legal research.

**Implementation:**

- Create `src/components/dossier/CodeWordScanner.tsx`
- Hardcoded dictionary of ~40 flagged phrases mapped to risk categories (e.g., "culture fit" = potential bias proxy, "fast-paced environment" = burnout risk, "family-oriented" = potential exclusion signal, "young and hungry team" = age discrimination risk)
- Each flagged term shows: the phrase, where it appeared (career page, job posting, public stance), the legal/bias risk it signals, and a plain-language explanation
- Data source: pull from existing `company_jobs` (descriptions), career page scrape data, and `company_public_stances`
- Mount inside `CompanyDossier.tsx` as a new expandable layer in the dossier
- Forensic UI: clean table with severity badges (Flag, Watch, Note)

**New files:** `src/components/dossier/CodeWordScanner.tsx`, `src/lib/code-word-dictionary.ts`
**Edited files:** `src/pages/CompanyDossier.tsx` (add import + mount)

---

## Feature 2: Evidence Logger (Personal Work Log)

**What it does:** A protected dashboard page (`/evidence-logger`) where authenticated users can document workplace incidents with structured fields.

**Implementation:**

- New page `src/pages/EvidenceLogger.tsx` with route added to `App.tsx`
- New DB table `personal_work_logs` via migration:
  - `id`, `user_id` (references auth.users), `incident_date`, `incident_time`, `participants` (text), `verbatim_quote` (text), `related_policy` (text), `original_text` (text, nullable), `rewritten_text` (text, nullable), `created_at`, `updated_at`
  - RLS: owner-only (user_id = auth.uid()) for all operations
- UI: Form with Date/Time picker, Participants field, Verbatim Quotes textarea, Related Policy input
- "Remove Emotion" button calls a new edge function `rewrite-evidence-log` that uses Lovable AI (Gemini Flash) with Jackye's voice to rewrite subjective text into objective, evidence-based documentation
- Entries displayed in a data table below the form, sorted by date descending
- Beta badge on the page header

**New files:** `src/pages/EvidenceLogger.tsx`, `src/components/evidence-logger/EvidenceLogForm.tsx`, `src/components/evidence-logger/EvidenceLogTable.tsx`, `supabase/functions/rewrite-evidence-log/index.ts`
**Edited files:** `src/App.tsx` (route), migration for `personal_work_logs` table

---

## Feature 3: Unfair vs. Illegal Interactive Guide

**What it does:** A 3-question triage tool that helps users understand whether a workplace incident is legally actionable or "just unfair." Outputs a Legal Standing summary with documentation advice.

**Implementation:**

- New page `src/pages/UnfairVsIllegal.tsx` with route `/unfair-vs-illegal`
- Step-by-step flow (3 questions):
  1. "Was the treatment based on a protected characteristic?" (age, race, sex, disability, religion, etc. vs. personality conflict, favoritism, general rudeness)
  2. "Is there a pattern or was this a single incident?" (pattern vs. isolated)
  3. "Did you report it through internal channels?" (yes/no/no channels exist)
- Pure client-side logic, no AI call needed. Decision tree maps to ~6 outcome categories:
  - Potential discrimination claim, Potential retaliation claim, Hostile work environment pattern, Unfair but not illegal (with documentation strategy), Policy violation (internal remedy), Constructive dismissal risk
- Each outcome includes: Legal standing label, plain-language explanation, documentation checklist, "What to do next" steps
- No legal advice disclaimer at top and bottom of page
- Link from dashboard and dossier "Verify Before Accepting" section

**New files:** `src/pages/UnfairVsIllegal.tsx`, `src/lib/unfair-vs-illegal-logic.ts`
**Edited files:** `src/App.tsx` (route)

---

## Feature 4: Mission Integrity Score

**What it does:** Compares a company's public mission/stances against FEC political giving and enforcement history to produce a "Mission Integrity" score.

**Implementation:**

- New component `src/components/dossier/MissionIntegrityCard.tsx`
- Pulls from existing tables: `company_public_stances` (what they say), `company_executives` + FEC donation data (political giving), `workplace_enforcement_signals` (enforcement actions)
- Scoring logic in `src/lib/mission-integrity-score.ts`:
  - Compare stance topics (e.g., "worker safety") against enforcement violations in same category
  - Compare stated values against executive political donation patterns
  - Output: 0-100 score, letter grade, and itemized conflicts
- Mount in dossier page and make available as a filter/sort option in company search/browse
- Card displays: Score, Grade, top 3 conflicts (what they say vs. what records show), source links

**New files:** `src/components/dossier/MissionIntegrityCard.tsx`, `src/lib/mission-integrity-score.ts`
**Edited files:** `src/pages/CompanyDossier.tsx` (mount card)

---

## Feature 5: Ask Jackye Integration

**What it does:** Update the Ask Jackye system prompt to reference legal documentation strategies.

**Implementation:**

- Edit `supabase/functions/ask-jackye/index.ts` SYSTEM_PROMPT to add a new section covering:
  - Code word awareness (reference the scanner)
  - Evidence logging best practices (date, time, participants, verbatim quotes)
  - Unfair vs. illegal framework (when to escalate, when to document)
  - "Employment is a business transaction, not a family" framing
- Add quick prompts in `AskJackyeWidget.tsx`: "How do I document a workplace incident?" and "Is this unfair or illegal?"

**Edited files:** `supabase/functions/ask-jackye/index.ts`, `src/components/AskJackyeWidget.tsx`

---

## Database Changes

One new table via migration:
```sql
CREATE TABLE public.personal_work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_date date NOT NULL,
  incident_time time,
  participants text NOT NULL DEFAULT '',
  verbatim_quote text NOT NULL DEFAULT '',
  related_policy text DEFAULT '',
  original_text text,
  rewritten_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.personal_work_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own logs" ON public.personal_work_logs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## Execution Order

1. DB migration (personal_work_logs table)
2. Code Word Dictionary + Scanner component
3. Mission Integrity Score logic + card
4. Evidence Logger page + edge function
5. Unfair vs. Illegal triage tool
6. Ask Jackye prompt updates
7. Route wiring in App.tsx

