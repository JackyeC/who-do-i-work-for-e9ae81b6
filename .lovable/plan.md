

## Add Jackye's LinkedIn Learning Class to Dashboard

### What
Add a featured link to Jackye's LinkedIn Learning course ("Writing an Effective Job Description") in the "From Jackye" section of the dashboard, alongside the existing LinkedIn profile link and newsletter placeholder.

### How
Edit `src/components/dashboard/DashboardOverview.tsx` lines 314-327:

- Add a new item above the LinkedIn follow link styled as a content card:
  - Amber numbered label "01" (matching the newsletter item design from the spec)
  - Title: "Writing an Effective Job Description"
  - Meta line: "LinkedIn Learning · Course"
  - Links to `https://www.linkedin.com/learning/human-resources-writing-an-effective-job-description/why-job-descriptions-matter` (opens in new tab)
- Keep the existing "Follow Jackye on LinkedIn" link below
- Update the subtitle from "Monday Momentum newsletter" to "Insights & resources" since it now has real content

### Single file change
`src/components/dashboard/DashboardOverview.tsx` — update the "From Jackye" section content only.

