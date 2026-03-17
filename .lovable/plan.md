

## Dynamic Compatibility Engine — Slider-Based Clash Detection

### What exists now
`ValuesSignalMatch` matches **priorities** and **avoidances** against company signal booleans. The 6 **sliders** from the Work Profile Quiz (`flexible_structured`, `remote_inperson`, `steady_fastmoving`, `stable_dynamic`, `handsoff_handson`, `open_needtoknow`) are stored but completely ignored on company profiles.

### What this adds
A slider-to-signal clash detection system that generates contextual "Conflict Insight" warnings when a user's dial position (>70 or <30) conflicts with detected company signals.

---

### Clash Rules (Slider → Signal → Warning)

| Slider Key | User Position | Company Signal | Warning Label | Summary |
|---|---|---|---|---|
| `flexible_structured` | <30 (Flexible) | `hasAiHrSignals` or structured hiring signals | "Structure Friction" | You prioritize flexibility, but this company shows signals of highly structured processes. |
| `remote_inperson` | <30 (Remote) | `hasSentimentData` + RTO-related patterns | "Location Friction" | You prefer remote work, but employee signals suggest in-office expectations. |
| `steady_fastmoving` | <30 (Steady) | `hasJobPostings` surge / high hiring volume | "Velocity Alert" | You prefer a steady pace, but hiring patterns suggest rapid scaling. |
| `stable_dynamic` | <30 (Stable) | `hasLayoffSignals` or `hasWarnNotices` | "Structural Shift" | You value stability, but current signals indicate organizational restructuring. |
| `handsoff_handson` | <30 (Hands-off) | `hasSentimentData` with oversight patterns | "Autonomy Risk" | You value independence, but employee signals suggest high-oversight management. |
| `open_needtoknow` | <30 (Open) | no pay equity, no benefits data | "Transparency Gap" | You prefer open communication, but public disclosure signals are limited. |

The threshold is **30/70** — if slider < 30, user leans strongly left; if > 70, user leans strongly right. Clashes only fire when the opposite-side signal is detected.

---

### Implementation

**Edit**: `src/components/company/ValuesSignalMatch.tsx`

Changes to `computeMatches`:
- Add a new section after avoidance matching: **slider clash detection**
- Read `profile.sliders` and check each against signal booleans
- Clashes produce `MatchResult` items with type `"mismatch"` and a new optional field `tacticalQuestion` (string, only shown to paid users)
- Each clash includes a specific "ask this in your interview" tactical question

Changes to the `MatchResult` interface:
- Add optional `tacticalQuestion: string`
- Add optional `source: string` (e.g., "Employee sentiment", "Hiring data")

Changes to the UI render:
- Mismatches from slider clashes render with an amber left-border accent (not red)
- Tactical questions render blurred with a small "Unlock" link for free users (using `ReportTeaserGate` pattern)
- Strong matches (slider aligns with signal) render in emerald green

**Tactical Questions** (one per clash):

| Clash | Question |
|---|---|
| Structure Friction | "How does the team balance process with individual autonomy in day-to-day work?" |
| Location Friction | "How has the team's collaboration model evolved since recent office-presence changes, and how is deep-work time protected?" |
| Velocity Alert | "What does onboarding look like during a scaling phase, and how are expectations set for new hires?" |
| Structural Shift | "How is the current restructuring affecting team composition and project continuity?" |
| Autonomy Risk | "How much latitude do individual contributors have in setting priorities and managing their own time?" |
| Transparency Gap | "How does leadership communicate compensation philosophy and organizational changes to the team?" |

---

### Files

| File | Action |
|---|---|
| `src/components/company/ValuesSignalMatch.tsx` | **Edit** — add slider clash logic, tactical questions, updated UI |

One file edit. No new components. No database changes.

