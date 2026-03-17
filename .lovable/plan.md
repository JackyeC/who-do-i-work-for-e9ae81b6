

## Candidate Advocacy Dossier — Implementation Plan

This builds the "Candidate Advocacy" engine: a PDF dossier that gets attached to applications, transforming the user from "random applicant" into "values-aligned, pre-researched professional."

---

### What Already Exists

| Capability | Status |
|---|---|
| User profile (name, bio, skills, resume, LinkedIn) | Done — `UserProfileForm` + `profiles` table |
| Application payload generation (AI cover letter) | Done — `generate-application-payload` edge function |
| Auto-Apply queue + processing | Done — `process-apply-queue` edge function |
| Company dossier PDF generator (employer-facing) | Done — `generateDossierPdf.ts` (1096 lines) |
| Public stances / say-do gap data | Done — `company_public_stances` table |
| ATS detection (20 platforms) | Done — `job-scrape` edge function |
| Values preferences system | Done — `job_match_preferences` table |

### What's Missing

1. **Candidate Advocacy Dossier PDF** — A candidate-facing PDF (not the employer dossier) that attaches to applications showing values alignment, institutional IQ, and a WDIWF verification seal.
2. **Dossier generation in the apply flow** — When "Apply Now" or "Auto-Apply" triggers, generate the advocacy PDF and include it in the payload.
3. **"One-Click Apply" enhancement** — Surface the dossier preview and download in the ClipboardBanner after applying.

---

### Implementation

#### 1. New PDF Generator: `src/lib/generateCandidateAdvocacyPdf.ts`

A compact 1-2 page PDF using the same jsPDF + autoTable stack. Structure:

**Page 1:**
- Header: `[Candidate Name] | Values-Aligned Talent` with WDIWF branding
- **Executive Summary**: 2-3 sentences stating alignment score, company name, and that this candidate applied via the WDIWF Intelligence Network
- **Why This Candidate**: 
  - *Institutional IQ*: Shows the candidate researched the company's public stances, political spending, and workforce signals
  - *Mission Alignment*: Maps their top 3 values to the company's documented positions (from `company_public_stances`)
  - *Reduced Retention Risk*: Short note that values-aligned hires have lower attrition
- **Candidate Profile**: Name, target roles, skills, LinkedIn
- **WDIWF Verification Seal**: "Intelligence Verified by Who Do I Work For?" badge with date

Input data: user profile, company data, alignment score, matched signals, public stances, civic footprint score.

#### 2. Update `generate-application-payload` Edge Function

After generating the cover letter, also call a new internal helper that:
- Fetches `company_public_stances` for the target company
- Fetches user's `job_match_preferences` 
- Returns structured `advocacyData` in the payload:
  ```json
  {
    "advocacyData": {
      "alignmentScore": 92,
      "companyStances": [...],
      "matchedValues": [...],
      "candidateName": "...",
      "candidateSkills": [...],
      "civicFootprintScore": 67,
      "verificationDate": "2026-03-17"
    }
  }
  ```

No new edge function needed — just expand the existing payload response.

#### 3. Client-Side Dossier Generation + Download

Update `AlignedJobsList.tsx` `ClipboardBanner` component:
- Add a "Download Advocacy Dossier" button that calls `generateCandidateAdvocacyPdf()` with the payload data
- The PDF generates client-side (same as the existing employer dossier export)
- Also show a preview snippet of the dossier content

#### 4. Auto-Apply Queue Integration

Update `ApplyQueueDashboard.tsx`:
- For completed queue items with `generated_payload.advocacyData`, show a "Download Dossier" button
- Users can download the dossier for any processed application

---

### Files Summary

| File | Action |
|------|--------|
| `src/lib/generateCandidateAdvocacyPdf.ts` | **Create** — candidate-facing PDF generator |
| `supabase/functions/generate-application-payload/index.ts` | **Edit** — add public stances + advocacy data to payload |
| `src/components/jobs/AlignedJobsList.tsx` | **Edit** — add dossier download to ClipboardBanner |
| `src/components/jobs/ApplyQueueDashboard.tsx` | **Edit** — add dossier download for completed items |

No database changes needed. No new edge functions.

