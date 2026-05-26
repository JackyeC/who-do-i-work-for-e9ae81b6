# Who Do I Work For - Methodology

**How we source, score, and verify every claim in an employer dossier.**

Author: Jackye Clayton, Founder  
Last updated: May 2026  
Site: https://who-do-i-work-for.lovable.app

---

## 1. Our Standard

We do not invent facts. Every claim displayed in a dossier carries a `source_label` and `source_url` pointing back to the original public record. If a data module fails to return, we say so in the UI rather than fill the gap with guesses. This is enforced in code (the "Non-Destructive Truth" pipeline) and in our editorial standard.

If we cannot attribute it, we do not publish it.

---

## 2. Primary Data Sources

All sources below are public-record or licensed APIs. We do not scrape paywalled content and we do not purchase resume databases.

### 2.1 Political & Influence
| Source | What we pull | Used for |
|---|---|---|
| FEC (Federal Election Commission) | PAC contributions, candidate filings | Follow the Money, Capitol Watch |
| LDA (Lobbying Disclosure Act) filings | Quarterly lobbying spend, issue areas, bill numbers | Policy Receipts, lobbying spend |
| OpenSecrets / dark-money databases | 501(c)(4) flows, super PAC contributions | Capitol Watch (premium) |
| Congressional voting records | Bills lobbied vs. votes cast | Congressional Context |

**Known limit:** FEC data captures PAC-routed donations. Individual employee donations made without a PAC affiliation are not captured. We disclose this in the UI.

### 2.2 Regulatory & Legal
| Source | What we pull | Used for |
|---|---|---|
| EEOC public case database | Discrimination charges, settlements | EEOC Cases layer |
| SEC EDGAR (10-K, 14A proxies) | Executive comp, pay ratios, vote outcomes, risk factors | Proxy Intelligence, leadership pay, power mapping |
| OSHA enforcement records | Workplace safety violations | Risk Signals |
| NLRB filings | Union petitions, unfair labor practice charges | Labor organizing layer |
| USAspending.gov | Federal contracts, agency-by-agency | Government Contracts (ICE-categorized) |
| WARN Act notices (state DOLs) | Mass-layoff filings | Layoff Probability score |

### 2.3 News & Editorial
| Source | What we pull | Used for |
|---|---|---|
| GNews API | English-language news, filtered by company + workplace topic | The Work Signal, Live Ticker |
| Firecrawl | On-demand scraping of publisher pages | Claim generation, receipts |
| Curated publisher list | Mainstream + labor + trade press | Story objects (JRC) |

News goes through a **fail-closed** ingestion pipeline. English-only, topic-filtered (regulation, layoffs, pay equity, labor organizing, AI workplace, DEI, etc.), and the company name must match before a claim is generated. Substring matches alone do not pass.

### 2.4 Corporate Behavior
| Source | What we pull | Used for |
|---|---|---|
| Company SEC filings (10-K, 14A) | Stated mission, risk language, exec pay | Mission Integrity, Contradiction Detection |
| Company press releases & blog | Public commitments | Compared against behavior signals |
| Hiring signals (ATS feeds, BLS) | Open reqs, pay ranges where posted | Hiring Activity, Pay Transparency |
| Patent filings (USPTO) | R&D direction | Innovation & Growth |

---

## 3. The Scoring Engines

Scores are **derived**, not editorial. The formula for each is open below.

### 3.1 Employer Clarity Score (0–100)
A composite of:

- Source coverage (how many of the 8 data modules returned data)
- Source recency (decay function on age of underlying records)
- Public attribution (claims with a working source URL)
- Editorial review status

A score of 70+ means the company has enough verifiable public record for a confident read. Below 40 means thin coverage and we say so.

### 3.2 Five-Dimension Match Engine
For users with a saved Values Profile, we match against:
1. Compensation & pay transparency
2. Workforce stability
3. Political & regulatory alignment with user dealbreakers
4. Leadership behavior (proxy + news signals)
5. Public commitments vs. behavior (contradiction score)

### 3.3 Risk Signals
Six categories rolled up into Low / Moderate / Elevated:

- Hiring activity, workforce stability, pay transparency, company behavior, innovation activity, public sentiment.

Thresholds: average ≥65 = Low, 40–64 = Moderate, <40 = Elevated.

### 3.4 Insider, Flight Risk, Layoff Probability, Recruiter Reality, Mission Integrity
Each is a documented formula in our codebase. They combine the public sources above with no hidden inputs.

---

## 4. Contradiction Detection (Our Core Thesis)

We chronologically map what a company **said** (mission statements, press releases, ESG reports, CEO memos in SEC filings) against what they **did** (PAC giving, layoffs, EEOC cases, lobbying positions) over the same time window. When the two diverge, that gap is the dossier's headline.

This is the work that earned 20+ years of HR authority. The tool just makes it scalable.

---

## 5. The Pipeline

```
Public record ─┐
News API ──────┤
Firecrawl ─────┼─► OSINT Parallel Scan ─► Claim Generation (Zod-validated)
SEC EDGAR ─────┤        (8 modules)         │
FEC / LDA ─────┤                            ▼
EEOC / OSHA ───┘                  Source-attributed claims
                                            │
                                            ▼
                                  Scoring engines + editorial review
                                            │
                                            ▼
                                    Dossier (UI + export)
```

Every claim that reaches the UI passes through Zod schema validation. If a source URL is missing or the company name does not match, the claim is rejected before it can render.

---

## 6. The "Fully Audited" Standard

A company earns the Fully Audited badge only when:

- 5+ verified claims across at least 4 of the 8 data modules
- 100% source attribution (every claim has a live URL)
- Editorial review by Jackye or a vetted reviewer
- Re-verified within the last 90 days

Most companies are not Fully Audited. That's the point. The badge means something.

---

## 7. What We Will Not Do

- We do not buy or sell resume data.
- We do not run a "CEO memo decoder" or any surface-level vibes tool. Removed by policy.
- We do not run automated job applications on a candidate's behalf without a human in the loop and a Fairness Contract on file.
- We do not display claims without a source.
- We do not edit a quote, headline, or source label to fit a narrative.

---

## 8. Corrections

If a dossier contains an error, anyone can request a correction at /request-correction. Verified corrections land in the next refresh cycle (typically <48 hours) and the source change is logged.

---

## 9. Founder Accountability

Jackye Clayton has 20+ years in HR, including diversity strategy and recruiting leadership. The Crown icon (👑) in the UI identifies claims that carry her direct editorial take - separated from machine-generated signals so readers can tell the two apart.

Contact: jackye@jackyeclayton.com

---

## 11. The Experience, Described in Full

This section describes what the product looks like, how it behaves, and why it is built that way. Written so someone who has never opened the site, or who cannot see it, understands exactly what a user gets.

### 11.1 The homepage (`/`)

**What you see.** A warm dark page, near-black background (#0c0b0a), Inter typeface throughout. Top center: the wordmark "Who Do I Work For" in a quiet weight, no logo mark, no animation gimmicks. Below it, one large headline that says what the product does in plain English, followed by a single horizontal search bar with the placeholder "Search any employer." No carousel. No hero video. No three-column "features" grid.

**How it behaves.** You type a company name. As you type, suggestions appear underneath the bar, pulled live from our `companies` table, ranked by `employer_clarity_score` descending so vetted employers surface first. Hitting Enter routes you to that company's dossier. If we have no record of the company, you are routed to the **Intelligence Request** flow (Section 11.7) rather than a dead "no results" page.

**Why it is built this way.** The single-input homepage is deliberate. Job seekers under stress do not want to learn an information architecture. One field, one verb, one outcome. The dark warm palette is editorial, not corporate SaaS - it signals this is a publication, not a vendor.

**What you are getting.** A door. Not a marketing site.

### 11.2 The Work DNA quiz (`/quiz`)

**What you see.** One question at a time, centered, large type. Four answer cards stacked vertically on mobile, two-by-two on desktop. A thin progress bar across the top. No "Next" button.

**How it behaves.** Tapping an answer triggers a 400ms auto-advance to the next question. The press has a tactile feedback (the card scales to 97% for 150ms then releases). Total flow is six to nine questions depending on branching. At the end you land on a personalized briefing screen with a soft 1.5-second delay before a lead-capture modal focuses an email field.

**Why it is built this way.** Auto-advance removes the "did I do that right" hesitation that kills completion rates on long forms. The 400ms is tuned: fast enough to feel responsive, slow enough that the user registers their choice landed. The delayed email capture is intentional - we earn the ask by delivering the briefing first.

**What you are getting.** A persisted profile (`work_dna_profiles` table) that powers the five-dimension match engine across every dossier you view afterwards.

### 11.3 The company dossier (`/company/{slug}`)

This is the core artifact. Everything else in the product feeds into or out of this page.

**Page header.** Company name in large display weight. Underneath, a row of metadata: industry, headcount band, headquarters city, and a colored verdict pill - one of "Aligned," "Mixed Signals," "Caution," or "Under Review." The pill color is driven by the four-tier risk verdict logic, not arbitrary.

**Summary card.** A short three-to-four sentence editorial summary written in Jackye's voice (direct, no corporate buzzwords, no em dashes). Below the summary, a row of clickable anchor chips: "Workforce Signals," "Political Money," "Lobbying," "Legal Record," "Leadership," "News." Each chip jumps to that exact section deeper on the page using a fragment ID (e.g. `#workforce-signals`). This is the "Dossier Anchors" pattern - users do not have to scroll-hunt.

**Employer Clarity Score.** A single number from 0 to 10 with one decimal place, rendered large. Underneath the number, four small bars showing the sub-scores (Transparency, Consistency, Behavior, Receipts). Hovering or tapping any bar reveals the exact inputs that produced it. The score is not a black box - the math is published in Section 6 of this document and the inputs are inspectable in the UI.

**Workforce Signals section.** Cards for each verified signal: layoff events (with date, headcount, WARN filing link), EEOC charges (with year and resolution status), OSHA citations, NLRB cases, H-1B and PERM filings. Each card carries a small source badge in the corner - the publication name or government agency, hyperlinked to the original record.

**Follow the Money section.** Two stacked tables. Top table: PAC contributions by recipient and party, with year filters. Bottom table: itemized lobbying expenditures by quarter with issue area and bill numbers. Both tables are sortable. Each row has a "View FEC filing" or "View LDA filing" link. We do not summarize "the company is conservative" or "the company is progressive" - we show the receipts and let the user decide. The political spectrum explainer (Section 11.8) is one tap away.

**News strip.** A vertical list of the last 10 stories matched to this company, each rendered as a JRC Story Object: a one-line Hook, a two-sentence Summary, a Receipts row with up to three source links, and an Entity tag row. Stories that triggered a behavioral flag carry a small icon. Off-topic noise is filtered out at ingestion - if you see a story here, it cleared the quality gate.

**Investigation drill-down.** Anywhere a claim appears, you can tap it to open a three-level progressive disclosure: Level 1 is the summary you already see, Level 2 is the structured claim with all attributed fields, Level 3 is the raw source record (the actual FEC filing, the actual press release, the actual court docket).

**Premium gating.** Some sections (Capitol Watch dark-money tracking, Proxy Intelligence from SEC 14A filings, the full news archive beyond 10 stories) are blurred behind a paywall card that names exactly what is hidden and why it is worth unlocking. We do not hide that gating exists.

**Why it is built this way.** A dossier is a forensic document, not a profile page. Every visible element must be defensible to a lawyer, a journalist, or a hiring manager who challenges it. The anchor chips, source badges, and three-level drill-down all exist so a user can answer the question "how do you know that?" in under three taps.

**What you are getting.** A document you can email to a recruiter, paste into a Glassdoor reply, or hand to your spouse when you are deciding whether to take the offer.

### 11.4 The Intelligence Check (free scan)

**What you see.** After searching a company you have not viewed before, a one-page report renders in roughly 8 to 15 seconds. A progress UI shows which data modules are being queried in parallel (News, FEC, LDA, SEC, Government Contracts, Patents, Litigation). If a module fails, the toast at the end names exactly which module failed - we do not hide partial coverage.

**How it behaves.** The free Check is rate-limited per session. A small counter in the corner shows "X free scans remaining today." Hitting zero surfaces an upgrade card, not a hard block - existing dossiers remain readable.

**Why it is built this way.** Naming which modules failed is a trust move. Most competitors hide gaps. We show them so the user can judge confidence.

### 11.5 The dashboard (`/dashboard`, "Your Signal")

**What you see.** A personalized landing strip with the user's first name, the badges they have earned (e.g. "Verified Researcher" after five dossiers viewed, "Pattern Spotter" after using cross-company comparison), and a rotating set of recent audits - the last six companies they checked, with each card showing the verdict pill and the date.

Below that, a "Pattern Signals" feed - cross-company trends detected by our pipeline. Example card: "Three companies you viewed this month filed WARN notices in the same metro area."

**Why it is built this way.** The dashboard is identity, not navigation. It tells the returning user "we remember what you cared about" without requiring them to organize folders.

### 11.6 The applications workflow (`/applications`)

**What you see.** A vertical list of jobs the user has saved or applied to, each row showing company name, role title, application stage, and an alignment indicator (a small colored dot mapped to the user's Work DNA profile vs. the company's signals).

Tapping a row opens a side drawer with a context-aware coaching panel: AI-generated interview prep based on the company's actual public record, a document vault for resumes and cover letters tailored to that role, and a live status feed if the job posting is still on the employer's ATS.

**Why it is built this way.** Most application trackers are spreadsheets dressed as apps. This one knows the company. The coaching is grounded in the dossier, not generic.

### 11.7 The Intelligence Request flow (unknown companies)

**What you see.** When a user searches for a company we have not indexed, instead of "No results" they get a short form: company name (prefilled from their search), website, and an optional note. Submitting it kicks off an automated audit pipeline and the user gets an email when the dossier is ready (usually 10 to 30 minutes).

**Why it is built this way.** The long tail of employers is enormous. Treating an unknown company as a lead magnet rather than a dead end converts curiosity into coverage.

### 11.8 Newsletter / The Work Signal (`/newsletter`)

**What you see.** A magazine-style editorial layout. Featured story at top with a full-bleed poster card (vintage public-domain art with a CSS color overlay and a category stamp - no AI-generated images). Below, a grid of recent stories filtered by category (Workforce, Money, Policy, Tech, Culture). Each story carries a small bias bar showing the lean of its sourcing.

**Why it is built this way.** A publication, not a blog. The poster-card aesthetic is a deliberate signal that the analysis is editorial work, not algorithmic regurgitation.

### 11.9 Accessibility behaviors that are not optional

- **Neurodivergent mode** is a toggle in the user menu. It restructures every page: collapses long sections into accordions, removes auto-rotating elements, increases line height, and surfaces a "what to do next" card at the top of each page.
- **Keyboard navigation** works through every flow including the quiz and the dossier anchor chips.
- **Color is never the only signal.** Verdict pills carry a text label. Bias bars carry a numeric value. Source badges name the publication.
- **No serif fonts. No exclamation points. No em dashes in copy.** This is enforced by the editorial voice system.

### 11.10 How the experience is built (technical, plain English)

The frontend is a React 18 single-page app built with Vite, styled with Tailwind CSS using a strict semantic-token system - every color, spacing value, and radius comes from a design token, never a raw hex code in a component. This means a theme change propagates everywhere without touching component files.

The backend is Lovable Cloud (Supabase under the hood). Data lives in Postgres tables with Row-Level Security policies on every user-owned table. Long-running enrichment jobs run as edge functions written in TypeScript on Deno, invoked either by user action (a search) or by scheduled cron with vault-stored secrets.

AI calls are routed through the Lovable AI Gateway, primarily to Google Gemini 2.5 and OpenAI GPT-5 family models. Every AI response that produces a user-facing claim is validated against a strict Zod schema; if the validation fails, the call retries with a more conservative prompt rather than rendering malformed output.

Interactions are tuned: sub-350 millisecond transitions, press states that scale to 97% for tactile feedback, focus glows on inputs, pulsing loaders so the user knows we are working. Failures show specific error messages, not "something went wrong."

**What you are getting, in one sentence.** A research tool that behaves like a publication, sourced like a court filing, and paced like a conversation.

---

## 12. Page-by-page UI/UX walkthrough (blind-friendly)

This section describes every major user-facing page well enough that a reader who cannot see the screen can picture exactly what is there, how it behaves, why it was built that way, and what they get from it. Pages are grouped by user intent.

The whole app is built on the **warm editorial dark theme**: warm dark background (#0c0b0a), Inter sans-serif throughout (no serif fonts), Gold #F0C040 as the primary accent, semantic risk colors (civic-green, civic-yellow, destructive), small mono-caps eyebrow labels above section titles, generous whitespace, and editorial-magazine rhythm rather than dashboard density. Animations are short (150 to 350 ms). Every interactive element has a tactile press state.

### 12.1 Home (`/`)

**What you see.** Marketing nav across the top. A centered hero with a mono-caps eyebrow "AUDIT BEFORE YOU SAY YES" in primary gold, then a large two-line H1 "Stop applying. / Start aligning." (second line in gold). A muted sub-line: "Every company runs a background check on you. WDIWF flips it. Pull the receipts on politics, enforcement, layoffs, and values from the public record." Below: a single large search input ("Check who you really work for at..."), then two CTAs side by side — primary "Check an Employer Before You Apply", outline "See a Real Company Example" pointing to a sample dossier. Under that, a mono-caps trust line: "Built on FEC, SEC, OSHA, NLRB, BLS, and more."

**How it behaves.** Faint primary-color radial glows in two corners. The hero elements fade in with staggered 400 to 700 ms `heroFadeIn` keyframes, never starting at opacity 0 inline (so search engines and scroll-restore never see a blank). A live `LiveIntelligenceTicker` strip below the hero scrolls left-to-right with the latest Jackye-commented news. Below that, a `FullyAuditedShowcase` section, a three-step "How It Works" with numbered cards (Define what good means, Investigate and match, Apply with receipts), a six-tile "Product Modules" grid, and finally the founder section and footer.

**Why it is built this way.** Identity-first positioning. The homepage is one promise, one search box, one example. No carousel, no auto-playing video, no marketing fluff. Tiles with "Coming Soon" badges are honest about what is and is not live.

**What you are getting.** A 5-second understanding of what this product does, a direct way to start a scan, and an example to look at if you need proof.

### 12.2 Dashboard (`/dashboard`, tab-based "Your Signal")

**What you see.** A compact 48-pixel header strip showing the current tab name (for example "Your Signal", "Tracked Companies", "My Profile", "Tracker", "Apply Kit", "Mock Interview"). Below that, the body switches based on the `?tab=` query parameter.

**Tabs available:**
- **overview** — `YourSignalDashboard` with the user's first name, earned badges (Verified Researcher, Pattern Spotter), and a rotating set of recent audits.
- **tracked** — `SlotManagementDashboard` for managing which companies the user is actively watching.
- **matches** — `AlignedJobsList` (jobs matched to the user's Dream Job Profile).
- **values** — `DreamJobProfileSummaryCard` plus `MyValuesProfile` editor.
- **how** — `HowDoIGetThere` career planning module.
- **outreach** — `OutreachIntelligence` for warm-intro mapping.
- **relationships** — `RelationshipDashboard`.
- **tracker** / **app-tracker** — `TrackingDashboard` / `TrackerSection` for applications.
- **auto-apply** — gated behind the Purple Squirrel onboarding flow; once complete shows `AutoApplySettings` and `ApplyQueueDashboard`.
- **offers** — premium `OfferClarityWizard` plus a link to past reports.
- **alerts** — `UserAlertsList`.
- **preferences** — `PreferenceCenter`.
- **profile** — `DreamJobProfileSummaryCard`, `UserProfileForm`, `DataWipeButton`.
- **jobs**, **apply-kit**, **mock-interview**, **search-inbox**, **search-saved** — embedded sections of those tools.

**How it behaves.** Tab switches animate with a 180 ms fade-and-rise. First-time users see the `FirstLoginOnboarding` modal once. A 5-second timeout prevents being stuck on the loading spinner if auth resolution stalls. Successful credit purchases (`?credit_purchase=success`) surface a `PostPurchaseUpsell` strip until dismissed.

**Why it is built this way.** The dashboard is identity, not navigation. Each tab is one job-to-be-done. Animations are short so power users moving through tabs do not feel slowed down.

**What you are getting.** A single command center for everything personal: your profile, your watchlist, your applications, your matches, your auto-apply rules, your offer history.

### 12.3 Intelligence Check (`/intelligence-check`)

**What you see.** The free public scan page. Eyebrow + headline framing it as the entry-level dossier. A search input identical in shape to the homepage, a results card that streams in as parallel module queries complete (political spending, lobbying, layoffs, EEOC, diversity, claims). Each module shows either its data or an explicit "no public evidence found" line. A persistent counter shows free scans remaining.

**How it behaves.** Modules run in parallel via `useOsintParallelScan`. Partial-success toasts name the modules that failed. Hitting the rate limit surfaces an upgrade card, not a hard block — existing dossiers stay readable.

**Why.** Naming missing modules is a trust move. Most competitors hide gaps; we surface them.

**What you get.** An 8 to 15 second snapshot of an employer's public record with explicit confidence and gap labeling.

### 12.4 Company Dossier (`/dossier/:slug`)

Covered in full detail in Section 11.2 and the verdict logic in Section 4. Summary: warm magazine-column layout at `max-w-3xl`, verdict header with risk pill, coverage summary, signal timeline, media intelligence, snapshot cards with hash-anchor jumps to deep sections, then stacked modules in this order — Power and Influence, Verified Claims, WARN Filings, Proxy Intelligence (SEC 14A), Culture Signal Scanner, Mission Integrity, Advocacy Report, "What This Means For You", Action Bridge, collapsible Interview Prep, collapsible Raw Data Layers (11 numbered accordions). Always-free Hard Interview Questions at the bottom, then transparency disclaimer and two "Your Next Move" cards (Ask Jackye, Work With Jackye). ND mode swaps the whole layout. Paywall is fuzz-and-lock, not hard wall.

### 12.5 Offer Check Entry (`/offer-check`)

**What you see.** Centered hero "Check who you're really working for / before you say yes." (gold second line). Two-card grid: left card "Search any employer" (input + "Run My Scan" button), right card "Check your offer privately" with a top-right mono-caps badge "MOST VALUABLE STEP CANDIDATES SKIP", a paste-first textarea with a privacy trust line ("Your input is processed in-session and not stored"), and a collapsed `<details>` for optional document upload.

**How it behaves.** The "Check My Offer Terms" button only appears once you have pasted 50+ characters. The analysis edge function returns Red Flags (amber card), What's Missing, Negotiate These (gold card), What They Got Right (emerald card), and a bold "Your Power Move" card. Results never persist. Search submissions resolve a company and stream into the result column below; unknown companies switch into `DiscoveryMode`.

**Why.** Privacy-first. Paste beats upload because pasted text strips PII. Two cards force a binary choice between "before I apply" and "before I sign."

**What you get.** A free employer risk verdict and a private offer-letter analysis, with a ramp to the full dossier.

### 12.6 Offer Check Report (`/offer-check/:companyId`)

**What you see.** Authenticated deep report. Back link to the dossier, a header with company snapshot card (logo block, name, industry, state, employee count, total signals, disclosure category count, stale-section count, report timeline dates), a stale-warning banner if any section is over 90 days old, the `OfferCheckSnapshot` block with a derived verdict and Jackye's take, a "Signal Timeline" link and `WatchCompanyButton`, the full `OfferCheckReport` with per-section signal rows (each carries confidence badge: Direct Source, Multi-Source, High, Medium, or Low), and a private "Review Your Offer Letter" CTA card.

**How it behaves.** Save button writes to `offer_checks` table. Free users cap at a low save limit; hitting it shows an upgrade toast. Share button toggles an `OfferCheckShareCard`. Premium-gated "Export Report" (PDF) and "Compare Companies" cards at the bottom.

**Why.** Persistent, saveable, comparable. The free check is a snapshot; this is the working document.

### 12.7 Applications (`/applications`)

**What you see.** Tight max-w-3xl column. Briefcase icon + "Your Applications" header. If empty: a dashed-border card with the line "Nothing in your pipeline yet" and two buttons (Scan a company, Ask Jackye). Otherwise a vertical list of cards, one per application, each showing job title, company name, "Updated MMM d, yyyy", a small mail icon line if the post-apply dossier has email status, a status select (Considering, Draft, Submitted, Interview, Offer, Rejected, Ghosted) with color-coded styling, and an arrow indicating tap-through.

**How it behaves.** Status changes update in place via `useApplicationsTracker`. Card click navigates to the application detail page; the status select stops propagation so it does not double-trigger.

**Why.** Application trackers are usually spreadsheets dressed as apps. This one knows the company and surfaces dossier receipts inline.

### 12.8 Application Detail (`/applications/:id`)

**What you see.** Side drawer or full-page view with the application's company dossier embedded, AI-generated interview prep grounded in that company's actual public record, a document vault for resumes and cover letters tailored to the role, and a live status feed if the job is still on the employer's ATS.

**Why.** The coaching is grounded in the dossier, not generic. Removes the gap between "I applied" and "I have to prep."

### 12.9 Apply Kit (`/apply-kit`)

**What you see.** A tool that generates a tailored apply package — resume bullets, cover letter draft, and interview talking points — keyed to a specific company plus the user's Dream Job Profile.

### 12.10 Interview Kits (`/interview-kits`) and Mock Interview (`/mock-interview`)

**Interview Kits.** A library page that surfaces prepared interview question banks per company.

**Mock Interview.** A 7-state voice practice tool (idle, briefing, listening, processing, speaking, feedback, summary). Uses Web Speech API for recognition and a deliberately robotic AI voice (not human) so the user does not over-anchor on tone. Anti-cheat rules block paste, tab switching, and excessive silence. Persists transcripts to the database for later review.

**Why robotic voice.** The product position is honesty: this is practice, not a real recruiter. A polished human voice would mislead.

### 12.11 Resume Optimizer (`/resume`) and Cover Letter Optimizer (`/cover-letter`)

**Resume Optimizer.** Upload or paste a resume, pick a target role or company, get a structured rewrite scored against the role's actual signals. Tracks edit history.

**Cover Letter Optimizer.** Same shape — paste current draft or generate fresh, get back a version grounded in the dossier facts (e.g. references a specific company stance the user could speak to), not generic LLM filler.

### 12.12 Values Profile (`/values-profile`)

**What you see.** A 6-step guided editorial flow with a sticky progress bar at the top showing "Step X of 6" and the step label. Steps in order: Forced Choices (tradeoff pairs), Dealbreakers, Work Style, Salary Floor, Values Topics rating, then a Summary card that lets you jump back to any step. A fixed bottom bar holds Back and Next buttons.

**How it behaves.** Step transitions slide horizontally (20 px) with a 250 ms ease. Saves to the user's `dream_job_profile` JSONB on completion. Cannot skip forward past unfilled required steps.

**Why.** This profile powers the 5-dimension matching engine for everything else in the product. Doing it once means every match, every alignment score, every "what this means for you" paragraph downstream actually means something.

### 12.13 Values Search (`/values-search`)

**What you see.** Editorial hero "What Does This Company *Actually* Support?" Below: a plain-language "How does this work?" explainer box ("Every company that wants to influence laws or politicians has to file paperwork with the government...we read those filings and sort them by topic so you don't have to. We don't take sides."). Then a `ValuesLensGrid` of 14 topic tiles with live counts. Tapping a tile drills into `ValuesLensResults` plus related stories.

**Why.** Lets a user start from "I care about X" instead of "I care about company Y."

### 12.14 Career Intelligence (`/career-intelligence`)

**What you see.** "You vetted the role. We vet the employer." headline. `EmployerDossierSearch`, then either the selected company's `EmployerDossierCard` + `BeforeYouAcceptBlock` + `WhatThisMeansForYou`, or a sample preview, or (for unknown companies) a `CompanyResearchTrigger`. Below: `InterviewPrepBrief` and a 8-tab deep-dive section (Upload resume, History, Negotiation, Comp, Values, etc.).

### 12.15 Career Map (`/career-map`, redirects to Career Intelligence)

A 6-step AI discovery flow producing a multi-path HTML career report. Currently consolidated into Career Intelligence.

### 12.16 Negotiation Simulator (`/negotiation-simulator`)

**What you see.** A scenario-based simulator where the user inputs an offer and counter-proposal, and the AI plays the recruiter with realistic pushback grounded in market data and the company's own comp signals from the dossier.

### 12.17 Evidence Logger (`/evidence-logger`)

**What you see.** A short forensic intake form for users documenting workplace incidents. Captures date, witnesses, what was said, code-word patterns (links into the Code Word Scanner). Part of the Legal Defense Suite.

### 12.18 Follow The Money (`/follow-the-money`)

**What you see.** A production data view mapping FEC and LDA records: corporate PAC contributions, lobbying spend by issue, recipient breakdowns. Each row links back to source filings. Visual treatment is data-dense but still editorial — no chartjunk.

### 12.19 Newsletter / The Work Signal (`/newsletter`)

**What you see.** Magazine-style editorial layout. A `LeadStoryCard` hero with a vintage public-domain poster image (CSS-overlaid, never AI-generated) and a category stamp. Below: a category filter strip and a grid of story cards. Each story carries a bias bar showing source lean, a Hook line, a Summary, Receipts (linked sources), and Entity tags.

**Why.** A publication, not a blog. Poster-card aesthetic signals that this is editorial work, not algorithmic regurgitation.

### 12.20 JRC Feed (`/jrc`) plus JRC Company File (`/jrc/company/:slug`) and JRC Person File (`/jrc/person/:slug`)

**JRC Feed.** Chronological feed of 4-layer Jackye-Receipts-Centered story objects (Hook, Summary, Receipts, Entity) with bias legends.

**Investigation Files.** Forensic dossiers aggregating every JRC story and receipt tied to a single company or person. Used by power users and journalists to follow a thread.

### 12.21 Browse (`/browse`)

**What you see.** Compact editorial header ("EMPLOYER INTELLIGENCE / Company Directory / N employers tracked"). A tab switcher (Companies / Non-Profits), an "Add Company" CTA, then a controls row (search input, industry dropdown, sort dropdown, Audited-only toggle), then a paginated card grid. Each card shows logo block, name, industry, civic footprint score pill, audited badge if applicable.

**How it behaves.** Pagination shows up to 7 page numbers with ellipses for longer ranges. Search and filter run client-side for snappiness once the list is loaded.

### 12.22 Search Results (`/search`)

**What you see.** A search bar pinned to the top, then either: DB results (cards grouped under "DATABASE RESULTS") plus sample suggestions, OR a discovering state (spinner + "Discovering 'X'") that automatically invokes the `company-discover` edge function and redirects to the new dossier when ready, OR an `IntelligenceRequestCard` lead-magnet form when nothing was found.

**Why.** The long tail of employers is enormous. A missing company is a lead, not a dead end.

### 12.23 Jobs (`/jobs`) and Jobs Feed (`/jobs-feed`)

**Jobs.** Public listings sampled from indexed roles. Each card links directly to the employer's own ATS (never a middleman) and carries the company's verdict pill so a low-trust employer is flagged before the click.

**Jobs Feed.** Authenticated, personalized — only roles that align with the user's Dream Job Profile, scored by the 5-dimension engine.

### 12.24 Ask Jackye (`/ask-jackye`)

**What you see.** A chat interface fronting an AI model trained on Jackye's voice DNA (direct, fluff-free, 4-beat analytical structure). The user can ask about a specific company, a generic situation, or a contract clause. Responses cite sources from the dossier when possible, and surface a crown icon for any take that is Jackye-authored.

**Why.** The AI coach is always available. It is grounded in the same public-record data as the rest of the product.

### 12.25 Work With Jackye (`/work-with-jackye`)

**What you see.** Eyebrow "ADVISORY SERVICES", H1 "Work With Jackye", a portrait photo of Jackye with her bio line "15+ years in HR · Recruiting · Talent Strategy · HR Tech". Bookable services in a two-column pricing grid (each card shows title, format, duration clock icon, target audience, one-time price, "Book Now" button wiring into Stripe Checkout). Below: Custom Engagements (advisory, HR tech positioning, employer brand strategy) and an inquiry form (name, email, service dropdown, optional message) that writes to `advisory_interest`.

**Why.** "AI coach is always available. But sometimes you need the real thing." The clear contrast is the entire pitch.

### 12.26 Pricing (`/pricing`)

**What you see.** Three pricing tiers: **The Check** (free) — single dossiers and rate-limited intelligence checks; **The Signal** ($49/month) — saved offer checks, tracked companies, full dossier access; **The Match** ($149/month) — auto-apply, recruiter intelligence, dream-job matching. Each tier names the outcome, not the feature ("Know before you sign" not "PDF export"). Stripe Checkout links per plan.

### 12.27 About (`/about`)

**What you see.** Founder-credibility-led page. Jackye's photo, her 20+ year background in HR and recruiting, the founding story (the gap between what companies claim and what they fund), and a manifesto-style statement.

### 12.28 How It Works (`/how-it-works`)

**What you see.** Long-form explainer mirroring the 3-step pattern from the homepage but deeper: the data pipeline diagram (FEC + SEC + OSHA + NLRB + WARN + USAspending + GNews flowing into normalization, then claim generation, then the dossier), the contradiction-detection thesis (chronological mapping of claims vs behavior), and an "everything traces to a source" guarantee.

### 12.29 Methodology (`/methodology`)

**What you see.** This document, rendered as a live web page. At the top: a "Share the methodology" download card with three buttons (PDF, DOCX, Markdown). The body is the full editorial methodology you are reading right now, with anchor links to each section.

### 12.30 Login (`/login`)

**What you see.** Centered card with email + password, a Google sign-in button, and a tab toggle for Sign Up. Validation messages render inline (never as toast alerts that disappear). After login, redirects to the original protected route or to `/dashboard`.

**Why.** Auth is gentle: no email confirmation friction for the soft launch (configurable), Google as the default to reduce password fatigue.

### 12.31 Pages a typical user will rarely see (briefly)

- **`/add-company`** — form to manually request a new company audit.
- **`/request-correction`** — typed correction submission for a specific dossier claim, routed to the founder console.
- **`/contact`** — multi-layer resilient contact/tip form (Resend + DB write).
- **`/terms`, `/privacy`, `/disclaimers`, `/data-ethics`** — standard legal pages, editorial dark theme.
- **`/extension`** — Chrome extension landing with install CTA and a demo of the in-page side panel that surfaces dossier data on any careers site.
- **`/no-regrets`, `/no-regrets-game/episode-*`** — narrative interactive episodes used as premium investigation games.
- **`/peoplepuzzles`, `/trail`** — interactive trail-based investigation games.
- **`/founder-console`** — admin-only Bloomberg-aesthetic triage tool (off-limits to public users).
- **`/admin-ticker`, `/launch-health`** — internal ops dashboards.

### 12.32 Cross-page conventions worth knowing

- **Anchor jumps.** Every snapshot card on the dossier deep-links to its section by `#id` (e.g. `#warn-filings`, `#workforce-signals`).
- **Source labels.** Every claim, signal, or paragraph that asserts a fact carries a `SourceLabel` badge with the source tier (Verified, Multi-Source, Direct Source, Inferred, No Evidence). Tapping it opens the source.
- **Verdict pills.** Same color and label system everywhere: green Low Risk, yellow Medium Risk, red High Risk, muted Under Review. Never invented. Never softened.
- **Coming Soon badges.** Honest. Tiles for unbuilt features show the badge explicitly rather than dead-linking.
- **Empty states.** Never blank. Always name what was checked, why nothing came back, and what the user can do next.
- **The crown icon (👑).** Marks any insight authored by Jackye personally, distinguishing it from system-generated analysis.

**One sentence.** Every page in this product is designed to make a decision easier, sourced enough to defend, and short enough to actually read.
