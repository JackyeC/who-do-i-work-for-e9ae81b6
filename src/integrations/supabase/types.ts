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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
