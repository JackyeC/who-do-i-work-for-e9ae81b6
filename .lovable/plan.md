

# Situation-Aware Career Decision Engine — Upgrade Plan

## Current State Assessment

The vast majority of what's requested **already exists**:
- **Situation Selector**: 8 situations, stored in localStorage, wired to Policy Score — ✅
- **Company Intelligence (Dossier)**: 9-layer system with signals, workforce, governance — ✅
- **Policy & Governance Receipts**: Political spending, lobbying, trade associations — ✅
- **Leadership & Influence**: Executives, board, donations, revolving door — ✅
- **Compensation & Offer Context**: Strategic Offer Review with Reality Check — ✅
- **Mismatch Detection**: Say-Do analysis with gap classification — ✅
- **Situation-Aware Reweighting**: Policy Score engine with blended weights — ✅

## What's Actually Missing (5 Gaps)

### Gap 1: Missing "Career Switcher" Situation
The prompt lists 9 situations but the engine only has 8. "Career Switcher" is absent — needs its own weight profile prioritizing training, stability, role clarity.

### Gap 2: Situation Context Not Wired Into Dossier
The user's selected situations only affect the Policy Intelligence page. The Company Dossier doesn't read situations from localStorage or reorder/highlight content based on them. The dossier should show a "What this means for you" banner personalized to the user's situation.

### Gap 3: Policy Intelligence Page Missing Sections
The prompt wants 10 output items per company. Currently missing from the Policy Intelligence page:
- Leadership & Influence snapshot (executives, board, donation visibility)
- Compensation insight (market range, transparency signals)
- Last verified timestamp
- Issue-by-issue breakdown (currently only in receipts panel, not as a scored list)

### Gap 4: Situation Not Wired Into Offer Review
The Strategic Offer Review doesn't know about user situations. A "Caregiver" user should see benefits/flexibility emphasized; a "Maximize Compensation" user should see below-market warnings amplified.

### Gap 5: Signal Classification Taxonomy
The prompt wants each governance signal classified as "Statement", "Action", or "Association". Currently signals use gap types ("aligned", "mixed", "direct-conflict") but don't distinguish the signal's nature.

## Implementation Steps

### 1. Add "Career Switcher" to the Engine
- Add `"career-switcher"` to the `Situation` type in `policyScoreEngine.ts`
- Add label, icon, and weight profile (prioritize oversight + transparency)
- Update `SituationSelector.tsx` to include it

### 2. Build Situation-Aware Dossier Banner
- Create `SituationContextBanner.tsx` — reads situations from localStorage, displays a compact "Your priorities" strip with personalized highlights
- Wire into `CompanyDossier.tsx` below the overview section
- Show situation-relevant callouts (e.g., "As a caregiver, watch for flexibility signals" or "As a stability seeker, note the WARN notice history")

### 3. Expand Policy Intelligence Page
- Add a `LeadershipSnapshot` section pulling from `company_executives` — show top execs with donation totals and clickable profiles
- Add a `CompensationInsight` section pulling from `compensation_data` — show market range and transparency signals
- Add a `LastVerifiedBanner` showing `last_audited_at` or scan timestamps
- Add an issue-by-issue scored breakdown grid (7 issue areas from prompt: Immigration, Climate, Labor, Civil Rights, Healthcare, Firearms, Consumer Protection)

### 4. Wire Situations Into Offer Review
- Read situations from localStorage in `StrategicOfferReview.tsx`
- Pass to `OfferRealityCheck` and `NegotiationBot` to adjust emphasis:
  - Caregiver → surface benefits/flexibility gaps
  - Compensation → amplify below-market warnings
  - Early Career → show growth vs. pay tradeoff
  - Stability → emphasize layoff/WARN signals

### 5. Add Signal Classification Tags
- Extend `company_public_stances` display to classify each signal as Statement / Action / Association
- Add a `signal_type` badge to `PolicyReceiptsPanel` entries based on source type inference (press release → Statement, FEC/lobbying → Action, trade association → Association)

## Files Changed

**Modified:**
- `src/lib/policyScoreEngine.ts` — add "career-switcher" situation
- `src/components/policy-intelligence/SituationSelector.tsx` — add new chip
- `src/pages/PolicyIntelligence.tsx` — add leadership, compensation, issue breakdown, timestamp sections
- `src/pages/CompanyDossier.tsx` — embed SituationContextBanner
- `src/pages/StrategicOfferReview.tsx` — read situations, adjust emphasis
- `src/components/strategic-offer/OfferRealityCheck.tsx` — accept situations prop
- `src/components/strategic-offer/NegotiationBot.tsx` — situation-aware emphasis
- `src/components/policy-intelligence/PolicyReceiptsPanel.tsx` — add signal type badges

**Created:**
- `src/components/policy-intelligence/SituationContextBanner.tsx` — reusable personalization strip
- `src/components/policy-intelligence/LeadershipSnapshot.tsx` — compact exec/board display
- `src/components/policy-intelligence/CompensationInsight.tsx` — market range + transparency
- `src/components/policy-intelligence/IssueBreakdownGrid.tsx` — 7-issue scored grid

No database changes needed — all required tables exist.

