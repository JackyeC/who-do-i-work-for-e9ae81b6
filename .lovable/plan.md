

# Job Board Enhancement Plan

## Current State Assessment

Your job board already has solid foundations:
- **Search & Filters**: Text search, industry, work mode, civic score, values filters
- **AI Matching**: Score-based job matching using civic scores + values signals
- **Application Tracking**: Full tracker with status management
- **Auto-Apply**: AI cover letter generation, apply queue (paid feature)
- **Profile & Preferences**: Signal requirements, user profile form
- **Job Detail Drawer**: Rich detail view with civic scores, skills, signals
- **Monetization**: Sponsored listings, Stripe checkout for auto-apply
- **Ghost Job Prevention**: `deactivate-expired-jobs` edge function + `bulk-ingest-jobs` scraper
- **SEO**: Separate `/job-board` (JobIntegrityBoard) public route

## Gap Analysis vs. Your Feature List

| Feature | Status | Gap |
|---|---|---|
| Mobile-First & Fast Loading | Partial | No pagination/infinite scroll (loads 500 jobs), no skeleton loading for cards |
| Accessible & Inclusive Design | Partial | Missing WCAG audit, no dark mode toggle, no font scaling controls |
| Micro-interactions | Partial | Has hover effects, missing progress bars on apply flow |
| Robust Search & Filters | **Done** | Has location, work mode, industry, score, values |
| AI Job Matching | **Done** | Score-based matching with values signals |
| Semantic Search | Missing | Search is basic string matching only |
| Easy Apply / One-Click | Partial | Tracks + opens external URL; no native "Easy Apply" with stored resume |
| Auto-Fill & Progress Trackers | Partial | Auto-apply exists but no application progress indicator |
| Salary Transparency | Partial | Shows salary_range when available, no transparency badge |
| Multimedia | Missing | No video job posts or virtual tours |
| Chatbot / Conversational AI | Missing | No in-board AI assistant |
| Skills Assessments | Missing | No embedded assessments |
| Job Alerts | Missing | No email/push notifications for new jobs |
| ATS Integrations | **Done** | Scrapes Greenhouse, Lever, Ashby, SmartRecruiters, Workable |
| SEO / Structured Data | Partial | Has meta tags, missing JSON-LD structured data |
| Analytics Dashboard | Partial | Has `job_click_events` table but no employer-facing dashboard |
| Deduplication / Ghost Jobs | **Done** | Has expiry deactivation function |

## Recommended Implementation Plan (Prioritized)

### Phase 1 — High-Impact UX Improvements (Do Now)

**1. Infinite Scroll + Skeleton Loading**
- Replace `limit(500)` with paginated fetching (50 per page)
- Add skeleton card placeholders while loading
- Intersection Observer for infinite scroll trigger

**2. Salary Transparency Badges**
- Add a "Pay Transparent" badge on jobs that include `salary_range`
- Filter option: "Only show jobs with salary listed"

**3. "Easy Apply" with Stored Resume**
- Add resume upload to user profile (use existing `career_docs` storage bucket)
- "Quick Apply" button that sends stored resume + generated cover letter
- Track as application in `applications_tracker`

**4. Job Alerts (Email Notifications)**
- New `job_alert_preferences` table (user_id, keywords, location, work_mode, frequency)
- Scheduled edge function that queries new jobs matching preferences and sends email digest
- Simple preferences UI in the Profile tab

### Phase 2 — Intelligence & Engagement

**5. Semantic / AI-Enhanced Search**
- Edge function using Lovable AI to expand search queries (e.g., "PM" → project management, agile, scrum)
- Run on search submit, merge results with standard filter

**6. In-Board AI Assistant (Ask Jackye)**
- Floating chat widget on the job board
- Uses existing Lovable AI gateway
- Answers questions like "Find me remote engineering jobs at companies with good benefits"
- Can trigger filters programmatically

**7. JSON-LD Structured Data for SEO**
- Add `JobPosting` schema markup to job listings for Google for Jobs indexing
- Include salary, location, datePosted, employmentType, hiringOrganization

### Phase 3 — Employer Tools & Monetization

**8. Employer Analytics Dashboard**
- Views, clicks, applications per listing
- Conversion funnel (view → click → apply)
- Uses existing `job_click_events` table

**9. Application Progress Indicator**
- Visual stepper in the tracker: Applied → Screening → Interview → Offer → Decision
- Status update UI with dates

### What We Should Skip (For Now)

- **Video job posts / virtual tours**: Low ROI, requires significant content from employers
- **Embedded skills assessments**: Complex to build, better handled by ATS integrations
- **Full WCAG audit**: Important but best done as a dedicated accessibility pass later
- **Boolean keyword search**: Current filter set covers most use cases

## Technical Approach

- **Database**: New `job_alert_preferences` table, add `has_salary` computed filter
- **Edge Functions**: `send-job-alerts` (scheduled), enhance existing search
- **Storage**: Use existing `career_docs` bucket for resume uploads
- **Frontend**: Refactor Jobs.tsx to support pagination, add alert preferences UI, add JSON-LD to job cards
- **AI**: Leverage Lovable AI gateway for semantic search expansion and chatbot

## Suggested Starting Point

I recommend starting with **Phase 1** (pagination, salary badges, easy apply, job alerts) as these directly address candidate drop-off and engagement. Shall I proceed with Phase 1 implementation?

