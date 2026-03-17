

# Enhanced Easy Apply Feature

## Current State
- **Resume upload** already works in `UserProfileForm.tsx` using `career_docs` bucket + `user_documents` table
- **EasyApplyButton** exists but only tracks the application and opens the external URL — no cover letter generation, no resume confirmation
- **`generate-application-payload`** edge function already generates AI cover letters using company signals + user profile — but EasyApplyButton doesn't call it
- **`user_documents`** table stores parsed resumes with extracted skills, bio, job titles

## What's Missing
The current Quick Apply just logs a row and opens a new tab. There's no step where the user sees their resume confirmed, gets an AI-generated cover letter, or reviews before submitting.

## Plan

### 1. Build Quick Apply Dialog
Create `QuickApplyDialog.tsx` — a modal that opens when Quick Apply is clicked:
- Shows the user's latest resume filename + upload date
- Calls `generate-application-payload` to create a personalized cover letter
- Displays the cover letter in an editable textarea so users can tweak it
- Shows a one-line pitch and values alignment note (already returned by the edge function)
- "Confirm & Apply" button that:
  - Upserts into `applications_tracker` with the generated cover letter stored
  - Tracks in `job_click_events`
  - Opens external URL
- "Upload New Resume" link that redirects to profile

### 2. Update EasyApplyButton
- Instead of directly applying, open the `QuickApplyDialog`
- Keep the resume check — if no resume, show toast directing to profile
- Keep the "already applied" state as-is

### 3. Add Resume Status Card to UserProfileForm
- After the upload section, show current resume info: filename, upload date, parsed skills count
- Add a "Replace Resume" option that uploads a new one
- Show parsing status (parsed/parsing/error)

### 4. Store Cover Letter with Application
- Add `cover_letter_text` column to `applications_tracker` table (nullable text)
- Save the generated cover letter when user confirms Quick Apply
- This lets users reference their cover letters later in the tracker

## Technical Details

**New migration**: Add `cover_letter_text TEXT` column to `applications_tracker`

**New component**: `src/components/jobs/QuickApplyDialog.tsx`
- Uses `Dialog` from shadcn
- Calls `supabase.functions.invoke("generate-application-payload", { body: { company_id } })`
- Editable cover letter textarea
- Loading state while AI generates

**Modified files**:
- `EasyApplyButton.tsx` — open dialog instead of direct apply
- `UserProfileForm.tsx` — add resume status card showing current file

**No new edge functions needed** — `generate-application-payload` already does everything.

