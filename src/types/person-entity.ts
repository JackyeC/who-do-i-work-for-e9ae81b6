export interface Person {
  id: string;
  full_name: string;
  slug: string;
  current_title: string | null;
  current_company: string | null;
  bio_summary: string | null;
  image_url: string | null;
  location: string | null;
  prior_roles: Record<string, unknown>[];
  board_roles: Record<string, unknown>[];
  advisory_roles: Record<string, unknown>[];
  political_donation_total: number;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

export interface PersonSource {
  id: string;
  person_id: string;
  claim_key: string;
  claim_text: string | null;
  source_url: string | null;
  source_type: string | null;
  confidence_label: ConfidenceLabelKey;
  collected_at: string;
}

export type ConfidenceLabelKey =
  | 'verified'
  | 'multi_source'
  | 'inferred'
  | 'no_evidence';

export const CONFIDENCE_LABEL_DISPLAY: Record<ConfidenceLabelKey, string> = {
  verified: 'Direct Source',
  multi_source: 'Multi-Source Signal',
  inferred: 'Inferred Signal',
  no_evidence: 'No Public Evidence',
};

export interface EntityMention {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  context_type: string | null;
  context_id: string | null;
  snippet: string | null;
  created_at: string;
}
