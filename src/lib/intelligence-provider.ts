/**
 * Provider Abstraction Layer
 * 
 * Defines the fallback chain and freshness rules for intelligence sections.
 * This is the configuration layer — actual scraping happens in edge functions.
 */

import type { ProviderName } from './firecrawl-circuit-breaker';

export type IntelligenceSection =
  | 'leadership'
  | 'careers'
  | 'news'
  | 'reputation'
  | 'recruiter_intelligence'
  | 'worker_sentiment'
  | 'compensation'
  | 'ai_hiring'
  | 'ideology'
  | 'benefits'
  | 'sanctions_screening'
  | 'wikidata_enrichment'
  | 'corporate_structure'
  | 'political_influence'
  | 'legal_risk'
  | 'lobbying'
  | 'government_contracts'
  | 'insider_trading'
  | 'sec_filings';

/** Freshness TTL in hours per section */
export const SECTION_FRESHNESS: Record<IntelligenceSection, number> = {
  careers: 48,              // 2 days — jobs change fast
  news: 24,                 // 1 day — news is time-sensitive
  worker_sentiment: 72,     // 3 days
  compensation: 168,        // 7 days
  leadership: 336,          // 14 days — changes rarely
  reputation: 168,          // 7 days
  recruiter_intelligence: 72, // 3 days
  ai_hiring: 168,           // 7 days
  ideology: 336,            // 14 days
  benefits: 168,            // 7 days
};

/** Provider fallback chain per section */
export const SECTION_PROVIDERS: Record<IntelligenceSection, ProviderName[]> = {
  careers: ['ats_api', 'firecrawl', 'scrapingbee'],
  news: ['government_api', 'firecrawl', 'scrapingbee'],
  leadership: ['firecrawl', 'scrapingbee'],
  reputation: ['firecrawl', 'scrapingbee'],
  worker_sentiment: ['firecrawl', 'scrapingbee'],
  compensation: ['government_api', 'firecrawl'],
  recruiter_intelligence: ['firecrawl', 'scrapingbee'],
  ai_hiring: ['firecrawl', 'scrapingbee'],
  ideology: ['government_api', 'firecrawl'],
  benefits: ['government_api', 'firecrawl'],
};

/** Human-readable section labels */
export const SECTION_LABELS: Record<IntelligenceSection, string> = {
  leadership: 'Leadership & Board',
  careers: 'Open Positions',
  news: 'News & Signals',
  reputation: 'Reputation & Reviews',
  recruiter_intelligence: 'Recruiter Intelligence',
  worker_sentiment: 'Worker Sentiment',
  compensation: 'Compensation Data',
  ai_hiring: 'AI in Hiring',
  ideology: 'Political & Ideology',
  benefits: 'Benefits & Perks',
};

/** Check if a section is stale based on its TTL */
export function isSectionStale(
  lastUpdated: string | null | undefined,
  section: IntelligenceSection
): boolean {
  if (!lastUpdated) return true;
  const ttlMs = SECTION_FRESHNESS[section] * 60 * 60 * 1000;
  return Date.now() - new Date(lastUpdated).getTime() > ttlMs;
}

/** Get human-readable freshness label */
export function getFreshnessLabel(lastUpdated: string | null | undefined): string {
  if (!lastUpdated) return 'No data available';
  const hoursAgo = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 3600000);
  if (hoursAgo < 1) return 'Updated just now';
  if (hoursAgo < 24) return `Updated ${hoursAgo}h ago`;
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo === 1) return 'Updated yesterday';
  return `Updated ${daysAgo} days ago`;
}
