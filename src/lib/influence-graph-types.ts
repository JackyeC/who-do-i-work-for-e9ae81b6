/** Influence Graph type definitions */

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  metadata?: Record<string, any>;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated?: string | null;
  sourceUrl?: string | null;
  amount?: number;
  // Force graph fields
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export type NodeType =
  | 'company'
  | 'parent_company'
  | 'pac'
  | 'lobbying_firm'
  | 'trade_association'
  | 'executive'
  | 'politician'
  | 'legislation'
  | 'issue'
  | 'statement'
  | 'lawsuit'
  | 'dark_money'
  | 'agency';

export interface GraphEdge {
  source: string;
  target: string;
  edgeType: EdgeType;
  label: string;
  amount?: number;
  date?: string;
  sourceName?: string;
  evidenceUrl?: string;
  confidence: 'high' | 'medium' | 'low';
  isContradiction: boolean;
  description?: string;
}

export type EdgeType =
  | 'owns'
  | 'donated_to'
  | 'lobbied_on'
  | 'represented_by'
  | 'member_of'
  | 'signed'
  | 'named_in'
  | 'contradicts'
  | 'appointed_to'
  | 'oversight_of'
  | 'funded_by';

export type FilterCategory =
  | 'money'
  | 'lobbying'
  | 'civil_rights'
  | 'labor'
  | 'climate'
  | 'immigration'
  | 'healthcare'
  | 'guns'
  | 'consumer_protection';

export const NODE_COLORS: Record<NodeType, string> = {
  company: '#7c3aed',       // primary violet
  parent_company: '#6d28d9',
  pac: '#dc2626',           // red
  lobbying_firm: '#ea580c',  // orange
  trade_association: '#d97706', // amber
  executive: '#2563eb',     // blue
  politician: '#0891b2',    // cyan
  legislation: '#059669',   // emerald
  issue: '#4f46e5',         // indigo
  statement: '#16a34a',     // green
  lawsuit: '#e11d48',       // rose
  dark_money: '#78716c',    // stone
  agency: '#0d9488',        // teal
};

export const NODE_LABELS: Record<NodeType, string> = {
  company: 'Company',
  parent_company: 'Parent Company',
  pac: 'PAC',
  lobbying_firm: 'Lobbying Firm',
  trade_association: 'Trade Association',
  executive: 'Executive',
  politician: 'Politician',
  legislation: 'Legislation',
  issue: 'Issue Area',
  statement: 'Public Statement',
  lawsuit: 'Lawsuit',
  dark_money: 'Dark Money',
  agency: 'Agency',
};

export const EDGE_LABELS: Record<EdgeType, string> = {
  owns: 'owns',
  donated_to: 'donated to',
  lobbied_on: 'lobbied on',
  represented_by: 'represented by',
  member_of: 'member of',
  signed: 'signed',
  named_in: 'named in',
  contradicts: 'contradicts',
  appointed_to: 'appointed to',
  oversight_of: 'oversight of',
  funded_by: 'funded by',
};

export const FILTER_LABELS: Record<FilterCategory, string> = {
  money: 'Political Spending',
  lobbying: 'Lobbying',
  civil_rights: 'Civil Rights',
  labor: 'Labor Rights',
  climate: 'Climate',
  immigration: 'Immigration',
  healthcare: 'Healthcare',
  guns: 'Guns',
  consumer_protection: 'Consumer Protection',
};
