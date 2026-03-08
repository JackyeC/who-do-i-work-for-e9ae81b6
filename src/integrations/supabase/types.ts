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
      ai_hiring_signals: {
        Row: {
          bias_audit_link: string | null
          bias_audit_status: string | null
          category: string
          company_id: string
          confidence_score: number
          created_at: string
          evidence_text: string | null
          evidence_url: string | null
          id: string
          last_scanned: string
          safepath_flags: Json | null
          signal_type: string
          status: string
          transparency_score: number | null
          vendor_name: string | null
        }
        Insert: {
          bias_audit_link?: string | null
          bias_audit_status?: string | null
          category: string
          company_id: string
          confidence_score?: number
          created_at?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          last_scanned?: string
          safepath_flags?: Json | null
          signal_type?: string
          status?: string
          transparency_score?: number | null
          vendor_name?: string | null
        }
        Update: {
          bias_audit_link?: string | null
          bias_audit_status?: string | null
          category?: string
          company_id?: string
          confidence_score?: number
          created_at?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          last_scanned?: string
          safepath_flags?: Json | null
          signal_type?: string
          status?: string
          transparency_score?: number | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_hiring_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_hr_signals: {
        Row: {
          company_id: string
          confidence: string
          created_at: string
          date_detected: string
          detection_method: string
          evidence_text: string | null
          id: string
          last_verified: string | null
          signal_category: string
          signal_type: string
          source_type: string | null
          source_url: string | null
          status: string
          tool_name: string | null
          vendor_name: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          created_at?: string
          date_detected?: string
          detection_method?: string
          evidence_text?: string | null
          id?: string
          last_verified?: string | null
          signal_category: string
          signal_type: string
          source_type?: string | null
          source_url?: string | null
          status?: string
          tool_name?: string | null
          vendor_name?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          created_at?: string
          date_detected?: string
          detection_method?: string
          evidence_text?: string | null
          id?: string
          last_verified?: string | null
          signal_category?: string
          signal_type?: string
          source_type?: string | null
          source_url?: string | null
          status?: string
          tool_name?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_hr_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      applications_tracker: {
        Row: {
          alignment_score: number | null
          application_link: string | null
          applied_at: string | null
          company_id: string
          company_name: string
          created_at: string | null
          id: string
          job_id: string | null
          job_title: string
          matched_signals: Json | null
          notes: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alignment_score?: number | null
          application_link?: string | null
          applied_at?: string | null
          company_id: string
          company_name: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          job_title: string
          matched_signals?: Json | null
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alignment_score?: number | null
          application_link?: string | null
          applied_at?: string | null
          company_id?: string
          company_name?: string
          created_at?: string | null
          id?: string
          job_id?: string | null
          job_title?: string
          matched_signals?: Json | null
          notes?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_tracker_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_tracker_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "company_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      apply_queue: {
        Row: {
          alignment_score: number
          application_url: string | null
          company_id: string
          company_name: string
          created_at: string
          error_message: string | null
          generated_payload: Json | null
          id: string
          job_id: string | null
          job_title: string
          matched_signals: Json
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alignment_score?: number
          application_url?: string | null
          company_id: string
          company_name: string
          created_at?: string
          error_message?: string | null
          generated_payload?: Json | null
          id?: string
          job_id?: string | null
          job_title: string
          matched_signals?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alignment_score?: number
          application_url?: string | null
          company_id?: string
          company_name?: string
          created_at?: string
          error_message?: string | null
          generated_payload?: Json | null
          id?: string
          job_id?: string | null
          job_title?: string
          matched_signals?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apply_queue_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "company_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_apply_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          is_paused: boolean
          max_daily_applications: number
          min_alignment_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_paused?: boolean
          max_daily_applications?: number
          min_alignment_threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          is_paused?: boolean
          max_daily_applications?: number
          min_alignment_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      browse_ai_change_events: {
        Row: {
          change_summary: string | null
          company_id: string
          created_at: string
          id: string
          monitor_id: string
          page_type: string
          processing_status: string
          raw_payload: Json | null
          signal_modules_triggered: string[] | null
        }
        Insert: {
          change_summary?: string | null
          company_id: string
          created_at?: string
          id?: string
          monitor_id: string
          page_type: string
          processing_status?: string
          raw_payload?: Json | null
          signal_modules_triggered?: string[] | null
        }
        Update: {
          change_summary?: string | null
          company_id?: string
          created_at?: string
          id?: string
          monitor_id?: string
          page_type?: string
          processing_status?: string
          raw_payload?: Json | null
          signal_modules_triggered?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "browse_ai_change_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "browse_ai_change_events_monitor_id_fkey"
            columns: ["monitor_id"]
            isOneToOne: false
            referencedRelation: "browse_ai_monitors"
            referencedColumns: ["id"]
          },
        ]
      }
      browse_ai_monitors: {
        Row: {
          browse_ai_robot_id: string | null
          browse_ai_task_id: string | null
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          last_change_detected_at: string | null
          last_checked_at: string | null
          page_type: string
          page_url: string
          status: string
          updated_at: string
        }
        Insert: {
          browse_ai_robot_id?: string | null
          browse_ai_task_id?: string | null
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_change_detected_at?: string | null
          last_checked_at?: string | null
          page_type: string
          page_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          browse_ai_robot_id?: string | null
          browse_ai_task_id?: string | null
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_change_detected_at?: string | null
          last_checked_at?: string | null
          page_type?: string
          page_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "browse_ai_monitors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          careers_url: string | null
          civic_footprint_score: number
          confidence_rating: string
          consumer_relevance: string | null
          corporate_pac_exists: boolean
          created_at: string
          creation_source: string | null
          description: string | null
          effective_tax_rate: string | null
          employee_count: string | null
          government_contracts: number | null
          id: string
          identity_matched: boolean | null
          industry: string
          last_reviewed: string
          last_scan_attempted: string | null
          lobbying_spend: number | null
          logo_url: string | null
          name: string
          parent_company: string | null
          record_status: string
          revenue: string | null
          scan_completion: Json | null
          search_query: string | null
          slug: string
          state: string
          subsidies_received: number | null
          total_pac_spending: number
          updated_at: string
          verification_notes: string | null
          website_url: string | null
          worker_relevance: string | null
        }
        Insert: {
          careers_url?: string | null
          civic_footprint_score?: number
          confidence_rating?: string
          consumer_relevance?: string | null
          corporate_pac_exists?: boolean
          created_at?: string
          creation_source?: string | null
          description?: string | null
          effective_tax_rate?: string | null
          employee_count?: string | null
          government_contracts?: number | null
          id?: string
          identity_matched?: boolean | null
          industry: string
          last_reviewed?: string
          last_scan_attempted?: string | null
          lobbying_spend?: number | null
          logo_url?: string | null
          name: string
          parent_company?: string | null
          record_status?: string
          revenue?: string | null
          scan_completion?: Json | null
          search_query?: string | null
          slug: string
          state: string
          subsidies_received?: number | null
          total_pac_spending?: number
          updated_at?: string
          verification_notes?: string | null
          website_url?: string | null
          worker_relevance?: string | null
        }
        Update: {
          careers_url?: string | null
          civic_footprint_score?: number
          confidence_rating?: string
          consumer_relevance?: string | null
          corporate_pac_exists?: boolean
          created_at?: string
          creation_source?: string | null
          description?: string | null
          effective_tax_rate?: string | null
          employee_count?: string | null
          government_contracts?: number | null
          id?: string
          identity_matched?: boolean | null
          industry?: string
          last_reviewed?: string
          last_scan_attempted?: string | null
          lobbying_spend?: number | null
          logo_url?: string | null
          name?: string
          parent_company?: string | null
          record_status?: string
          revenue?: string | null
          scan_completion?: Json | null
          search_query?: string | null
          slug?: string
          state?: string
          subsidies_received?: number | null
          total_pac_spending?: number
          updated_at?: string
          verification_notes?: string | null
          website_url?: string | null
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
      company_corporate_structure: {
        Row: {
          company_id: string
          confidence: string
          created_at: string
          detected_at: string
          entity_name: string
          entity_type: string
          evidence_text: string | null
          id: string
          jurisdiction: string | null
          last_verified_at: string | null
          officer_name: string | null
          officer_role: string | null
          parent_entity_name: string | null
          registration_date: string | null
          registration_number: string | null
          source_name: string
          source_url: string | null
          status: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          created_at?: string
          detected_at?: string
          entity_name: string
          entity_type?: string
          evidence_text?: string | null
          id?: string
          jurisdiction?: string | null
          last_verified_at?: string | null
          officer_name?: string | null
          officer_role?: string | null
          parent_entity_name?: string | null
          registration_date?: string | null
          registration_number?: string | null
          source_name?: string
          source_url?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          created_at?: string
          detected_at?: string
          entity_name?: string
          entity_type?: string
          evidence_text?: string | null
          id?: string
          jurisdiction?: string | null
          last_verified_at?: string | null
          officer_name?: string | null
          officer_role?: string | null
          parent_entity_name?: string | null
          registration_date?: string | null
          registration_number?: string | null
          source_name?: string
          source_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_corporate_structure_company_id_fkey"
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
          photo_url: string | null
          title: string
          total_donations: number
        }
        Insert: {
          company_id: string
          id?: string
          name: string
          photo_url?: string | null
          title: string
          total_donations?: number
        }
        Update: {
          company_id?: string
          id?: string
          name?: string
          photo_url?: string | null
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
      company_jobs: {
        Row: {
          company_id: string
          created_at: string
          department: string | null
          description: string | null
          employment_type: string | null
          extracted_skills: Json | null
          id: string
          is_active: boolean
          last_verified_at: string | null
          location: string | null
          posted_at: string | null
          salary_range: string | null
          scraped_at: string
          seniority_level: string | null
          source_platform: string
          source_type: string
          source_url: string | null
          title: string
          url: string | null
          work_mode: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string | null
          extracted_skills?: Json | null
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          location?: string | null
          posted_at?: string | null
          salary_range?: string | null
          scraped_at?: string
          seniority_level?: string | null
          source_platform?: string
          source_type?: string
          source_url?: string | null
          title: string
          url?: string | null
          work_mode?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string | null
          employment_type?: string | null
          extracted_skills?: Json | null
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          location?: string | null
          posted_at?: string | null
          salary_range?: string | null
          scraped_at?: string
          seniority_level?: string | null
          source_platform?: string
          source_type?: string
          source_url?: string | null
          title?: string
          url?: string | null
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_jobs_company_id_fkey"
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
      company_signal_scans: {
        Row: {
          company_id: string
          confidence_level: string
          created_at: string
          id: string
          raw_excerpt: string | null
          scan_timestamp: string
          signal_category: string
          signal_type: string
          signal_value: string | null
          source_url: string | null
        }
        Insert: {
          company_id: string
          confidence_level?: string
          created_at?: string
          id?: string
          raw_excerpt?: string | null
          scan_timestamp?: string
          signal_category: string
          signal_type: string
          signal_value?: string | null
          source_url?: string | null
        }
        Update: {
          company_id?: string
          confidence_level?: string
          created_at?: string
          id?: string
          raw_excerpt?: string | null
          scan_timestamp?: string
          signal_category?: string
          signal_type?: string
          signal_value?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_signal_scans_company_id_fkey"
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
      company_state_contributions: {
        Row: {
          amount: number
          company_id: string
          confidence: string
          created_at: string
          detected_at: string
          election_year: number | null
          id: string
          party: string | null
          recipient_name: string
          recipient_type: string | null
          source_name: string
          source_url: string | null
          state: string
        }
        Insert: {
          amount?: number
          company_id: string
          confidence?: string
          created_at?: string
          detected_at?: string
          election_year?: number | null
          id?: string
          party?: string | null
          recipient_name: string
          recipient_type?: string | null
          source_name?: string
          source_url?: string | null
          state: string
        }
        Update: {
          amount?: number
          company_id?: string
          confidence?: string
          created_at?: string
          detected_at?: string
          election_year?: number | null
          id?: string
          party?: string | null
          recipient_name?: string
          recipient_type?: string | null
          source_name?: string
          source_url?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_state_contributions_company_id_fkey"
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
      company_values_signals: {
        Row: {
          company_id: string
          confidence: string
          created_at: string
          detected_by: string
          evidence_text: string | null
          evidence_url: string | null
          id: string
          scan_date: string
          severity: string
          signal_summary: string | null
          signal_type: string
          value_category: string
        }
        Insert: {
          company_id: string
          confidence?: string
          created_at?: string
          detected_by?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          scan_date?: string
          severity?: string
          signal_summary?: string | null
          signal_type: string
          value_category: string
        }
        Update: {
          company_id?: string
          confidence?: string
          created_at?: string
          detected_by?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          scan_date?: string
          severity?: string
          signal_summary?: string | null
          signal_type?: string
          value_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_values_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_warn_notices: {
        Row: {
          company_id: string
          confidence: string
          created_at: string
          effective_date: string | null
          employees_affected: number
          id: string
          layoff_type: string
          location_city: string | null
          location_state: string | null
          notice_date: string
          reason: string | null
          source_state: string | null
          source_url: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          created_at?: string
          effective_date?: string | null
          employees_affected?: number
          id?: string
          layoff_type?: string
          location_city?: string | null
          location_state?: string | null
          notice_date: string
          reason?: string | null
          source_state?: string | null
          source_url?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          created_at?: string
          effective_date?: string | null
          employees_affected?: number
          id?: string
          layoff_type?: string
          location_city?: string | null
          location_state?: string | null
          notice_date?: string
          reason?: string | null
          source_state?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_warn_notices_company_id_fkey"
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
      correction_requests: {
        Row: {
          company_name: string
          company_profile_url: string | null
          contact_email: string
          contact_name: string
          created_at: string
          description: string
          id: string
          issue_type: string
          review_status: string
          reviewer_notes: string | null
          source_links: string[] | null
          updated_at: string
        }
        Insert: {
          company_name: string
          company_profile_url?: string | null
          contact_email: string
          contact_name: string
          created_at?: string
          description: string
          id?: string
          issue_type?: string
          review_status?: string
          reviewer_notes?: string | null
          source_links?: string[] | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          company_profile_url?: string | null
          contact_email?: string
          contact_name?: string
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          review_status?: string
          reviewer_notes?: string | null
          source_links?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_growth_tracker: {
        Row: {
          completed_skills: string[] | null
          created_at: string
          gap_analysis: Json | null
          id: string
          missing_skills: string[] | null
          notes: string | null
          skills_match_pct: number | null
          status: string
          target_company_id: string | null
          target_role: string
          updated_at: string
          user_id: string
          values_alignment_score: number | null
        }
        Insert: {
          completed_skills?: string[] | null
          created_at?: string
          gap_analysis?: Json | null
          id?: string
          missing_skills?: string[] | null
          notes?: string | null
          skills_match_pct?: number | null
          status?: string
          target_company_id?: string | null
          target_role: string
          updated_at?: string
          user_id: string
          values_alignment_score?: number | null
        }
        Update: {
          completed_skills?: string[] | null
          created_at?: string
          gap_analysis?: Json | null
          id?: string
          missing_skills?: string[] | null
          notes?: string | null
          skills_match_pct?: number | null
          status?: string
          target_company_id?: string | null
          target_role?: string
          updated_at?: string
          user_id?: string
          values_alignment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_growth_tracker_target_company_id_fkey"
            columns: ["target_company_id"]
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
          matched_entity_name: string | null
          matched_entity_type: string | null
          metadata: Json | null
          original_source_query: string | null
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
          matched_entity_name?: string | null
          matched_entity_type?: string | null
          metadata?: Json | null
          original_source_query?: string | null
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
          matched_entity_name?: string | null
          matched_entity_type?: string | null
          metadata?: Json | null
          original_source_query?: string | null
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
      entity_relationships: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          notes: string | null
          primary_entity_id: string
          related_entity_name: string
          relationship_type: string
          source_url: string | null
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          id?: string
          notes?: string | null
          primary_entity_id: string
          related_entity_name: string
          relationship_type?: string
          source_url?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          notes?: string | null
          primary_entity_id?: string
          related_entity_name?: string
          relationship_type?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_relationships_primary_entity_id_fkey"
            columns: ["primary_entity_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_recipients: {
        Row: {
          amount: number
          committee_name: string | null
          district: string | null
          executive_id: string
          id: string
          name: string
          party: string
          state: string | null
        }
        Insert: {
          amount?: number
          committee_name?: string | null
          district?: string | null
          executive_id: string
          id?: string
          name: string
          party: string
          state?: string | null
        }
        Update: {
          amount?: number
          committee_name?: string | null
          district?: string | null
          executive_id?: string
          id?: string
          name?: string
          party?: string
          state?: string | null
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
      job_alerts: {
        Row: {
          alert_type: string
          company_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          job_id: string | null
          match_details: Json | null
          match_score: number | null
          user_id: string
        }
        Insert: {
          alert_type?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          match_details?: Json | null
          match_score?: number | null
          user_id: string
        }
        Update: {
          alert_type?: string
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          match_details?: Json | null
          match_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_alerts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "company_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_match_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          min_score: number | null
          signal_key: string
          signal_label: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          min_score?: number | null
          signal_key: string
          signal_label: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          min_score?: number | null
          signal_key?: string
          signal_label?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_checks: {
        Row: {
          company_id: string
          created_at: string
          generated_at: string
          id: string
          is_saved: boolean
          report_data: Json
          sections_included: string[]
          share_metadata: Json | null
          signals_count: number
          stale_sections_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          generated_at?: string
          id?: string
          is_saved?: boolean
          report_data?: Json
          sections_included?: string[]
          share_metadata?: Json | null
          signals_count?: number
          stale_sections_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          is_saved?: boolean
          report_data?: Json
          sections_included?: string[]
          share_metadata?: Json | null
          signals_count?: number
          stale_sections_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_letter_reviews: {
        Row: {
          company_id: string
          comparison_results: Json
          created_at: string
          detected_clauses: Json
          error_message: string | null
          extracted_terms: Json
          extracted_text: string | null
          file_deleted: boolean
          file_path: string | null
          id: string
          input_type: string
          offer_snapshot: Json
          original_filename: string | null
          processing_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          comparison_results?: Json
          created_at?: string
          detected_clauses?: Json
          error_message?: string | null
          extracted_terms?: Json
          extracted_text?: string | null
          file_deleted?: boolean
          file_path?: string | null
          id?: string
          input_type?: string
          offer_snapshot?: Json
          original_filename?: string | null
          processing_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          comparison_results?: Json
          created_at?: string
          detected_clauses?: Json
          error_message?: string | null
          extracted_terms?: Json
          extracted_text?: string | null
          file_deleted?: boolean
          file_path?: string | null
          id?: string
          input_type?: string
          offer_snapshot?: Json
          original_filename?: string | null
          processing_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_letter_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_equity_signals: {
        Row: {
          company_id: string
          confidence: string
          created_at: string
          date_detected: string
          detection_method: string
          evidence_text: string | null
          id: string
          jurisdiction: string | null
          last_verified: string | null
          notes: string | null
          signal_category: string
          signal_type: string
          source_title: string | null
          source_type: string | null
          source_url: string | null
          status: string
        }
        Insert: {
          company_id: string
          confidence?: string
          created_at?: string
          date_detected?: string
          detection_method?: string
          evidence_text?: string | null
          id?: string
          jurisdiction?: string | null
          last_verified?: string | null
          notes?: string | null
          signal_category: string
          signal_type: string
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          confidence?: string
          created_at?: string
          date_detected?: string
          detection_method?: string
          evidence_text?: string | null
          id?: string
          jurisdiction?: string | null
          last_verified?: string | null
          notes?: string | null
          signal_category?: string
          signal_type?: string
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_equity_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_benefits_out: {
        Row: {
          agency: string | null
          amount: number | null
          benefit_type: string
          confidence_score: number
          created_at: string
          date: string | null
          description: string | null
          entity_id: string
          id: string
          source_url: string | null
        }
        Insert: {
          agency?: string | null
          amount?: number | null
          benefit_type: string
          confidence_score?: number
          created_at?: string
          date?: string | null
          description?: string | null
          entity_id: string
          id?: string
          source_url?: string | null
        }
        Update: {
          agency?: string | null
          amount?: number | null
          benefit_type?: string
          confidence_score?: number
          created_at?: string
          date?: string | null
          description?: string | null
          entity_id?: string
          id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_benefits_out_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "pipeline_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_entities: {
        Row: {
          aliases: string[] | null
          canonical_name: string
          created_at: string
          id: string
          parent_company: string | null
          searched_name: string
          ticker: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          aliases?: string[] | null
          canonical_name: string
          created_at?: string
          id?: string
          parent_company?: string | null
          searched_name: string
          ticker?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          aliases?: string[] | null
          canonical_name?: string
          created_at?: string
          id?: string
          parent_company?: string | null
          searched_name?: string
          ticker?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      pipeline_influence_network: {
        Row: {
          confidence_score: number
          created_at: string
          entity_id: string
          id: string
          node_name: string
          node_type: string
          related_to: string | null
          relationship_type: string
          source_url: string | null
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          entity_id: string
          id?: string
          node_name: string
          node_type: string
          related_to?: string | null
          relationship_type: string
          source_url?: string | null
        }
        Update: {
          confidence_score?: number
          created_at?: string
          entity_id?: string
          id?: string
          node_name?: string
          node_type?: string
          related_to?: string | null
          relationship_type?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_influence_network_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "pipeline_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_money_in: {
        Row: {
          amount: number | null
          confidence_score: number
          created_at: string
          date: string | null
          entity_id: string
          filing_url: string | null
          id: string
          recipient_name: string
          source_name: string
          source_type: string
        }
        Insert: {
          amount?: number | null
          confidence_score?: number
          created_at?: string
          date?: string | null
          entity_id: string
          filing_url?: string | null
          id?: string
          recipient_name: string
          source_name: string
          source_type: string
        }
        Update: {
          amount?: number | null
          confidence_score?: number
          created_at?: string
          date?: string | null
          entity_id?: string
          filing_url?: string | null
          id?: string
          recipient_name?: string
          source_name?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_money_in_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "pipeline_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_transparency_required: boolean | null
          bio: string | null
          created_at: string
          email: string | null
          employer_company_id: string | null
          full_name: string | null
          id: string
          linkedin_url: string | null
          min_safety_score: number | null
          min_salary: number | null
          pay_transparency_required: boolean | null
          required_benefits: string[] | null
          resume_url: string | null
          skills: string[] | null
          target_job_titles: string[] | null
          updated_at: string
        }
        Insert: {
          ai_transparency_required?: boolean | null
          bio?: string | null
          created_at?: string
          email?: string | null
          employer_company_id?: string | null
          full_name?: string | null
          id: string
          linkedin_url?: string | null
          min_safety_score?: number | null
          min_salary?: number | null
          pay_transparency_required?: boolean | null
          required_benefits?: string[] | null
          resume_url?: string | null
          skills?: string[] | null
          target_job_titles?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_transparency_required?: boolean | null
          bio?: string | null
          created_at?: string
          email?: string | null
          employer_company_id?: string | null
          full_name?: string | null
          id?: string
          linkedin_url?: string | null
          min_safety_score?: number | null
          min_salary?: number | null
          pay_transparency_required?: boolean | null
          required_benefits?: string[] | null
          resume_url?: string | null
          skills?: string[] | null
          target_job_titles?: string[] | null
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
      project_gigs: {
        Row: {
          company_id: string | null
          created_at: string
          department: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          is_active: boolean
          skills_offered: string[] | null
          title: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean
          skills_offered?: string[] | null
          title: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          department?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_active?: boolean
          skills_offered?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_gigs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_pathway: {
        Row: {
          avg_months_to_pivot: number | null
          company_id: string | null
          created_at: string
          difficulty_score: number | null
          id: string
          move_type: string
          optional_skills: string[] | null
          recommended_certifications: string[] | null
          required_skills: string[] | null
          source_role: string
          target_role: string
        }
        Insert: {
          avg_months_to_pivot?: number | null
          company_id?: string | null
          created_at?: string
          difficulty_score?: number | null
          id?: string
          move_type?: string
          optional_skills?: string[] | null
          recommended_certifications?: string[] | null
          required_skills?: string[] | null
          source_role: string
          target_role: string
        }
        Update: {
          avg_months_to_pivot?: number | null
          company_id?: string | null
          created_at?: string
          difficulty_score?: number | null
          id?: string
          move_type?: string
          optional_skills?: string[] | null
          recommended_certifications?: string[] | null
          required_skills?: string[] | null
          source_role?: string
          target_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_pathway_company_id_fkey"
            columns: ["company_id"]
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
      scan_runs: {
        Row: {
          company_id: string
          created_at: string
          entity_resolution_log: Json | null
          error_log: Json | null
          id: string
          module_statuses: Json
          modules_completed: number
          modules_failed: number
          modules_with_no_signals: number
          modules_with_signals: number
          scan_completed_at: string | null
          scan_started_at: string
          scan_status: string
          total_modules_run: number
          total_signals_found: number
          total_sources_scanned: number
          triggered_by: string
          warnings: string[] | null
        }
        Insert: {
          company_id: string
          created_at?: string
          entity_resolution_log?: Json | null
          error_log?: Json | null
          id?: string
          module_statuses?: Json
          modules_completed?: number
          modules_failed?: number
          modules_with_no_signals?: number
          modules_with_signals?: number
          scan_completed_at?: string | null
          scan_started_at?: string
          scan_status?: string
          total_modules_run?: number
          total_signals_found?: number
          total_sources_scanned?: number
          triggered_by?: string
          warnings?: string[] | null
        }
        Update: {
          company_id?: string
          created_at?: string
          entity_resolution_log?: Json | null
          error_log?: Json | null
          id?: string
          module_statuses?: Json
          modules_completed?: number
          modules_failed?: number
          modules_with_no_signals?: number
          modules_with_signals?: number
          scan_completed_at?: string | null
          scan_started_at?: string
          scan_status?: string
          total_modules_run?: number
          total_signals_found?: number
          total_sources_scanned?: number
          triggered_by?: string
          warnings?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_runs_company_id_fkey"
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
      signal_change_events: {
        Row: {
          change_description: string | null
          change_type: string
          company_id: string
          confidence_level: string
          created_at: string
          id: string
          signal_category: string
          source_url: string | null
        }
        Insert: {
          change_description?: string | null
          change_type?: string
          company_id: string
          confidence_level?: string
          created_at?: string
          id?: string
          signal_category: string
          source_url?: string | null
        }
        Update: {
          change_description?: string | null
          change_type?: string
          company_id?: string
          confidence_level?: string
          created_at?: string
          id?: string
          signal_category?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_change_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_change_log: {
        Row: {
          change_type: string
          company_id: string
          confidence_change: string | null
          created_at: string
          id: string
          new_value: string | null
          previous_value: string | null
          scan_timestamp: string
          signal_category: string
          source_url: string | null
        }
        Insert: {
          change_type: string
          company_id: string
          confidence_change?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          scan_timestamp?: string
          signal_category: string
          source_url?: string | null
        }
        Update: {
          change_type?: string
          company_id?: string
          confidence_change?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          scan_timestamp?: string
          signal_category?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_change_log_company_id_fkey"
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
      user_alerts: {
        Row: {
          change_description: string
          change_type: string
          company_id: string
          company_name: string
          created_at: string
          date_detected: string
          dismissed_at: string | null
          id: string
          is_read: boolean
          signal_category: string
          snoozed_until: string | null
          user_id: string
        }
        Insert: {
          change_description: string
          change_type: string
          company_id: string
          company_name: string
          created_at?: string
          date_detected?: string
          dismissed_at?: string | null
          id?: string
          is_read?: boolean
          signal_category: string
          snoozed_until?: string | null
          user_id: string
        }
        Update: {
          change_description?: string
          change_type?: string
          company_id?: string
          company_name?: string
          created_at?: string
          date_detected?: string
          dismissed_at?: string | null
          id?: string
          is_read?: boolean
          signal_category?: string
          snoozed_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_career_profile: {
        Row: {
          auto_generated: boolean | null
          created_at: string
          id: string
          industries: string[] | null
          job_titles: string[] | null
          management_scope: string | null
          preferred_locations: string[] | null
          preferred_titles: string[] | null
          preferred_work_mode: string | null
          salary_range_max: number | null
          salary_range_min: number | null
          seniority_level: string | null
          skills: string[] | null
          updated_at: string
          user_id: string
          values_preferences: Json | null
        }
        Insert: {
          auto_generated?: boolean | null
          created_at?: string
          id?: string
          industries?: string[] | null
          job_titles?: string[] | null
          management_scope?: string | null
          preferred_locations?: string[] | null
          preferred_titles?: string[] | null
          preferred_work_mode?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          seniority_level?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          values_preferences?: Json | null
        }
        Update: {
          auto_generated?: boolean | null
          created_at?: string
          id?: string
          industries?: string[] | null
          job_titles?: string[] | null
          management_scope?: string | null
          preferred_locations?: string[] | null
          preferred_titles?: string[] | null
          preferred_work_mode?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          seniority_level?: string | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          values_preferences?: Json | null
        }
        Relationships: []
      }
      user_company_watchlist: {
        Row: {
          company_id: string
          id: string
          notification_preferences: Json | null
          user_id: string
          watch_timestamp: string
        }
        Insert: {
          company_id: string
          id?: string
          notification_preferences?: Json | null
          user_id: string
          watch_timestamp?: string
        }
        Update: {
          company_id?: string
          id?: string
          notification_preferences?: Json | null
          user_id?: string
          watch_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_watchlist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          confidence_level: string | null
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_deleted: boolean | null
          file_path: string
          id: string
          original_filename: string | null
          parsed_signals: Json | null
          parsed_summary: Json | null
          status: Database["public"]["Enums"]["document_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_deleted?: boolean | null
          file_path: string
          id?: string
          original_filename?: string | null
          parsed_signals?: Json | null
          parsed_summary?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_deleted?: boolean | null
          file_path?: string
          id?: string
          original_filename?: string | null
          parsed_signals?: Json | null
          parsed_summary?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_values_preferences: {
        Row: {
          created_at: string
          id: string
          is_positive: boolean
          user_id: string
          value_category: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_positive?: boolean
          user_id: string
          value_category: string
        }
        Update: {
          created_at?: string
          id?: string
          is_positive?: boolean
          user_id?: string
          value_category?: string
        }
        Relationships: []
      }
      worker_benefit_signals: {
        Row: {
          benefit_category: string
          benefit_type: string
          company_id: string
          confidence: string
          created_at: string
          date_detected: string
          detection_method: string
          evidence_text: string | null
          id: string
          last_verified: string | null
          source_type: string | null
          source_url: string | null
          status: string
        }
        Insert: {
          benefit_category: string
          benefit_type: string
          company_id: string
          confidence?: string
          created_at?: string
          date_detected?: string
          detection_method?: string
          evidence_text?: string | null
          id?: string
          last_verified?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
        }
        Update: {
          benefit_category?: string
          benefit_type?: string
          company_id?: string
          confidence?: string
          created_at?: string
          date_detected?: string
          detection_method?: string
          evidence_text?: string | null
          id?: string
          last_verified?: string | null
          source_type?: string | null
          source_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_benefit_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workplace_enforcement_signals: {
        Row: {
          agency_name: string
          case_number: string | null
          company_id: string
          confidence: string
          created_at: string
          description: string | null
          detected_at: string
          detection_method: string
          employees_affected: number | null
          enforcement_date: string | null
          evidence_text: string | null
          id: string
          last_verified_at: string | null
          penalty_amount: number | null
          resolution_type: string | null
          signal_category: string
          signal_type: string
          source_name: string
          source_url: string | null
        }
        Insert: {
          agency_name: string
          case_number?: string | null
          company_id: string
          confidence?: string
          created_at?: string
          description?: string | null
          detected_at?: string
          detection_method?: string
          employees_affected?: number | null
          enforcement_date?: string | null
          evidence_text?: string | null
          id?: string
          last_verified_at?: string | null
          penalty_amount?: number | null
          resolution_type?: string | null
          signal_category: string
          signal_type: string
          source_name: string
          source_url?: string | null
        }
        Update: {
          agency_name?: string
          case_number?: string | null
          company_id?: string
          confidence?: string
          created_at?: string
          description?: string | null
          detected_at?: string
          detection_method?: string
          employees_affected?: number | null
          enforcement_date?: string | null
          evidence_text?: string | null
          id?: string
          last_verified_at?: string | null
          penalty_amount?: number | null
          resolution_type?: string | null
          signal_category?: string
          signal_type?: string
          source_name?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workplace_enforcement_signals_company_id_fkey"
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
      document_status: "pending" | "parsing" | "parsed" | "error" | "deleted"
      document_type: "offer_letter" | "resume" | "job_description"
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
      document_status: ["pending", "parsing", "parsed", "error", "deleted"],
      document_type: ["offer_letter", "resume", "job_description"],
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
