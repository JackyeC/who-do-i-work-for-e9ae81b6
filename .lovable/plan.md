## ND Mode Onboarding and Career Map Integration

### 1. First-Time Walkthrough (3-5 steps)
Appears once when a user first enables ND Mode. Uses a focused overlay that highlights one section at a time:

- **Step 1: "Welcome to ND Mode"** — "This view translates employer signals into plain language. Every section answers: what is this, why does it matter, and what can I do next."
- **Step 2: "Quick Read"** — "Start here. Five simple ratings tell you how clear, fast, social, flexible, and safe this workplace may be."
- **Step 3: "Evidence and Feel"** — "We show what we found and what it may feel like day-to-day. Good fit / be careful lines help you decide quickly."
- **Step 4: "Questions and Actions"** — "Ready-made interview questions (with softer versions) and suggestions for your resume, cover letter, and application."
- **Step 5: "Need help anytime?"** — "Tap the help button to see what any icon, rating, or section means."

Stored in localStorage so it only shows once. A "Show walkthrough again" option in the help legend.

### 2. Persistent Help Legend
A floating help button (bottom-right) that opens a panel explaining:
- What Low / Medium / High ratings mean
- What each section covers (Quick Read, Evidence, Feel, Questions, Application)
- What the progress rail does
- What the view modes (Detailed, Summary, Checklist, Script) do
- A "Show walkthrough again" link

### 3. Career Map Integration
Add a connection from the ND Dossier to the Career Map:
- Add a "Use this in my career plan" button in the ND Dossier's application section
- When clicked, navigates to /career-map with the company pre-loaded as context
- The Career Map can then reference ND-specific findings (clarity, pace, social load) when generating path recommendations

### Components to build
- `NDOnboardingWalkthrough` — step-by-step overlay
- `NDHelpLegend` — floating help button + panel
- Integration link in `NDDossierView` to Career Map
