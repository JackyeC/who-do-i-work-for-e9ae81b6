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
      bls_benefits_benchmarks: {
        Row: {
          benefit_category: string
          benefit_type: string
          data_quarter: number | null
          data_year: number
          employer_cost_per_hour: number | null
          fetched_at: string
          id: string
          industry_group: string | null
          participation_rate: number | null
          source_program: string
          worker_type: string
        }
        Insert: {
          benefit_category: string
          benefit_type: string
          data_quarter?: number | null
          data_year: number
          employer_cost_per_hour?: number | null
          fetched_at?: string
          id?: string
          industry_group?: string | null
          participation_rate?: number | null
          source_program?: string
          worker_type?: string
        }
        Update: {
          benefit_category?: string
          benefit_type?: string
          data_quarter?: number | null
          data_year?: number
          employer_cost_per_hour?: number | null
          fetched_at?: string
          id?: string
          industry_group?: string | null
          participation_rate?: number | null
          source_program?: string
          worker_type?: string
        }
        Relationships: []
      }
      bls_demographic_earnings: {
        Row: {
          comparison_group: string | null
          data_quarter: number | null
          data_year: number
          demographic_group: string
          demographic_value: string
          earnings_ratio: number | null
          fetched_at: string
          id: string
          median_annual_earnings: number | null
          median_weekly_earnings: number | null
          source_program: string
        }
        Insert: {
          comparison_group?: string | null
          data_quarter?: number | null
          data_year: number
          demographic_group: string
          demographic_value: string
          earnings_ratio?: number | null
          fetched_at?: string
          id?: string
          median_annual_earnings?: number | null
          median_weekly_earnings?: number | null
          source_program?: string
        }
        Update: {
          comparison_group?: string | null
          data_quarter?: number | null
          data_year?: number
          demographic_group?: string
          demographic_value?: string
          earnings_ratio?: number | null
          fetched_at?: string
          id?: string
          median_annual_earnings?: number | null
          median_weekly_earnings?: number | null
          source_program?: string
        }
        Relationships: []
      }
      bls_eci_trends: {
        Row: {
          compensation_type: string
          fetched_at: string
          id: string
          industry_group: string | null
          occupation_group: string | null
          percent_change_12mo: number | null
          period: string
          series_id: string
          series_title: string
          source_program: string
          value: number
          year: number
        }
        Insert: {
          compensation_type?: string
          fetched_at?: string
          id?: string
          industry_group?: string | null
          occupation_group?: string | null
          percent_change_12mo?: number | null
          period: string
          series_id: string
          series_title: string
          source_program?: string
          value: number
          year: number
        }
        Update: {
          compensation_type?: string
          fetched_at?: string
          id?: string
          industry_group?: string | null
          occupation_group?: string | null
          percent_change_12mo?: number | null
          period?: string
          series_id?: string
          series_title?: string
          source_program?: string
          value?: number
          year?: number
        }
        Relationships: []
      }
      bls_wage_benchmarks: {
        Row: {
          annual_10th: number | null
          annual_25th: number | null
          annual_75th: number | null
          annual_90th: number | null
          annual_mean: number | null
          annual_median: number | null
          area_code: string
          area_title: string
          data_year: number
          fetched_at: string
          hourly_10th: number | null
          hourly_25th: number | null
          hourly_75th: number | null
          hourly_90th: number | null
          hourly_mean: number | null
          hourly_median: number | null
          id: string
          industry_code: string
          occupation_code: string
          occupation_title: string
          source_program: string
          total_employment: number | null
        }
        Insert: {
          annual_10th?: number | null
          annual_25th?: number | null
          annual_75th?: number | null
          annual_90th?: number | null
          annual_mean?: number | null
          annual_median?: number | null
          area_code?: string
          area_title?: string
          data_year: number
          fetched_at?: string
          hourly_10th?: number | null
          hourly_25th?: number | null
          hourly_75th?: number | null
          hourly_90th?: number | null
          hourly_mean?: number | null
          hourly_median?: number | null
          id?: string
          industry_code?: string
          occupation_code: string
          occupation_title: string
          source_program?: string
          total_employment?: number | null
        }
        Update: {
          annual_10th?: number | null
          annual_25th?: number | null
          annual_75th?: number | null
          annual_90th?: number | null
          annual_mean?: number | null
          annual_median?: number | null
          area_code?: string
          area_title?: string
          data_year?: number
          fetched_at?: string
          hourly_10th?: number | null
          hourly_25th?: number | null
          hourly_75th?: number | null
          hourly_90th?: number | null
          hourly_mean?: number | null
          hourly_median?: number | null
          id?: string
          industry_code?: string
          occupation_code?: string
          occupation_title?: string
          source_program?: string
          total_employment?: number | null
        }
        Relationships: []
      }
      board_members: {
        Row: {
          bio: string | null
          committees: string[] | null
          company_id: string
          created_at: string
          id: string
          is_independent: boolean | null
          last_verified_at: string | null
          name: string
          photo_url: string | null
          previous_company: string | null
          source: string | null
          start_year: number | null
          title: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          committees?: string[] | null
          company_id: string
          created_at?: string
          id?: string
          is_independent?: boolean | null
          last_verified_at?: string | null
          name: string
          photo_url?: string | null
          previous_company?: string | null
          source?: string | null
          start_year?: number | null
          title?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          committees?: string[] | null
          company_id?: string
          created_at?: string
          id?: string
          is_independent?: boolean | null
          last_verified_at?: string | null
          name?: string
          photo_url?: string | null
          previous_company?: string | null
          source?: string | null
          start_year?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      career_contacts: {
        Row: {
          company: string | null
          company_id: string | null
          contact_type: string
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          name: string
          profile_url: string | null
          role_tags: string[] | null
          source_type: string | null
          title: string | null
        }
        Insert: {
          company?: string | null
          company_id?: string | null
          contact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name: string
          profile_url?: string | null
          role_tags?: string[] | null
          source_type?: string | null
          title?: string | null
        }
        Update: {
          company?: string | null
          company_id?: string | null
          contact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name?: string
          profile_url?: string | null
          role_tags?: string[] | null
          source_type?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          average_salary: string | null
          career_progression_confidence: number | null
          created_at: string
          id: string
          industry: string | null
          next_role: string
          role_title: string
          skills_required: Json | null
        }
        Insert: {
          average_salary?: string | null
          career_progression_confidence?: number | null
          created_at?: string
          id?: string
          industry?: string | null
          next_role: string
          role_title: string
          skills_required?: Json | null
        }
        Update: {
          average_salary?: string | null
          career_progression_confidence?: number | null
          created_at?: string
          id?: string
          industry?: string | null
          next_role?: string
          role_title?: string
          skills_required?: Json | null
        }
        Relationships: []
      }
      career_smart_goals: {
        Row: {
          achievable: string | null
          created_at: string
          description: string | null
          id: string
          is_ai_generated: boolean | null
          measurable: string | null
          relevant: string | null
          sort_order: number | null
          specific: string | null
          status: string
          time_bound: string | null
          title: string
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievable?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          measurable?: string | null
          relevant?: string | null
          sort_order?: number | null
          specific?: string | null
          status?: string
          time_bound?: string | null
          title: string
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievable?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_ai_generated?: boolean | null
          measurable?: string | null
          relevant?: string | null
          sort_order?: number | null
          specific?: string | null
          status?: string
          time_bound?: string | null
          title?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_smart_goals_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "employee_growth_tracker"
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
          is_publicly_traded: boolean | null
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
          sec_cik: string | null
          slug: string
          state: string
          subsidies_received: number | null
          ticker: string | null
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
          is_publicly_traded?: boolean | null
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
          sec_cik?: string | null
          slug: string
          state: string
          subsidies_received?: number | null
          ticker?: string | null
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
          is_publicly_traded?: boolean | null
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
          sec_cik?: string | null
          slug?: string
          state?: string
          subsidies_received?: number | null
          ticker?: string | null
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
          created_at: string | null
          id: string
          last_verified_at: string | null
          name: string
          photo_url: string | null
          source: string | null
          title: string
          total_donations: number
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          last_verified_at?: string | null
          name: string
          photo_url?: string | null
          source?: string | null
          title: string
          total_donations?: number
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          last_verified_at?: string | null
          name?: string
          photo_url?: string | null
          source?: string | null
          title?: string
          total_donations?: number
          updated_at?: string | null
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
      company_values_evidence: {
        Row: {
          amount: number | null
          confidence_level: string
          created_at: string
          entity_id: string
          event_date: string | null
          evidence_excerpt: string | null
          evidence_summary: string | null
          id: string
          related_legislation: string | null
          related_org: string | null
          related_politician: string | null
          signal_type: string
          source_name: string | null
          source_title: string | null
          source_type: string | null
          source_url: string | null
          updated_at: string
          values_lens: string
          verification_status: string
        }
        Insert: {
          amount?: number | null
          confidence_level?: string
          created_at?: string
          entity_id: string
          event_date?: string | null
          evidence_excerpt?: string | null
          evidence_summary?: string | null
          id?: string
          related_legislation?: string | null
          related_org?: string | null
          related_politician?: string | null
          signal_type: string
          source_name?: string | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          updated_at?: string
          values_lens: string
          verification_status?: string
        }
        Update: {
          amount?: number | null
          confidence_level?: string
          created_at?: string
          entity_id?: string
          event_date?: string | null
          evidence_excerpt?: string | null
          evidence_summary?: string | null
          id?: string
          related_legislation?: string | null
          related_org?: string | null
          related_politician?: string | null
          signal_type?: string
          source_name?: string | null
          source_title?: string | null
          source_type?: string | null
          source_url?: string | null
          updated_at?: string
          values_lens?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_values_evidence_entity_id_fkey"
            columns: ["entity_id"]
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
          confidence_level: string | null
          created_at: string
          detected_by: string
          evidence_count: number | null
          evidence_text: string | null
          evidence_url: string | null
          id: string
          scan_date: string
          severity: string
          signal_direction: string | null
          signal_label: string | null
          signal_summary: string | null
          signal_type: string
          value_category: string
          values_lens: string | null
          verification_status: string | null
        }
        Insert: {
          company_id: string
          confidence?: string
          confidence_level?: string | null
          created_at?: string
          detected_by?: string
          evidence_count?: number | null
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          scan_date?: string
          severity?: string
          signal_direction?: string | null
          signal_label?: string | null
          signal_summary?: string | null
          signal_type: string
          value_category: string
          values_lens?: string | null
          verification_status?: string | null
        }
        Update: {
          company_id?: string
          confidence?: string
          confidence_level?: string | null
          created_at?: string
          detected_by?: string
          evidence_count?: number | null
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          scan_date?: string
          severity?: string
          signal_direction?: string | null
          signal_label?: string | null
          signal_summary?: string | null
          signal_type?: string
          value_category?: string
          values_lens?: string | null
          verification_status?: string | null
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
          employer_name_raw: string | null
          id: string
          industry: string | null
          last_synced_at: string | null
          layoff_type: string
          location_city: string | null
          location_state: string | null
          notice_date: string
          public_announcement_date: string | null
          reason: string | null
          reason_type: string
          source_state: string | null
          source_type: string
          source_url: string | null
          support_services_coordinator: string | null
          support_services_mentioned: boolean | null
          workforce_board_referenced: boolean | null
        }
        Insert: {
          company_id: string
          confidence?: string
          created_at?: string
          effective_date?: string | null
          employees_affected?: number
          employer_name_raw?: string | null
          id?: string
          industry?: string | null
          last_synced_at?: string | null
          layoff_type?: string
          location_city?: string | null
          location_state?: string | null
          notice_date: string
          public_announcement_date?: string | null
          reason?: string | null
          reason_type?: string
          source_state?: string | null
          source_type?: string
          source_url?: string | null
          support_services_coordinator?: string | null
          support_services_mentioned?: boolean | null
          workforce_board_referenced?: boolean | null
        }
        Update: {
          company_id?: string
          confidence?: string
          created_at?: string
          effective_date?: string | null
          employees_affected?: number
          employer_name_raw?: string | null
          id?: string
          industry?: string | null
          last_synced_at?: string | null
          layoff_type?: string
          location_city?: string | null
          location_state?: string | null
          notice_date?: string
          public_announcement_date?: string | null
          reason?: string | null
          reason_type?: string
          source_state?: string | null
          source_type?: string
          source_url?: string | null
          support_services_coordinator?: string | null
          support_services_mentioned?: boolean | null
          workforce_board_referenced?: boolean | null
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
      connection_company_map: {
        Row: {
          company_id: string
          connection_id: string
          created_at: string
          id: string
          match_confidence: number
        }
        Insert: {
          company_id: string
          connection_id: string
          created_at?: string
          id?: string
          match_confidence?: number
        }
        Update: {
          company_id?: string
          connection_id?: string
          created_at?: string
          id?: string
          match_confidence?: number
        }
        Relationships: [
          {
            foreignKeyName: "connection_company_map_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_company_map_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "user_connections"
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
      issue_legislation_map: {
        Row: {
          bill_keyword: string
          bill_number: string | null
          congress_session: string | null
          created_at: string
          description: string | null
          id: string
          issue_category: string
          policy_area: string | null
        }
        Insert: {
          bill_keyword: string
          bill_number?: string | null
          congress_session?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_category: string
          policy_area?: string | null
        }
        Update: {
          bill_keyword?: string
          bill_number?: string | null
          congress_session?: string | null
          created_at?: string
          description?: string | null
          id?: string
          issue_category?: string
          policy_area?: string | null
        }
        Relationships: []
      }
      issue_scan_status: {
        Row: {
          companies_scanned: number
          created_at: string
          id: string
          issue_category: string
          last_scan_at: string | null
          records_analyzed: number
          scan_status: string
          signals_generated: number
          updated_at: string
        }
        Insert: {
          companies_scanned?: number
          created_at?: string
          id?: string
          issue_category: string
          last_scan_at?: string | null
          records_analyzed?: number
          scan_status?: string
          signals_generated?: number
          updated_at?: string
        }
        Update: {
          companies_scanned?: number
          created_at?: string
          id?: string
          issue_category?: string
          last_scan_at?: string | null
          records_analyzed?: number
          scan_status?: string
          signals_generated?: number
          updated_at?: string
        }
        Relationships: []
      }
      issue_signals: {
        Row: {
          amount: number | null
          confidence_score: string
          created_at: string
          description: string | null
          entity_id: string
          entity_name_snapshot: string | null
          id: string
          issue_category: string
          signal_subtype: string | null
          signal_type: string
          source_dataset: string
          source_url: string | null
          transaction_date: string | null
        }
        Insert: {
          amount?: number | null
          confidence_score?: string
          created_at?: string
          description?: string | null
          entity_id: string
          entity_name_snapshot?: string | null
          id?: string
          issue_category: string
          signal_subtype?: string | null
          signal_type?: string
          source_dataset: string
          source_url?: string | null
          transaction_date?: string | null
        }
        Update: {
          amount?: number | null
          confidence_score?: string
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_name_snapshot?: string | null
          id?: string
          issue_category?: string
          signal_subtype?: string | null
          signal_type?: string
          source_dataset?: string
          source_url?: string | null
          transaction_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_signals_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      leader_follows: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          leader_id: string
          leader_name: string
          leader_type: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          leader_id: string
          leader_name: string
          leader_type: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          leader_id?: string
          leader_name?: string
          leader_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_follows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leadership_corrections: {
        Row: {
          company_id: string
          correction_type: string
          created_at: string
          description: string
          evidence_url: string | null
          id: string
          leader_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          company_id: string
          correction_type?: string
          created_at?: string
          description: string
          evidence_url?: string | null
          id?: string
          leader_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string
          correction_type?: string
          created_at?: string
          description?: string
          evidence_url?: string | null
          id?: string
          leader_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leadership_corrections_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          created_at: string
          description: string | null
          estimated_time: string | null
          id: string
          level: string | null
          provider_name: string
          resource_title: string
          resource_type: string
          resource_url: string | null
          skill_tag: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_time?: string | null
          id?: string
          level?: string | null
          provider_name: string
          resource_title: string
          resource_type?: string
          resource_url?: string | null
          skill_tag: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_time?: string | null
          id?: string
          level?: string | null
          provider_name?: string
          resource_title?: string
          resource_type?: string
          resource_url?: string | null
          skill_tag?: string
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
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
      organization_profile_enrichment: {
        Row: {
          company_id: string
          confidence_score: number | null
          contributions_total: number | null
          created_at: string
          cross_check_results: Json | null
          fetched_at: string
          id: string
          industry_label: string | null
          issue_tags: string[] | null
          lobbying_total: number | null
          opensecrets_org_identifier: string | null
          opensecrets_org_name: string | null
          outside_spending_total: number | null
          pac_names_json: Json | null
          party_split_json: Json | null
          profile_url: string | null
          sector_label: string | null
          source_name: string
          source_note: string | null
          source_release_date: string | null
          source_type: string
          top_recipients_json: Json | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          contributions_total?: number | null
          created_at?: string
          cross_check_results?: Json | null
          fetched_at?: string
          id?: string
          industry_label?: string | null
          issue_tags?: string[] | null
          lobbying_total?: number | null
          opensecrets_org_identifier?: string | null
          opensecrets_org_name?: string | null
          outside_spending_total?: number | null
          pac_names_json?: Json | null
          party_split_json?: Json | null
          profile_url?: string | null
          sector_label?: string | null
          source_name?: string
          source_note?: string | null
          source_release_date?: string | null
          source_type?: string
          top_recipients_json?: Json | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          contributions_total?: number | null
          created_at?: string
          cross_check_results?: Json | null
          fetched_at?: string
          id?: string
          industry_label?: string | null
          issue_tags?: string[] | null
          lobbying_total?: number | null
          opensecrets_org_identifier?: string | null
          opensecrets_org_name?: string | null
          outside_spending_total?: number | null
          pac_names_json?: Json | null
          party_split_json?: Json | null
          profile_url?: string | null
          sector_label?: string | null
          source_name?: string
          source_note?: string | null
          source_release_date?: string | null
          source_type?: string
          top_recipients_json?: Json | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_profile_enrichment_company_id_fkey"
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
      plans: {
        Row: {
          id: string
          max_slots: number
          monthly_price_cents: number
          name: string
        }
        Insert: {
          id?: string
          max_slots: number
          monthly_price_cents: number
          name: string
        }
        Update: {
          id?: string
          max_slots?: number
          monthly_price_cents?: number
          name?: string
        }
        Relationships: []
      }
      policy_reports: {
        Row: {
          author_name: string
          author_slug: string | null
          confidence_level: string | null
          created_at: string
          executive_summary: string | null
          featured_image_url: string | null
          full_report_text: string | null
          hero_quote: string | null
          id: string
          issue_categories_json: Json | null
          primary_issue_category: string | null
          publication_date: string | null
          report_type: string
          slug: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          author_name?: string
          author_slug?: string | null
          confidence_level?: string | null
          created_at?: string
          executive_summary?: string | null
          featured_image_url?: string | null
          full_report_text?: string | null
          hero_quote?: string | null
          id?: string
          issue_categories_json?: Json | null
          primary_issue_category?: string | null
          publication_date?: string | null
          report_type?: string
          slug: string
          status?: string
          subtitle?: string | null
          title: string
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          author_name?: string
          author_slug?: string | null
          confidence_level?: string | null
          created_at?: string
          executive_summary?: string | null
          featured_image_url?: string | null
          full_report_text?: string | null
          hero_quote?: string | null
          id?: string
          issue_categories_json?: Json | null
          primary_issue_category?: string | null
          publication_date?: string | null
          report_type?: string
          slug?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: []
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
          onboarding_completed: boolean
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
          onboarding_completed?: boolean
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
          onboarding_completed?: boolean
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
      report_actions: {
        Row: {
          action_description: string | null
          action_order: number
          action_title: string
          action_type: string
          created_at: string
          id: string
          priority_level: string | null
          related_entity_id: string | null
          related_issue_category: string | null
          report_id: string
        }
        Insert: {
          action_description?: string | null
          action_order?: number
          action_title: string
          action_type?: string
          created_at?: string
          id?: string
          priority_level?: string | null
          related_entity_id?: string | null
          related_issue_category?: string | null
          report_id: string
        }
        Update: {
          action_description?: string | null
          action_order?: number
          action_title?: string
          action_type?: string
          created_at?: string
          id?: string
          priority_level?: string | null
          related_entity_id?: string | null
          related_issue_category?: string | null
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_claims: {
        Row: {
          claim_order: number
          claim_text: string
          claim_title: string
          claim_type: string
          confidence_level: string | null
          created_at: string
          evidence_required: boolean | null
          id: string
          issue_category: string | null
          report_id: string
          section_id: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          claim_order?: number
          claim_text: string
          claim_title: string
          claim_type?: string
          confidence_level?: string | null
          created_at?: string
          evidence_required?: boolean | null
          id?: string
          issue_category?: string | null
          report_id: string
          section_id?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          claim_order?: number
          claim_text?: string
          claim_title?: string
          claim_type?: string
          confidence_level?: string | null
          created_at?: string
          evidence_required?: boolean | null
          id?: string
          issue_category?: string | null
          report_id?: string
          section_id?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_claims_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_claims_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "report_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_company_alignment: {
        Row: {
          alignment_summary: string | null
          alignment_theme: string | null
          confidence_level: string | null
          created_at: string
          dirty_receipt_label: string | null
          entity_id: string | null
          entity_name_snapshot: string
          evidence_note: string | null
          id: string
          issue_category: string | null
          report_id: string
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          alignment_summary?: string | null
          alignment_theme?: string | null
          confidence_level?: string | null
          created_at?: string
          dirty_receipt_label?: string | null
          entity_id?: string | null
          entity_name_snapshot: string
          evidence_note?: string | null
          id?: string
          issue_category?: string | null
          report_id: string
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          alignment_summary?: string | null
          alignment_theme?: string | null
          confidence_level?: string | null
          created_at?: string
          dirty_receipt_label?: string | null
          entity_id?: string | null
          entity_name_snapshot?: string
          evidence_note?: string | null
          id?: string
          issue_category?: string | null
          report_id?: string
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_company_alignment_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_entities: {
        Row: {
          claim_id: string | null
          confidence_level: string | null
          created_at: string
          entity_id: string | null
          entity_name_snapshot: string
          entity_type: string
          id: string
          relationship_description: string | null
          report_id: string
          section_id: string | null
        }
        Insert: {
          claim_id?: string | null
          confidence_level?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name_snapshot: string
          entity_type?: string
          id?: string
          relationship_description?: string | null
          report_id: string
          section_id?: string | null
        }
        Update: {
          claim_id?: string | null
          confidence_level?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name_snapshot?: string
          entity_type?: string
          id?: string
          relationship_description?: string | null
          report_id?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_entities_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "report_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_entities_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_entities_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "report_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_events: {
        Row: {
          confidence_level: string | null
          created_at: string
          end_date: string | null
          event_date: string | null
          event_description: string | null
          event_title: string
          event_type: string
          id: string
          issue_category: string | null
          report_id: string
          section_id: string | null
          source_url: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          end_date?: string | null
          event_date?: string | null
          event_description?: string | null
          event_title: string
          event_type?: string
          id?: string
          issue_category?: string | null
          report_id: string
          section_id?: string | null
          source_url?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          end_date?: string | null
          event_date?: string | null
          event_description?: string | null
          event_title?: string
          event_type?: string
          id?: string
          issue_category?: string | null
          report_id?: string
          section_id?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_events_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_events_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "report_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_evidence_links: {
        Row: {
          claim_id: string | null
          confidence_score: string | null
          created_at: string
          evidence_excerpt: string | null
          id: string
          report_id: string
          section_id: string | null
          source_date: string | null
          source_description: string | null
          source_name: string
          source_title: string | null
          source_type: string
          source_url: string | null
          verification_status: string | null
        }
        Insert: {
          claim_id?: string | null
          confidence_score?: string | null
          created_at?: string
          evidence_excerpt?: string | null
          id?: string
          report_id: string
          section_id?: string | null
          source_date?: string | null
          source_description?: string | null
          source_name: string
          source_title?: string | null
          source_type?: string
          source_url?: string | null
          verification_status?: string | null
        }
        Update: {
          claim_id?: string | null
          confidence_score?: string | null
          created_at?: string
          evidence_excerpt?: string | null
          id?: string
          report_id?: string
          section_id?: string | null
          source_date?: string | null
          source_description?: string | null
          source_name?: string
          source_title?: string | null
          source_type?: string
          source_url?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_links_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "report_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_evidence_links_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_evidence_links_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "report_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_followups: {
        Row: {
          created_at: string
          id: string
          priority_level: string | null
          prompt_text: string
          related_entity_id: string | null
          related_issue_category: string | null
          report_id: string
          section_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority_level?: string | null
          prompt_text: string
          related_entity_id?: string | null
          related_issue_category?: string | null
          report_id: string
          section_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority_level?: string | null
          prompt_text?: string
          related_entity_id?: string | null
          related_issue_category?: string | null
          report_id?: string
          section_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_followups_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_followups_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "report_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_legislation: {
        Row: {
          bill_name: string
          bill_number: string | null
          created_at: string
          current_status: string | null
          description: string | null
          id: string
          issue_category: string | null
          jurisdiction: string | null
          legislative_body: string | null
          legislative_session: string | null
          report_id: string
          section_id: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          bill_name: string
          bill_number?: string | null
          created_at?: string
          current_status?: string | null
          description?: string | null
          id?: string
          issue_category?: string | null
          jurisdiction?: string | null
          legislative_body?: string | null
          legislative_session?: string | null
          report_id: string
          section_id?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          bill_name?: string
          bill_number?: string | null
          created_at?: string
          current_status?: string | null
          description?: string | null
          id?: string
          issue_category?: string | null
          jurisdiction?: string | null
          legislative_body?: string | null
          legislative_session?: string | null
          report_id?: string
          section_id?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_legislation_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_legislation_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "report_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          confidence_level: string | null
          created_at: string
          full_section_text: string | null
          id: string
          issue_category: string | null
          report_id: string
          section_order: number
          section_subtitle: string | null
          section_summary: string | null
          section_title: string
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          full_section_text?: string | null
          id?: string
          issue_category?: string | null
          report_id: string
          section_order?: number
          section_subtitle?: string | null
          section_summary?: string | null
          section_title: string
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          full_section_text?: string | null
          id?: string
          issue_category?: string | null
          report_id?: string
          section_order?: number
          section_subtitle?: string | null
          section_summary?: string | null
          section_title?: string
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "policy_reports"
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
      signal_disputes: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          reason: string
          resolution_note: string | null
          resolved_at: string | null
          signal_id: string | null
          signal_type: string
          status: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          reason: string
          resolution_note?: string | null
          resolved_at?: string | null
          signal_id?: string | null
          signal_type: string
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          reason?: string
          resolution_note?: string | null
          resolved_at?: string | null
          signal_id?: string | null
          signal_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_disputes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          company_id: string
          confidence_level: number | null
          created_at: string | null
          date_published: string | null
          description: string | null
          id: string
          is_verified: boolean | null
          issue_area: string | null
          signal_type: string | null
          source_url: string | null
        }
        Insert: {
          company_id: string
          confidence_level?: number | null
          created_at?: string | null
          date_published?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          issue_area?: string | null
          signal_type?: string | null
          source_url?: string | null
        }
        Update: {
          company_id?: string
          confidence_level?: number | null
          created_at?: string | null
          date_published?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean | null
          issue_area?: string | null
          signal_type?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_company_id_fkey"
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
      tracked_companies: {
        Row: {
          company_id: string
          id: string
          is_active: boolean
          tracked_at: string
          untracked_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          is_active?: boolean
          tracked_at?: string
          untracked_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          is_active?: boolean
          tracked_at?: string
          untracked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_companies_company_id_fkey"
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
      user_alignment_values: {
        Row: {
          ai_transparency_weight: number
          avoid_industries: string[] | null
          benefits_quality_weight: number
          created_at: string
          dei_commitment_weight: number
          environmental_commitment_weight: number
          government_contracts_weight: number
          id: string
          min_civic_footprint_score: number | null
          organizational_affiliations_weight: number
          pay_equity_weight: number
          political_neutrality_weight: number
          preferred_industries: string[] | null
          updated_at: string
          user_id: string
          veteran_support_weight: number
          worker_protections_weight: number
        }
        Insert: {
          ai_transparency_weight?: number
          avoid_industries?: string[] | null
          benefits_quality_weight?: number
          created_at?: string
          dei_commitment_weight?: number
          environmental_commitment_weight?: number
          government_contracts_weight?: number
          id?: string
          min_civic_footprint_score?: number | null
          organizational_affiliations_weight?: number
          pay_equity_weight?: number
          political_neutrality_weight?: number
          preferred_industries?: string[] | null
          updated_at?: string
          user_id: string
          veteran_support_weight?: number
          worker_protections_weight?: number
        }
        Update: {
          ai_transparency_weight?: number
          avoid_industries?: string[] | null
          benefits_quality_weight?: number
          created_at?: string
          dei_commitment_weight?: number
          environmental_commitment_weight?: number
          government_contracts_weight?: number
          id?: string
          min_civic_footprint_score?: number | null
          organizational_affiliations_weight?: number
          pay_equity_weight?: number
          political_neutrality_weight?: number
          preferred_industries?: string[] | null
          updated_at?: string
          user_id?: string
          veteran_support_weight?: number
          worker_protections_weight?: number
        }
        Relationships: []
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
      user_connections: {
        Row: {
          company: string | null
          connection_date: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          title: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          connection_date?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          title?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          connection_date?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
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
      user_personality_profile: {
        Row: {
          ai_summary: string | null
          communication_style: string | null
          created_at: string
          id: string
          leadership_preference: string | null
          personality_traits: string[] | null
          strengths: string[] | null
          updated_at: string
          user_id: string
          work_environment: string | null
          work_style: string[] | null
        }
        Insert: {
          ai_summary?: string | null
          communication_style?: string | null
          created_at?: string
          id?: string
          leadership_preference?: string | null
          personality_traits?: string[] | null
          strengths?: string[] | null
          updated_at?: string
          user_id: string
          work_environment?: string | null
          work_style?: string[] | null
        }
        Update: {
          ai_summary?: string | null
          communication_style?: string | null
          created_at?: string
          id?: string
          leadership_preference?: string | null
          personality_traits?: string[] | null
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
          work_environment?: string | null
          work_style?: string[] | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          additional_slots: number | null
          current_period_end: string | null
          plan_id: string | null
          user_id: string
        }
        Insert: {
          additional_slots?: number | null
          current_period_end?: string | null
          plan_id?: string | null
          user_id: string
        }
        Update: {
          additional_slots?: number | null
          current_period_end?: string | null
          plan_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          function_name: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          function_name: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          function_name?: string
          id?: string
          used_at?: string
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
      user_values_profile: {
        Row: {
          ai_transparency_importance: number
          animal_welfare_importance: number
          anti_discrimination_importance: number
          benefits_importance: number
          company_size_preference: string | null
          consumer_protection_importance: number
          created_at: string
          dei_equity_importance: number
          environment_climate_importance: number
          faith_christian_importance: number
          government_contract_preference: number
          healthcare_importance: number
          id: string
          immigration_importance: number
          israel_middle_east_importance: number
          labor_rights_importance: number
          lgbtq_rights_importance: number
          mission_alignment_importance: number
          notes: string | null
          pay_transparency_importance: number
          political_influence_sensitivity: number
          remote_flexibility_importance: number
          representation_disclosure_importance: number
          reproductive_rights_importance: number
          startup_vs_enterprise_preference: string | null
          updated_at: string
          user_id: string
          voting_rights_importance: number
          worker_protections_importance: number
        }
        Insert: {
          ai_transparency_importance?: number
          animal_welfare_importance?: number
          anti_discrimination_importance?: number
          benefits_importance?: number
          company_size_preference?: string | null
          consumer_protection_importance?: number
          created_at?: string
          dei_equity_importance?: number
          environment_climate_importance?: number
          faith_christian_importance?: number
          government_contract_preference?: number
          healthcare_importance?: number
          id?: string
          immigration_importance?: number
          israel_middle_east_importance?: number
          labor_rights_importance?: number
          lgbtq_rights_importance?: number
          mission_alignment_importance?: number
          notes?: string | null
          pay_transparency_importance?: number
          political_influence_sensitivity?: number
          remote_flexibility_importance?: number
          representation_disclosure_importance?: number
          reproductive_rights_importance?: number
          startup_vs_enterprise_preference?: string | null
          updated_at?: string
          user_id: string
          voting_rights_importance?: number
          worker_protections_importance?: number
        }
        Update: {
          ai_transparency_importance?: number
          animal_welfare_importance?: number
          anti_discrimination_importance?: number
          benefits_importance?: number
          company_size_preference?: string | null
          consumer_protection_importance?: number
          created_at?: string
          dei_equity_importance?: number
          environment_climate_importance?: number
          faith_christian_importance?: number
          government_contract_preference?: number
          healthcare_importance?: number
          id?: string
          immigration_importance?: number
          israel_middle_east_importance?: number
          labor_rights_importance?: number
          lgbtq_rights_importance?: number
          mission_alignment_importance?: number
          notes?: string | null
          pay_transparency_importance?: number
          political_influence_sensitivity?: number
          remote_flexibility_importance?: number
          representation_disclosure_importance?: number
          reproductive_rights_importance?: number
          startup_vs_enterprise_preference?: string | null
          updated_at?: string
          user_id?: string
          voting_rights_importance?: number
          worker_protections_importance?: number
        }
        Relationships: []
      }
      values_check_signals: {
        Row: {
          amount: number | null
          company_id: string
          confidence_label: string
          confidence_score: number
          created_at: string
          evidence_json: Json | null
          id: string
          issue_area: string
          matched_entity_type: string | null
          related_entity_name: string | null
          related_person_name: string | null
          signal_category: string
          signal_description: string | null
          signal_title: string
          source_name: string
          source_type: string | null
          source_url: string | null
          updated_at: string
          verification_status: string
          year: number | null
        }
        Insert: {
          amount?: number | null
          company_id: string
          confidence_label?: string
          confidence_score?: number
          created_at?: string
          evidence_json?: Json | null
          id?: string
          issue_area: string
          matched_entity_type?: string | null
          related_entity_name?: string | null
          related_person_name?: string | null
          signal_category: string
          signal_description?: string | null
          signal_title: string
          source_name?: string
          source_type?: string | null
          source_url?: string | null
          updated_at?: string
          verification_status?: string
          year?: number | null
        }
        Update: {
          amount?: number | null
          company_id?: string
          confidence_label?: string
          confidence_score?: number
          created_at?: string
          evidence_json?: Json | null
          id?: string
          issue_area?: string
          matched_entity_type?: string | null
          related_entity_name?: string | null
          related_person_name?: string | null
          signal_category?: string
          signal_description?: string | null
          signal_title?: string
          source_name?: string
          source_type?: string | null
          source_url?: string | null
          updated_at?: string
          verification_status?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "values_check_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      warn_sync_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_synced_at: string
          records_fetched: number | null
          records_inserted: number | null
          records_updated: number | null
          source_name: string
          source_type: string
          source_url: string | null
          state: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced_at?: string
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          source_name: string
          source_type: string
          source_url?: string | null
          state?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_synced_at?: string
          records_fetched?: number | null
          records_inserted?: number | null
          records_updated?: number | null
          source_name?: string
          source_type?: string
          source_url?: string | null
          state?: string | null
          status?: string
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
