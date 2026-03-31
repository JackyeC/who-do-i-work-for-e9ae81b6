

# Gemini Dossier Conversation — What's Already Built vs. What's Being Asked

## Context

The Gemini conversation covers a LOT of ground. Let me separate what's **already in the platform** from what's **genuinely new**.

## Already Built (No Changes Needed)

| Gemini Concept | Existing Feature |
|---|---|
| "Facts Over Feelings" Warning Label format | `WarningLabelView.tsx` — Verdict, Pulse, Money Trail, Influence Map |
| "Clarity Engine" AI dossier generator | `ClarityEngine.tsx` — streams AI analysis via edge function |
| "Candidate Prep Pack" with Hard Questions | `CandidatePrepPack.tsx` — role-specific, streamed via edge function |
| "CEO Memo Decoder" | Built into Clarity Engine prompt |
| Three dossier views (Warning Label / Deep Dive / Interview Prep) | `CompanyDossier.tsx` — tab switcher at line 291-308 |
| Auto-Apply with consent + mobile "Yes" | `AutoApplySettings.tsx` + `AutoApplyConsentModal` + `ApplyQueueDashboard` |
| Fairness Contract / consent modal | `AutoApplyConsentModal` — requires consent before enabling |
| Compliance Dashboard (Founder Console) | `ComplianceDashboard.tsx` — consent rates, queue stats, audit trail |
| Transparency Receipt / AI disclosure | Already in compliance dashboard + apply queue |
| TRAIGA / EU AI Act compliance framing | Built into consent modal and compliance dashboard |
| Human-in-the-Loop verification | Apply queue requires user action before processing |
| Data Wipe / Right to be Forgotten | `DataWipeButton.tsx` on user profile |

## What's Actually New (From the Gemini Conversation)

After stripping away everything already built, the Gemini conversation surfaces **3 actionable improvements**:

### 1. Dossier Format Refresh — "High-Utility" Style
The Gemini conversation refined the dossier into a tighter format: **Verdict → Strategy → Workforce Health → 3 Hard Questions**. The current `WarningLabelView` is close but could be tightened to match this "scannable" layout with clearer section headers.

**Change**: Update `WarningLabelView.tsx` section headers and ordering to match the refined "High-Utility" format (The Strategy, Workforce Health, 3 Hard Questions as a distinct callout).

### 2. "Transparency Receipt" on Every Application
The Gemini conversation specifies a metadata footer on every submitted application: *"0% of candidate identity data (race, age, gender) was used in matching."* This text exists in the admin `ComplianceDashboard` but is NOT shown to the **candidate** in their apply queue.

**Change**: Add a "Transparency Receipt" badge/footer to each item in `ApplyQueueDashboard.tsx` so candidates see it too.

### 3. Compliance Terms / "Fairness Contract" Content Update
The Gemini conversation refined the consent language into a 3-point "Fairness Contract" (Agent license, No Hallucination promise, Human-in-the-Loop). The current `AutoApplyConsentModal` has generic consent text.

**Change**: Update `AutoApplyConsentModal.tsx` copy to use the refined 3-point Fairness Contract language from the Gemini conversation.

---

## Files to Edit

- `src/components/dossier/WarningLabelView.tsx` — Reorder sections, add "The Strategy" and "Workforce Health" headers, surface "3 Hard Questions" as a distinct callout box
- `src/components/jobs/ApplyQueueDashboard.tsx` — Add Transparency Receipt footer per queue item
- `src/components/auto-apply/AutoApplyConsentModal.tsx` — Update consent copy to 3-point Fairness Contract

## No database changes needed.

