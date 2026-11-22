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
      company_follows: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_follows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          company: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          company: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          company?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          city: string
          company_id: string
          content_hash: string | null
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
          content_hash?: string | null
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
          content_hash?: string | null
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
      profiles: {
        Row: {
          account_type: string
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          account_type?: string
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          account_type?: string
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          id: string
          job_id: string
          notes: string | null
          saved_at: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          job_id: string
          notes?: string | null
          saved_at?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          job_id?: string
          notes?: string | null
          saved_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_runs: {
        Row: {
          companies_checked: number
          errors: Json
          finished_at: string | null
          id: string
          jobs_closed: number
          jobs_new: number
          jobs_updated: number
          started_at: string
        }
        Insert: {
          companies_checked?: number
          errors?: Json
          finished_at?: string | null
          id?: string
          jobs_closed?: number
          jobs_new?: number
          jobs_updated?: number
          started_at?: string
        }
        Update: {
          companies_checked?: number
          errors?: Json
          finished_at?: string | null
          id?: string
          jobs_closed?: number
          jobs_new?: number
          jobs_updated?: number
          started_at?: string
        }
        Relationships: []
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
      student_profiles: {
        Row: {
          cities: string[]
          cv_consent_at: string | null
          cv_path: string | null
          fields: string[]
          grad_year: number | null
          looking_for: string[]
          onboarded: boolean
          programme: string | null
          study_level: string | null
          university: string | null
          updated_at: string
          user_id: string
          visible_to_companies: boolean
          work_modes: string[]
        }
        Insert: {
          cities?: string[]
          cv_consent_at?: string | null
          cv_path?: string | null
          fields?: string[]
          grad_year?: number | null
          looking_for?: string[]
          onboarded?: boolean
          programme?: string | null
          study_level?: string | null
          university?: string | null
          updated_at?: string
          user_id: string
          visible_to_companies?: boolean
          work_modes?: string[]
        }
        Update: {
          cities?: string[]
          cv_consent_at?: string | null
          cv_path?: string | null
          fields?: string[]
          grad_year?: number | null
          looking_for?: string[]
          onboarded?: boolean
          programme?: string | null
          study_level?: string | null
          university?: string | null
          updated_at?: string
          user_id?: string
          visible_to_companies?: boolean
          work_modes?: string[]
        }
        Relationships: []
      }
      student_skills: {
        Row: {
          id: string
          level: string
          skill: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: string
          skill: string
          user_id: string
        }
        Update: {
          id?: string
          level?: string
          skill?: string
          user_id?: string
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "company" | "student"
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
    Enums: {
      app_role: ["admin", "company", "student"],
    },
  },
} as const
