

# "Share Your Alignment" Feature Plan

## Summary
Enhance the InsiderPrideBanner and DreamJobWidget with branded social sharing using the platform's Trust Blue (`--primary`) and Gold Shield (`--civic-gold`) accent colors, updated copy, and LinkedIn share integration.

## Changes

### 1. InsiderPrideBanner — "I'm Proud" Share Flow
**File:** `src/components/community/InsiderPrideBanner.tsx`

After successful testimonial submission (`onSuccess`), show a branded share card with:
- Share text: *"I'm proud to work at a company that puts its receipts where its mouth is. 🛡️ See how [Company Name] aligns with your values on Who Do I Work For?"*
- Link to `https://wdiwf.jackyeclayton.com/company/{slug}`
- "Share on LinkedIn" button (Trust Blue primary) and "Copy Share Text" button (Gold Shield accent)
- Footer tagline: *"No judgment, just receipts."*
- New `slug` prop added to the component; update CompanyProfile.tsx to pass it

### 2. DreamJobWidget — "Manifested" Success Screen
**File:** `src/components/community/DreamJobWidget.tsx`

Replace the current success state with:
- Headline: *"Manifested. 🚀"*
- Body: *"We're auditing the receipts for [Company Name] to help you get there."*
- LinkedIn share text updated to: *"I just mapped my values to my dream role at [Company Name]. It's time we knew who we really worked for. Check your alignment at https://wdiwf.jackyeclayton.com"*
- Share buttons styled with Trust Blue (`bg-primary`) and Gold Shield (`border-civic-gold`) accents
- Footer tagline: *"No judgment, just receipts."*

### 3. UI Branding
- LinkedIn share buttons: `bg-primary text-primary-foreground` (Trust Blue)
- Copy/secondary buttons: `border-civic-gold text-civic-gold hover:bg-civic-gold/10` (Gold Shield)
- Tagline footer in both components: `text-[10px] text-civic-gold-muted` with shield icon

### Files Modified
- `src/components/community/InsiderPrideBanner.tsx` — add post-submit share card with branded buttons + tagline
- `src/components/community/DreamJobWidget.tsx` — update success screen copy, share text, button styling, tagline
- `src/pages/CompanyProfile.tsx` — pass `slug` prop to InsiderPrideBanner

