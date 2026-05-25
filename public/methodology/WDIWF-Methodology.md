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
