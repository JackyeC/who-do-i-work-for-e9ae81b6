

# What Made It from the Gemini Conversation — and What Didn't

## Already Built

The core architecture from that Gemini session is live:

| Gemini Concept | Implementation |
|---|---|
| "Facts Over Feelings" dossier format | `ClarityEngine` edge function + `ClarityEngine.tsx` component |
| "Warning Label" layout (Verdict, Pulse, Money Trail, Influence Map) | `WarningLabelView.tsx` with all sections |
| CEO Memo Decoder | Built into `WarningLabelView.tsx` with full decoder map |
| Candidate Prep Pack (Say/Ask/Avoid) | `src/components/dossier/CandidatePrepPack.tsx` (AI-streaming) |
| Auto-Apply queue system | `use-auto-apply.ts` hook, `process-apply-queue` edge function, DB tables |
| Bias audit detection | `civiclens-intelligence-scan` edge function, `AIAccountabilityCard` |
| Consent modal + legal disclaimers | `ConsentModal.tsx`, `LegalDisclaimer.tsx` |
| Real-time news pipeline | Cron jobs: news every 4h, Jackye's takes every 2h |

## NOT Built Yet

These pieces from the Gemini conversation are missing:

### 1. Terms of Service — "Fairness Contract" for Auto-Apply
The current ToS has zero mention of auto-apply, AI agent authorization, or the "Talent Agent License" concept. It needs new sections covering:
- **Career Agent License**: User authorizes WDIWF to scout, draft, and submit applications on their behalf (only after mobile confirmation)
- **No-Hallucination Promise**: The AI will never invent skills, titles, or dates
- **Human-in-the-Loop Requirement**: No application submitted without explicit user approval
- **Transparency Tag**: Every submitted application includes disclosure that AI assisted
- **Audit Trail**: User can view a log of every application submitted and exactly what was sent
- **Biometric Consent**: If FaceID/fingerprint is used for mobile confirm, explicit consent for that trigger
- **Data Minimization**: Only collect what's needed; "nuclear option" delete button

### 2. Terms of Service — Global Roles & "Trust as a Service"
The current ToS is US-only. For global roles, add:
- **Cross-border data disclosure**: User data may be processed for roles in multiple jurisdictions
- **AI transparency compliance**: Platform complies with applicable AI disclosure laws (TRAIGA, Colorado AI Act, NYC LL144, EU AI Act)
- **Bias audit commitment**: Annual third-party bias audit of matching algorithms

### 3. Auto-Apply "Dossier Filter" Safety Check
The Gemini conversation specified: "Only auto-apply if the company has a WDIWF Verdict of 'Safe for Growth' — skip any with a 'Purge' warning." This filter does not exist in `process-apply-queue`. The queue processes everything above the alignment score threshold with no verdict check.

### 4. Mobile Push-to-Apply with Review Step
The "Final Review Stop" where the user sees the tailored resume before tapping "Apply" is not built. Currently auto-apply processes the queue server-side without a per-item mobile confirmation step.

---

## Proposed Plan

### Step 1: Update Terms of Service
Add four new sections to `src/pages/TermsOfService.tsx`:
- **"Career Agent Authorization"** — the Fairness Contract language (agent license, no hallucination, human-in-the-loop, transparency tag, audit trail)
- **"AI Transparency & Compliance"** — TRAIGA, Colorado AI Act, NYC LL144, EU AI Act disclosures
- **"Global Data Processing"** — cross-border data handling for global job matching
- **"Bias Audit Commitment"** — annual bias audit pledge for matching algorithms

Update the "last updated" date. Keep the existing sections intact.

### Step 2: Add Auto-Apply Consent Gate
Create a new `AutoApplyConsentModal` component (similar to `ConsentModal`) that appears when a user first enables auto-apply. It presents the 3-slide "Fairness Contract" summary:
1. "We are your Agent. We find the jobs, you make the choice."
2. "We only tell the truth. No fake skills, no bot-spam."
3. "You're the boss. Every application needs your approval."

User must check the box and accept before auto-apply activates. Store acceptance timestamp in `auto_apply_settings` (new column: `consent_accepted_at`).

### Step 3: Add Dossier Verdict Filter to Queue Processing
In `process-apply-queue` edge function, before processing each queue item, look up the company's latest verdict/alignment data. Skip items where the company verdict is equivalent to "Enter with a Parachute" or worse (configurable threshold). Log skipped items with reason.

### Technical Details

**Files to edit:**
- `src/pages/TermsOfService.tsx` — add new sections
- `src/components/auto-apply/AutoApplyConsentModal.tsx` — new component
- `src/pages/AutoApply.tsx` or wherever auto-apply is enabled — gate behind consent modal
- `supabase/functions/process-apply-queue/index.ts` — add verdict filter logic

**Database migration:**
- Add `consent_accepted_at timestamptz` column to `auto_apply_settings`

