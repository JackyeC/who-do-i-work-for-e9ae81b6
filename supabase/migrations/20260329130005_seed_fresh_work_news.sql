-- ============================================================
-- Seed work_news with real, current headlines — March 29, 2026
-- Run in Supabase SQL Editor to populate the live ticker
-- ============================================================

-- Clear stale items older than 7 days
DELETE FROM work_news WHERE published_at < now() - interval '7 days';

INSERT INTO work_news (headline, source_name, source_url, category, themes, is_controversy, sentiment_score, tone_label, published_at)
VALUES
  -- AI & LAYOFFS
  ('2026 tech layoffs reach 45,000 in March — over 9,200 due to AI and automation',
   'TechNode Global', 'https://technode.global/2026/03/09/2026-tech-layoffs-reach-45000-in-march-more-than-9200-due-to-ai-and-automation-rationalfx/',
   'layoffs', ARRAY['Technology', 'Ethical AI'], true, 0.25, 'Alert', now() - interval '1 hour'),

  ('Block cuts workforce from 10,000 to fewer than 6,000 in AI-driven restructuring',
   'Fortune', 'https://fortune.com',
   'layoffs', ARRAY['Technology', 'Worker Rights'], true, 0.2, 'Alert', now() - interval '2 hours'),

  ('Companies laying off workers because of AI''s potential — not its performance',
   'Harvard Business Review', 'https://hbr.org/2026/01/companies-are-laying-off-workers-because-of-ais-potential-not-its-performance',
   'layoffs', ARRAY['Ethical AI', 'Worker Rights'], true, 0.3, 'Alert', now() - interval '3 hours'),

  ('AI layoffs are coming — 75% of displaced workers don''t apply for unemployment benefits',
   'Fortune', 'https://fortune.com/2026/03/09/ai-layoffs-unemployment-insurance-benefits-systems-bls/',
   'layoffs', ARRAY['Worker Rights', 'Pay Equity'], true, 0.2, 'Alert', now() - interval '4 hours'),

  -- DEI & CORPORATE ACCOUNTABILITY
  ('Term "DEI" fell 98% across Fortune 100 communications — companies relying on neutral framing',
   'Gravity Research', 'https://www.gravityresearch.com/posts/corporate-dei-shifts-2025-2026/',
   'dei', ARRAY['Diversity & Inclusion', 'Transparency'], true, 0.3, 'Critical', now() - interval '30 minutes'),

  ('22% of companies eliminated the word "diversity" from proxy statements in early 2026 filings',
   'Corporate Board Member', 'https://boardmember.com/security-dei-and-tariffs-executive-compensation-insights-from-late-2025-and-early-2026-proxy-filers/',
   'dei', ARRAY['Diversity & Inclusion', 'Transparency'], true, 0.3, 'Alert', now() - interval '90 minutes'),

  ('2026 DEI priority: making talent programs scrutiny-proof under new federal landscape',
   'HR Dive', 'https://www.hrdive.com/news/dei-trends-2026/810602/',
   'dei', ARRAY['Diversity & Inclusion'], false, 0.5, 'Neutral', now() - interval '5 hours'),

  -- LABOR & UNIONS
  ('NLRB restored to quorum after Senate confirms Trump appointees Murphy, Mayer, and GC Carey',
   'National Law Review', 'https://natlawreview.com/article/top-10-labor-employment-and-osha-trends-2026',
   'policy', ARRAY['Worker Rights', 'Transparency'], false, 0.5, 'Neutral', now() - interval '6 hours'),

  ('Starbucks union proposes $17 minimum wage, 4% annual raises, and minimum staffing requirements',
   'OnLabor', 'https://onlabor.org/march-16-2026/',
   'workplace', ARRAY['Worker Rights', 'Pay Equity'], false, 0.6, 'Positive', now() - interval '7 hours'),

  ('California passes bills preventing employers from using AI alone to discipline or fire workers',
   'ArentFox Schiff', 'https://www.afslaw.com/perspectives/alerts/top-10-labor-employment-and-osha-trends-2026',
   'policy', ARRAY['Ethical AI', 'Worker Rights', 'Anti-Discrimination'], false, 0.6, 'Positive', now() - interval '8 hours'),

  -- REMOTE WORK & EQUITY
  ('Return-to-office mandates stir workplace equity concerns — remote work data shows 20% increase in women applicants',
   'Remote.com', 'https://remote.com/resources/insights-center/rto-impacts-dei',
   'workplace', ARRAY['Diversity & Inclusion', 'Remote Work'], false, 0.5, 'Neutral', now() - interval '4 hours'),

  ('Interior Dept. DEI employees return to jobs after year-long paid administrative leave',
   'Government Executive', 'https://www.govexec.com/workforce/2026/03/trump-administration-paid-these-employees-not-work-more-year-it-just-called-them-back/412344/',
   'policy', ARRAY['Diversity & Inclusion', 'Government'], false, 0.5, 'Neutral', now() - interval '5 hours'),

  -- WDIWF INTELLIGENCE
  ('WDIWF now monitors 850+ companies across FEC, SEC, OSHA, NLRB, BLS, and USASpending.gov',
   'Who Do I Work For', 'https://wdiwf.jackyeclayton.com',
   'wdiwf_intel', ARRAY['Transparency'], false, 0.8, 'Positive', now() - interval '10 minutes'),

  ('Close Brothers banking group cuts 600 jobs, rolls out AI "at pace" across operations',
   'CBS News', 'https://www.cbsnews.com/news/ai-layoffs-2026-artificial-intelligence-amazon-pinterest/',
   'layoffs', ARRAY['Technology', 'Finance'], true, 0.25, 'Alert', now() - interval '9 hours'),

  ('California Civil Rights Dept. implements new regulations to curb discriminatory AI in workplace hiring',
   'National Law Review', 'https://natlawreview.com/article/top-10-labor-employment-and-osha-trends-2026',
   'policy', ARRAY['Ethical AI', 'Anti-Discrimination', 'Worker Rights'], false, 0.6, 'Positive', now() - interval '6 hours'),

  ('One-third of companies with ESG/DEI goals have "re-labeled" programs while maintaining spirit of initiatives',
   'SVDX', 'https://www.svdx.org/blog/2026/3/26/security-dei-and-tariffs-executive-compensation-insights-from-late-2025-and-early-2026-proxy-filers',
   'dei', ARRAY['Diversity & Inclusion', 'Transparency'], true, 0.35, 'Critical', now() - interval '3 hours')

ON CONFLICT (headline) DO NOTHING;
