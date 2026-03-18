

## Audit: What's Built vs. What's Required

Here is a feature-by-feature comparison of your research checklist against the current codebase.

### Already Built

| Feature | Status | Where |
|---|---|---|
| Salary transparency badge | Done | `SmartJobRow`, `JobDetailPanel`, `JobIntegrityCard` |
| Pay range display | Done | Shows salary or "Not disclosed" / "No salary posted" |
| Job freshness indicators | Done | `SmartJobRow` (Fresh/Stale), `JobDetailPanel` (Fresh listing / Limited hiring visibility) |
| Company clarity score on cards | Done | `SmartJobRow` shows score badge; `JobDetailPanel` shows score/100 |
| 1-2 key company signals on cards | Done | Strategic Context + Connection Chain on `JobIntegrityCard` |
| Company profile link from every job | Done | Company name links to `/company/:slug` on all cards |
| Values-based ranking | Done | `getUserPreferenceCategories()` sorts by alignment signal overlap |
| "Aligned with your priorities" | Done | `MatchIndicator` (Strong/Good/Partial Match) + `PersonalizationBanner` |
| Personalization banner | Done | `PersonalizationBanner` with nudge or active filter display |
| JSON-LD JobPosting schema | Done | `JobPostingSchema.tsx` with salary, location, employment type |
| Search (title, company, location) | Done | Text search in `JobIntegrityBoard` |
| Intelligence filters (verified, certified, pay transparent) | Done | Select dropdown with 4 options |
| "Before You Apply" section | Done | `JobDetailPanel` with conditional warnings |
| Outbound apply link | Done | Apply button with click tracking |
| External RSS feed aggregation | Done | `ExternalJobFeed` component |
| Click tracking | Done | `job_click_events` insert on apply |

### Not Yet Built (Gaps)

| Feature | Priority | Notes |
|---|---|---|
| **Ghost job / stale / repost / evergreen detection** | High | Freshness labels exist but no repost or evergreen detection logic. No duplicate detection. Need neutral labels like "Reposted recently", "Evergreen page detected", "Limited ATS evidence" |
| **Expanded search filters** | High | Missing: skill, salary range slider, function/department, seniority, remote/hybrid/onsite toggle. Currently just a text box + one dropdown |
| **Intelligence filters** | High | Missing: "recent changes", "hiring reality", "lower risk signals", "values alignment" as filterable options |
| **Ranking logic upgrade** | Medium | Current sort: featured > alignment. Missing: salary transparency boost, freshness boost, ghost-job penalty, clarity score weight |
| **Job detail page (unique URL)** | High | No `/job-board/:id` route exists. `JobDetailPanel` and `JobDetailDrawer` exist as side panels but aren't routable. Needed for SEO and Google for Jobs |
| **"What this means for you"** | Medium | Exists on company profiles but not on job detail |
| **"Potential mismatch" indicator** | Medium | Only shows positive matches, never shows mismatches or conflicts |
| **Save / track / apply workflow** | Medium | No save or track buttons on the job board cards. `TrackingDashboard` exists but isn't wired to job board |
| **Mobile-first layout polish** | Medium | Grid works on mobile but filters, card density, and touch targets need optimization |
| **Employer posting rules** | Later | No structured submission with required fields, expiration dates |
| **Duplicate job detection** | Later | No deduplication logic |

### Recommended Build Sequence

**Phase 1 -- Core Filters + Ranking (immediate)**
- Replace the single dropdown with a proper filter bar: work mode toggle (remote/hybrid/onsite), seniority select, department select, salary range filter
- Add intelligence filter chips: "Pay Transparent", "High Clarity", "Values Aligned", "Fresh Only"
- Upgrade ranking logic to weight: featured > salary transparency > clarity score > alignment > freshness > penalize stale

**Phase 2 -- Job Detail Page + SEO (next)**
- Add `/job-board/:id` route rendering `JobDetailPanel` as a full page
- Inject `JobPostingSchema` on each detail page
- Add "What this means for you" section using user work profile
- Add "Potential mismatch" warnings when user avoidances conflict with company signals
- Add save/track button (requires auth)

**Phase 3 -- Ghost Job Detection (next)**
- Add freshness tier labels: "Fresh listing", "Aging", "Limited hiring visibility", "Evergreen page detected"
- Flag jobs older than 60 days with no ATS evidence
- Detect reposted jobs (same title + company within 90 days)
- Add neutral "Reposted recently" badge
- Use these signals as ranking penalties

**Phase 4 -- Save/Track + Mobile Polish (later)**
- Save job to user's tracked list
- Job status tracking (Interested, Applied, Interviewing)
- Mobile filter drawer
- Touch-optimized card spacing

This is an audit, not a build prompt. Which phase do you want to start building?

