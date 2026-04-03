// ReportSchema.ts - The "Source of Truth" for WDIWF Reports

export interface PoliticalContribution {
  recipient: string;
  amount: number;
  date: string;
  source_url: string;
}

export interface DonorProfile {
  name: string; // Use the 'Canonical Name' (e.g., Steven Kessel)
  aliases: string[]; // ['Steve Kessel', 'S. Kessel']
  total_donated: number;
  top_recipient: string;
  raw_fec_link: string;
}

export interface SpendingMetric {
  label: string; // e.g., "Lobbying"
  amount: string; // e.g., "$19.1M"
  trend: 'up' | 'down' | 'neutral';
  description: string;
  drill_down_url: string; // Link to OpenSecrets or LDA.gov
}

export interface EmployerReport {
  id: string; // e.g., "amazon"
  company_name: string;
  industry: string;
  headcount: string;
  integrity_score: number; // 0-100
  the_call: 'WATCH' | 'CRITICAL' | 'FAIR';

  // Mapping the UI Sections
  spending_record: SpendingMetric[];
  active_signals: {
    category: 'immigration' | 'climate' | 'voting_rights' | 'labor' | 'ai_bias';
    count: number;
    description: string;
    evidence_link: string;
  }[];

  political_donors: DonorProfile[];

  institutional_links: {
    org_name: string;
    connection_type: string; // e.g., "Board Affiliation" or "Donor"
    alignment: 'traditional' | 'progressive' | 'bipartisan';
    source: string;
  }[];
}
