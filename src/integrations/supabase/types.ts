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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          ats_identifier: string | null
          careers_url: string | null
          cities: string[]
          city: string | null
          consecutive_failures: number
          created_at: string
          description: string | null
          hiring_period: string | null
          id: string
          industry: string | null
          is_watched: boolean
          last_posting_at: string | null
          last_scraped_at: string | null
          last_status: string | null
          lat: number | null
          lng: number | null
          name: string
          org_number: string | null
          scrape_disabled_reason: string | null
          scrape_enabled: boolean
          slug: string
          source_type: string
          tier: number
          typical_roles: string[]
          watch_note: string | null
          website: string | null
        }
        Insert: {
          ats_identifier?: string | null
          careers_url?: string | null
          cities?: string[]
          city?: string | null
          consecutive_failures?: number
          created_at?: string
          description?: string | null
          hiring_period?: string | null
          id?: string
          industry?: string | null
          is_watched?: boolean
          last_posting_at?: string | null
          last_scraped_at?: string | null
          last_status?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          org_number?: string | null
          scrape_disabled_reason?: string | null
          scrape_enabled?: boolean
          slug: string
          source_type?: string
          tier?: number
          typical_roles?: string[]
          watch_note?: string | null
          website?: string | null
        }
        Update: {
          ats_identifier?: string | null
          careers_url?: string | null
          cities?: string[]
          city?: string | null
          consecutive_failures?: number
          created_at?: string
          description?: string | null
          hiring_period?: string | null
          id?: string
          industry?: string | null
          is_watched?: boolean
          last_posting_at?: string | null
          last_scraped_at?: string | null
          last_status?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          org_number?: string | null
          scrape_disabled_reason?: string | null
          scrape_enabled?: boolean
          slug?: string
          source_type?: string
          tier?: number
          typical_roles?: string[]
          watch_note?: string | null
          website?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          city: string
          company_id: string
          created_at: string
          deadline: string | null
          description: string | null
          external_id: string | null
          fields: string[]
          first_seen_at: string
          id: string
          key_requirements: string[]
          last_seen_at: string
          lat: number | null
          lng: number | null
          location_label: string
          looking_for: string
          min_level: string | null
          missed_runs: number
          nice_skills: string[]
          posted_at: string
          required_skills: string[]
          role_type: string
          source: string
          source_url: string | null
          status: string
          summary: string | null
          title: string
          work_mode: string
        }
        Insert: {
          city: string
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          external_id?: string | null
          fields?: string[]
          first_seen_at?: string
          id?: string
          key_requirements?: string[]
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          location_label: string
          looking_for: string
          min_level?: string | null
          missed_runs?: number
          nice_skills?: string[]
          posted_at?: string
          required_skills?: string[]
          role_type: string
          source?: string
          source_url?: string | null
          status?: string
          summary?: string | null
          title: string
          work_mode?: string
        }
        Update: {
          city?: string
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          external_id?: string | null
          fields?: string[]
          first_seen_at?: string
          id?: string
          key_requirements?: string[]
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          location_label?: string
          looking_for?: string
          min_level?: string | null
          missed_runs?: number
          nice_skills?: string[]
          posted_at?: string
          required_skills?: string[]
          role_type?: string
          source?: string
          source_url?: string | null
          status?: string
          summary?: string | null
          title?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category: string
          id: string
          name: string
        }
        Insert: {
          category: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          city: string | null
          country: string
          featured: boolean
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          city?: string | null
          country?: string
          featured?: boolean
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          city?: string | null
          country?: string
          featured?: boolean
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
