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
