

## Rebrand to "Neutral Intelligence Standard"

This is a substantial branding overhaul touching ~25+ files. The goal is to shift from a personality-driven voice ("Jackye says") to a systems-driven intelligence voice ("Strategic Context"), while preserving Jackye Clayton as the founder origin story rather than the narrator.

---

### 1. Rename "Jackye's Insight/Note/Context/Verdict" → Neutral Labels

| Current Label | New Label | Files Affected |
|---|---|---|
| `Jackye's Insight` | `Strategic Context` | `JobIntegrityCard.tsx`, `HighRiskConnectionCard.tsx`, ticker in `TopBar.tsx`, `ForEmployers.tsx`, `JobIntegrityBoard.tsx` |
| `Jackye's Note` / `SIGNAL SUMMARY` | `Insider's Brief` | `JackyeNote.tsx` (component header) |
| `Jackye's Context` | `Strategic Context` | `LevelsFyiEmbed.tsx` |
| `Jackye's Verdict` | `Intelligence Assessment` | `WouldYouWorkHere.tsx` |
| `Jackye's Take` | `Strategic Analysis` | `PendingReviewsDashboard.tsx`, `OfferCheckSnapshot` references |
| `Jackye Clayton AI Twin` | `WDIWF Intelligence Engine` | `AskJackye.tsx` opening message, FAQ |

### 2. Navigation: "Ask Jackye" → "Intelligence Advisor"

- **TopBar.tsx**: Change nav label from `"Ask Jackye"` to `"Advisor"` (keep `/ask-jackye` route for now)
- **Add "Methodology" link** to the Tools dropdown in `MAIN_SECTIONS`
- Update all CTA buttons across pages that say "Ask Jackye" to say "Ask the Advisor" or "Intelligence Advisor"

### 3. Landing Page Bio (Index.tsx) — Neutral Founder Origin

Replace the current hero paragraph (line 84) with the platform origin framing:
> "Founded by a long-time Talent Acquisition executive who has been in the room where it happens, WDIWF was built to help both sides tell a clearer story through transparency."

Update the About section (lines 289-298):
- Keep the blockquote but reframe as platform origin, not personal narration
- Replace signature "Unapologetically Transparent. — Jackye Clayton" with: **"No judgment, just receipts."**

### 4. Add "No judgment, just receipts." Secondary Tagline

- Add to company report headers (in `JackyeNote.tsx` body, `CompanyProfile.tsx` report footer)
- Add to the `PlatformPhilosophy.tsx` component

### 5. "Add Your Story" CTA for Employers

On data point cards that show political spend, DEI gaps, or transparency gaps, add an **"Add Your Story"** button that links to `/for-employers` (Founding Partner signup), framed as:
> "Standard public data is only half the story. Become a Founding Partner to provide the full context for your future talent."

This will be added to:
- `JackyeNote.tsx` (the signal summary card)
- `ContextNote.tsx` or a new `AddYourStoryCTA` component reused across report sections

### 6. Ticker Bar Update (TopBar.tsx)

Replace: `JACKYE INSIGHT: "Don't accept an offer without running the chain first"`
With: `INSIDER CONTEXT: "Run the chain before you sign."`

### 7. Files to Modify (Summary)

| File | Changes |
|---|---|
| `TopBar.tsx` | Nav label "Advisor", add Methodology to Tools dropdown, ticker text |
| `JackyeNote.tsx` | Header → "Insider's Brief", add tagline, add "Add Your Story" CTA |
| `LevelsFyiEmbed.tsx` | "Strategic Context" label |
| `HighRiskConnectionCard.tsx` | "Strategic Context" label |
| `JobIntegrityCard.tsx` | "Strategic Context" label |
| `JobIntegrityBoard.tsx` | Description text |
| `WouldYouWorkHere.tsx` | "Intelligence Assessment" label, CTA text |
| `Index.tsx` | Hero bio, About section, signature line |
| `AskJackye.tsx` | Opening message, FAQ, SEO meta, avatar label |
| `PlatformPhilosophy.tsx` | Add "No judgment, just receipts." |
| `ForEmployers.tsx` | Label updates |
| `IntelligenceChain.tsx` | Footer text |
| `WhatAmISupporting.tsx` | Footer text |
| `OnePager.tsx` | Section 03 text |
| `PendingReviewsDashboard.tsx` | "Strategic Analysis" label |
| `EmployerVerificationPending.tsx` | "Jackye Insights" → "Insider Context" |
| `viral/ShareableScoreCard.tsx` | Footer attribution |
| `viral/IntelligenceSnapshotCard.tsx` | Footer attribution |
| New: `AddYourStoryCTA.tsx` | Reusable employer CTA component |

### What Stays

- **Jackye Clayton** remains credited as the founder (About section, footer, bio card)
- The `/ask-jackye` route stays (avoid breaking links), just the UI label changes
- The headshot and founder card remain on the landing page
- "Run the chain first. Always." tagline stays — it's system-voice already

