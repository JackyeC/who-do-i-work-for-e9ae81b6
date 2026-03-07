export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          careers_url: string | null
          civic_footprint_score: number
          confidence_rating: string
          consumer_relevance: string | null
          corporate_pac_exists: boolean
          created_at: string
          description: string | null
          effective_tax_rate: string | null
          employee_count: string | null
          government_contracts: number | null
          id: string
          industry: string
          last_reviewed: string
          lobbying_spend: number | null
          name: string
          parent_company: string | null
          revenue: string | null
          slug: string
          state: string
          subsidies_received: number | null
          total_pac_spending: number
          updated_at: string
          worker_relevance: string | null
        }
        Insert: {
          careers_url?: string | null
          civic_footprint_score?: number
          confidence_rating?: string
          consumer_relevance?: string | null
          corporate_pac_exists?: boolean
          created_at?: string
          description?: string | null
          effective_tax_rate?: string | null
          employee_count?: string | null
          government_contracts?: number | null
          id?: string
          industry: string
          last_reviewed?: string
          lobbying_spend?: number | null
          name: string
          parent_company?: string | null
          revenue?: string | null
          slug: string
          state: string
          subsidies_received?: number | null
          total_pac_spending?: number
          updated_at?: string
          worker_relevance?: string | null
        }
        Update: {
          careers_url?: string | null
          civic_footprint_score?: number
          confidence_rating?: string
          consumer_relevance?: string | null
          corporate_pac_exists?: boolean
          created_at?: string
          description?: string | null
          effective_tax_rate?: string | null
          employee_count?: string | null
          government_contracts?: number | null
          id?: string
          industry?: string
          last_reviewed?: string
          lobbying_spend?: number | null
          name?: string
          parent_company?: string | null
          revenue?: string | null
          slug?: string
          state?: string
          subsidies_received?: number | null
          total_pac_spending?: number
          updated_at?: string
          worker_relevance?: string | null
        }
        Relationships: []
      }
      company_advisory_committees: {
        Row: {
          agency: string
          appointment_year: number | null
          committee_name: string
          company_id: string
          confidence: string
          created_at: string
          id: string
          person: string
          regulatory_relevance: string | null
          source: string | null
          title_at_company: string
        }
        Insert: {
          agency: string
          appointment_year?: number | null
          committee_name: string
          company_id: string
          confidence?: string
          created_at?: string
          id?: string
          person: string
          regulatory_relevance?: string | null
          source?: string | null
          title_at_company: string
        }
        Update: {
          agency?: string
          appointment_year?: number | null
          committee_name?: string
          company_id?: string
          confidence?: string
          created_at?: string
          id?: string
          person?: string
          regulatory_relevance?: string | null
          source?: string | null
          title_at_company?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_advisory_committees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_agency_contracts: {
        Row: {
          agency_acronym: string | null
          agency_name: string
          company_id: string
          confidence: string
          contract_description: string | null
          contract_id_external: string | null
          contract_value: number | null
          controversy_category: string | null
          controversy_description: string | null
          controversy_flag: boolean
          created_at: string
          fiscal_year: number | null
          id: string
          source: string | null
        }
        Insert: {
          agency_acronym?: string | null
          agency_name: string
          company_id: string
          confidence?: string
          contract_description?: string | null
          contract_id_external?: string | null
          contract_value?: number | null
          controversy_category?: string | null
          controversy_description?: string | null
          controversy_flag?: boolean
          created_at?: string
          fiscal_year?: number | null
          id?: string
          source?: string | null
        }
        Update: {
          agency_acronym?: string | null
          agency_name?: string
          company_id?: string
          confidence?: string
          contract_description?: string | null
          contract_id_external?: string | null
          contract_value?: number | null
          controversy_category?: string | null
          controversy_description?: string | null
          controversy_flag?: boolean
          created_at?: string
          fiscal_year?: number | null
          id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_agency_contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_benchmarks: {
        Row: {
          company_id: string
          cpa_zicklin_score: number | null
          id: string
          industry: string
          industry_rank: number | null
          industry_total: number | null
          is_industry_leader: boolean
          last_calculated: string
          peer_avg_civic_footprint: number | null
          peer_avg_lobbying: number | null
          peer_avg_pac_spending: number | null
          transparency_grade: string
        }
        Insert: {
          company_id: string
          cpa_zicklin_score?: number | null
          id?: string
          industry: string
          industry_rank?: number | null
          industry_total?: number | null
          is_industry_leader?: boolean
          last_calculated?: string
          peer_avg_civic_footprint?: number | null
          peer_avg_lobbying?: number | null
          peer_avg_pac_spending?: number | null
          transparency_grade?: string
        }
        Update: {
          company_id?: string
          cpa_zicklin_score?: number | null
          id?: string
          industry?: string
          industry_rank?: number | null
          industry_total?: number | null
          is_industry_leader?: boolean
          last_calculated?: string
          peer_avg_civic_footprint?: number | null
          peer_avg_lobbying?: number | null
          peer_avg_pac_spending?: number | null
          transparency_grade?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_benchmarks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_board_affiliations: {
        Row: {
          company_id: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_board_affiliations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_candidates: {
        Row: {
          amount: number
          company_id: string
          district: string | null
          donation_type: string
          flag_reason: string | null
          flagged: boolean
          id: string
          name: string
          party: string
          state: string
        }
        Insert: {
          amount?: number
          company_id: string
          district?: string | null
          donation_type?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          name: string
          party: string
          state: string
        }
        Update: {
          amount?: number
          company_id?: string
          district?: string | null
          donation_type?: string
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          name?: string
          party?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_candidates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_dark_money: {
        Row: {
          company_id: string
          confidence: string
          description: string | null
          estimated_amount: number | null
          id: string
          name: string
          org_type: string
          relationship: string
          source: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          description?: string | null
          estimated_amount?: number | null
          id?: string
          name: string
          org_type: string
          relationship: string
          source?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          description?: string | null
          estimated_amount?: number | null
          id?: string
          name?: string
          org_type?: string
          relationship?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_dark_money_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_executives: {
        Row: {
          company_id: string
          id: string
          name: string
          title: string
          total_donations: number
        }
        Insert: {
          company_id: string
          id?: string
          name: string
          title: string
          total_donations?: number
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
          title?: string
          total_donations?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_executives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_flagged_orgs: {
        Row: {
          company_id: string
          confidence: string
          description: string | null
          id: string
          org_name: string
          relationship: string
          source: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          description?: string | null
          id?: string
          org_name: string
          relationship: string
          source?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          description?: string | null
          id?: string
          org_name?: string
          relationship?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_flagged_orgs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_foundation_grants: {
        Row: {
          amount: number
          company_id: string
          confidence: string
          created_at: string
          foundation_name: string
          id: string
          political_relevance: string | null
          recipient_district: string | null
          recipient_org: string
          relevant_committee: string | null
          source: string | null
          year: number
        }
        Insert: {
          amount?: number
          company_id: string
          confidence?: string
          created_at?: string
          foundation_name: string
          id?: string
          political_relevance?: string | null
          recipient_district?: string | null
          recipient_org: string
          relevant_committee?: string | null
          source?: string | null
          year: number
        }
        Update: {
          amount?: number
          company_id?: string
          confidence?: string
          created_at?: string
          foundation_name?: string
          id?: string
          political_relevance?: string | null
          recipient_district?: string | null
          recipient_org?: string
          relevant_committee?: string | null
          source?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_foundation_grants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_hypocrisy_index: {
        Row: {
          aligned_stances: number
          chi_grade: string
          chi_score: number
          company_id: string
          direct_conflicts: number
          id: string
          indirect_conflicts: number
          last_calculated: string
          total_stances: number
        }
        Insert: {
          aligned_stances?: number
          chi_grade?: string
          chi_score?: number
          company_id: string
          direct_conflicts?: number
          id?: string
          indirect_conflicts?: number
          last_calculated?: string
          total_stances?: number
        }
        Update: {
          aligned_stances?: number
          chi_grade?: string
          chi_score?: number
          company_id?: string
          direct_conflicts?: number
          id?: string
          indirect_conflicts?: number
          last_calculated?: string
          total_stances?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_hypocrisy_index_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_ideology_flags: {
        Row: {
          amount: number | null
          category: string
          company_id: string
          confidence: string
          created_at: string
          description: string | null
          detected_by: string
          evidence_url: string | null
          id: string
          org_name: string
          relationship_type: string
          scan_date: string
          severity: string
          watchlist_org_id: string | null
        }
        Insert: {
          amount?: number | null
          category: string
          company_id: string
          confidence?: string
          created_at?: string
          description?: string | null
          detected_by?: string
          evidence_url?: string | null
          id?: string
          org_name: string
          relationship_type: string
          scan_date?: string
          severity?: string
          watchlist_org_id?: string | null
        }
        Update: {
          amount?: number | null
          category?: string
          company_id?: string
          confidence?: string
          created_at?: string
          description?: string | null
          detected_by?: string
          evidence_url?: string | null
          id?: string
          org_name?: string
          relationship_type?: string
          scan_date?: string
          severity?: string
          watchlist_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ideology_flags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_ideology_flags_watchlist_org_id_fkey"
            columns: ["watchlist_org_id"]
            isOneToOne: false
            referencedRelation: "ideology_watchlist"
            referencedColumns: ["id"]
          },
        ]
      }
      company_influence_roi: {
        Row: {
          company_id: string
          id: string
          last_calculated: string
          policy_win_rate: number | null
          roi_grade: string
          roi_ratio: number | null
          total_government_benefits: number
          total_political_spending: number
        }
        Insert: {
          company_id: string
          id?: string
          last_calculated?: string
          policy_win_rate?: number | null
          roi_grade?: string
          roi_ratio?: number | null
          total_government_benefits?: number
          total_political_spending?: number
        }
        Update: {
          company_id?: string
          id?: string
          last_calculated?: string
          policy_win_rate?: number | null
          roi_grade?: string
          roi_ratio?: number | null
          total_government_benefits?: number
          total_political_spending?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_influence_roi_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_international_influence: {
        Row: {
          amount: number | null
          company_id: string
          confidence: string
          country: string
          created_at: string
          description: string | null
          entity_name: string | null
          id: string
          influence_type: string
          registry_source: string | null
        }
        Insert: {
          amount?: number | null
          company_id: string
          confidence?: string
          country: string
          created_at?: string
          description?: string | null
          entity_name?: string | null
          id?: string
          influence_type: string
          registry_source?: string | null
        }
        Update: {
          amount?: number | null
          company_id?: string
          confidence?: string
          country?: string
          created_at?: string
          description?: string | null
          entity_name?: string | null
          id?: string
          influence_type?: string
          registry_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_international_influence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_party_breakdown: {
        Row: {
          amount: number
          color: string
          company_id: string
          id: string
          party: string
        }
        Insert: {
          amount?: number
          color?: string
          company_id: string
          id?: string
          party: string
        }
        Update: {
          amount?: number
          color?: string
          company_id?: string
          id?: string
          party?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_party_breakdown_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_political_risk: {
        Row: {
          company_id: string
          dark_money_percentage: number
          flagged_org_count: number
          id: string
          last_calculated: string
          revolving_door_count: number
          risk_grade: string
          risk_score: number
          stakeholder_disconnect_score: number
        }
        Insert: {
          company_id: string
          dark_money_percentage?: number
          flagged_org_count?: number
          id?: string
          last_calculated?: string
          revolving_door_count?: number
          risk_grade?: string
          risk_score?: number
          stakeholder_disconnect_score?: number
        }
        Update: {
          company_id?: string
          dark_money_percentage?: number
          flagged_org_count?: number
          id?: string
          last_calculated?: string
          revolving_door_count?: number
          risk_grade?: string
          risk_score?: number
          stakeholder_disconnect_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_political_risk_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_public_stances: {
        Row: {
          company_id: string
          gap: string
          id: string
          public_position: string
          spending_reality: string
          topic: string
        }
        Insert: {
          company_id: string
          gap?: string
          id?: string
          public_position: string
          spending_reality: string
          topic: string
        }
        Update: {
          company_id?: string
          gap?: string
          id?: string
          public_position?: string
          spending_reality?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_public_stances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_revolving_door: {
        Row: {
          company_id: string
          confidence: string
          id: string
          new_role: string
          person: string
          prior_role: string
          relevance: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          id?: string
          new_role: string
          person: string
          prior_role: string
          relevance?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          id?: string
          new_role?: string
          person?: string
          prior_role?: string
          relevance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_revolving_door_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_spending_history: {
        Row: {
          company_id: string
          cycle: string
          executive_giving: number
          id: string
          lobbying_spend: number
          pac_spending: number
        }
        Insert: {
          company_id: string
          cycle: string
          executive_giving?: number
          id?: string
          lobbying_spend?: number
          pac_spending?: number
        }
        Update: {
          company_id?: string
          cycle?: string
          executive_giving?: number
          id?: string
          lobbying_spend?: number
          pac_spending?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_spending_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_state_lobbying: {
        Row: {
          company_id: string
          created_at: string
          id: string
          issues: string[] | null
          lobbying_spend: number
          lobbyist_count: number | null
          source: string | null
          state: string
          state_contracts_value: number | null
          year: number
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          issues?: string[] | null
          lobbying_spend?: number
          lobbyist_count?: number | null
          source?: string | null
          state: string
          state_contracts_value?: number | null
          year: number
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          issues?: string[] | null
          lobbying_spend?: number
          lobbyist_count?: number | null
          source?: string | null
          state?: string
          state_contracts_value?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_state_lobbying_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_super_pacs: {
        Row: {
          amount: number
          company_id: string
          confidence: string
          description: string | null
          id: string
          name: string
          pac_type: string
          relationship: string
        }
        Insert: {
          amount?: number
          company_id: string
          confidence?: string
          description?: string | null
          id?: string
          name: string
          pac_type: string
          relationship: string
        }
        Update: {
          amount?: number
          company_id?: string
          confidence?: string
          description?: string | null
          id?: string
          name?: string
          pac_type?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_super_pacs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_supply_chain_flags: {
        Row: {
          company_id: string
          confidence: string
          country: string
          created_at: string
          description: string | null
          entity_name: string | null
          flag_type: string
          id: string
          severity: string
          source: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          country: string
          created_at?: string
          description?: string | null
          entity_name?: string | null
          flag_type: string
          id?: string
          severity?: string
          source?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          country?: string
          created_at?: string
          description?: string | null
          entity_name?: string | null
          flag_type?: string
          id?: string
          severity?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_supply_chain_flags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_trade_associations: {
        Row: {
          company_id: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_trade_associations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_worker_sentiment: {
        Row: {
          ai_summary: string | null
          career_opportunities: number | null
          ceo_approval: number | null
          company_id: string
          compensation_rating: number | null
          created_at: string
          culture_rating: number | null
          hypocrisy_flags: Json | null
          id: string
          overall_rating: number | null
          raw_results: Json | null
          recommend_to_friend: number | null
          scan_type: string
          sentiment: string | null
          sources: Json | null
          top_complaints: Json | null
          top_praises: Json | null
          work_life_balance: number | null
        }
        Insert: {
          ai_summary?: string | null
          career_opportunities?: number | null
          ceo_approval?: number | null
          company_id: string
          compensation_rating?: number | null
          created_at?: string
          culture_rating?: number | null
          hypocrisy_flags?: Json | null
          id?: string
          overall_rating?: number | null
          raw_results?: Json | null
          recommend_to_friend?: number | null
          scan_type?: string
          sentiment?: string | null
          sources?: Json | null
          top_complaints?: Json | null
          top_praises?: Json | null
          work_life_balance?: number | null
        }
        Update: {
          ai_summary?: string | null
          career_opportunities?: number | null
          ceo_approval?: number | null
          company_id?: string
          compensation_rating?: number | null
          created_at?: string
          culture_rating?: number | null
          hypocrisy_flags?: Json | null
          id?: string
          overall_rating?: number | null
          raw_results?: Json | null
          recommend_to_friend?: number | null
          scan_type?: string
          sentiment?: string | null
          sources?: Json | null
          top_complaints?: Json | null
          top_praises?: Json | null
          work_life_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_worker_sentiment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_linkages: {
        Row: {
          amount: number | null
          company_id: string
          confidence_score: number
          created_at: string
          description: string | null
          id: string
          link_type: Database["public"]["Enums"]["link_type"]
          metadata: Json | null
          source_citation: Json | null
          source_entity_id: string | null
          source_entity_name: string
          source_entity_type: string
          target_entity_id: string | null
          target_entity_name: string
          target_entity_type: string
        }
        Insert: {
          amount?: number | null
          company_id: string
          confidence_score?: number
          created_at?: string
          description?: string | null
          id?: string
          link_type: Database["public"]["Enums"]["link_type"]
          metadata?: Json | null
          source_citation?: Json | null
          source_entity_id?: string | null
          source_entity_name: string
          source_entity_type: string
          target_entity_id?: string | null
          target_entity_name: string
          target_entity_type: string
        }
        Update: {
          amount?: number | null
          company_id?: string
          confidence_score?: number
          created_at?: string
          description?: string | null
          id?: string
          link_type?: Database["public"]["Enums"]["link_type"]
          metadata?: Json | null
          source_citation?: Json | null
          source_entity_id?: string | null
          source_entity_name?: string
          source_entity_type?: string
          target_entity_id?: string | null
          target_entity_name?: string
          target_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_linkages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_recipients: {
        Row: {
          amount: number
          executive_id: string
          id: string
          name: string
          party: string
        }
        Insert: {
          amount?: number
          executive_id: string
          id?: string
          name: string
          party: string
        }
        Update: {
          amount?: number
          executive_id?: string
          id?: string
          name?: string
          party?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_recipients_executive_id_fkey"
            columns: ["executive_id"]
            isOneToOne: false
            referencedRelation: "company_executives"
            referencedColumns: ["id"]
          },
        ]
      }
      ideology_watchlist: {
        Row: {
          adl_designated: boolean
          aliases: string[] | null
          category: string
          created_at: string
          description: string | null
          id: string
          org_name: string
          severity: string
          splc_designated: boolean
          subcategory: string | null
          tracking_source: string | null
          website: string | null
        }
        Insert: {
          adl_designated?: boolean
          aliases?: string[] | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          org_name: string
          severity?: string
          splc_designated?: boolean
          subcategory?: string | null
          tracking_source?: string | null
          website?: string | null
        }
        Update: {
          adl_designated?: boolean
          aliases?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          org_name?: string
          severity?: string
          splc_designated?: boolean
          subcategory?: string | null
          tracking_source?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          employer_company_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          employer_company_id?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          employer_company_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employer_company_id_fkey"
            columns: ["employer_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_alerts: {
        Row: {
          alert_type: string
          company_id: string
          created_at: string
          data: Json | null
          description: string | null
          id: string
          is_read: boolean
          scan_type: string
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          company_id: string
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          is_read?: boolean
          scan_type: string
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          company_id?: string
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          is_read?: boolean
          scan_type?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_schedules: {
        Row: {
          alert_count: number
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          last_scan_at: string | null
          last_scan_status: string | null
          next_scan_at: string | null
          scan_frequency_hours: number
          scan_type: string
        }
        Insert: {
          alert_count?: number
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scan_at?: string | null
          last_scan_status?: string | null
          next_scan_at?: string | null
          scan_frequency_hours?: number
          scan_type: string
        }
        Update: {
          alert_count?: number
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_scan_at?: string | null
          last_scan_status?: string | null
          next_scan_at?: string | null
          scan_frequency_hours?: number
          scan_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_scans: {
        Row: {
          ai_summary: string | null
          company_id: string
          contradictions: Json | null
          created_at: string
          id: string
          personnel_changes: Json | null
          query_used: string
          results: Json
          scan_type: string
          sentiment: string | null
          sources: Json | null
          stance_shifts: Json | null
        }
        Insert: {
          ai_summary?: string | null
          company_id: string
          contradictions?: Json | null
          created_at?: string
          id?: string
          personnel_changes?: Json | null
          query_used: string
          results?: Json
          scan_type?: string
          sentiment?: string | null
          sources?: Json | null
          stance_shifts?: Json | null
        }
        Update: {
          ai_summary?: string | null
          company_id?: string
          contradictions?: Json | null
          created_at?: string
          id?: string
          personnel_changes?: Json | null
          query_used?: string
          results?: Json
          scan_type?: string
          sentiment?: string | null
          sources?: Json | null
          stance_shifts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_scans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_company_roi_pipeline: { Args: { _company_id: string }; Returns: Json }
      trace_influence_chain: {
        Args: { _company_id: string; _max_depth?: number }
        Returns: {
          amount: number
          chain_id: number
          confidence: number
          description: string
          link_type: string
          source_name: string
          source_type: string
          step: number
          target_name: string
          target_type: string
        }[]
      }
    }
    Enums: {
      link_type:
        | "donation_to_member"
        | "member_on_committee"
        | "committee_oversight_of_contract"
        | "lobbying_on_bill"
        | "revolving_door"
        | "foundation_grant_to_district"
        | "trade_association_lobbying"
        | "dark_money_channel"
        | "advisory_committee_appointment"
        | "interlocking_directorate"
        | "state_lobbying_contract"
        | "international_influence"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      link_type: [
        "donation_to_member",
        "member_on_committee",
        "committee_oversight_of_contract",
        "lobbying_on_bill",
        "revolving_door",
        "foundation_grant_to_district",
        "trade_association_lobbying",
        "dark_money_channel",
        "advisory_committee_appointment",
        "interlocking_directorate",
        "state_lobbying_contract",
        "international_influence",
      ],
    },
  },
} as const
