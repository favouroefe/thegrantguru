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
      funds: {
        Row: {
          amount_far_eur: number | null
          amount_max_eur: number | null
          amount_text: string
          amount_varies: boolean
          apply_url: string
          category: string
          colleges: string[]
          created_at: string
          deadline: string | null
          description: string
          documents_needed: string[]
          how_to_apply_steps: string[]
          id: string
          name: string
          open_to_tags: string[]
          provider: string
          requires_any_tags: string[]
          requires_tags: string[]
          subcategory: string[]
          verified: boolean
        }
        Insert: {
          amount_far_eur?: number | null
          amount_max_eur?: number | null
          amount_text: string
          amount_varies?: boolean
          apply_url: string
          category: string
          colleges?: string[]
          created_at?: string
          deadline?: string | null
          description?: string
          documents_needed?: string[]
          how_to_apply_steps?: string[]
          id: string
          name: string
          open_to_tags?: string[]
          provider: string
          requires_any_tags?: string[]
          requires_tags?: string[]
          subcategory?: string[]
          verified?: boolean
        }
        Update: {
          amount_far_eur?: number | null
          amount_max_eur?: number | null
          amount_text?: string
          amount_varies?: boolean
          apply_url?: string
          category?: string
          colleges?: string[]
          created_at?: string
          deadline?: string | null
          description?: string
          documents_needed?: string[]
          how_to_apply_steps?: string[]
          id?: string
          name?: string
          open_to_tags?: string[]
          provider?: string
          requires_any_tags?: string[]
          requires_tags?: string[]
          subcategory?: string[]
          verified?: boolean
        }
        Relationships: []
      }
      grants: {
        Row: {
          amount_max_eur: number
          amount_text: string
          apply_url: string
          audience_tags: string[]
          criteria: Json
          deadline: string | null
          description: string
          documents_needed: string[]
          id: string
          name: string
          provider: string
          type: string
        }
        Insert: {
          amount_max_eur?: number
          amount_text: string
          apply_url: string
          audience_tags?: string[]
          criteria?: Json
          deadline?: string | null
          description?: string
          documents_needed?: string[]
          id: string
          name: string
          provider: string
          type: string
        }
        Update: {
          amount_max_eur?: number
          amount_text?: string
          apply_url?: string
          audience_tags?: string[]
          criteria?: Json
          deadline?: string | null
          description?: string
          documents_needed?: string[]
          id?: string
          name?: string
          provider?: string
          type?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          results: Json
          user_id: string
          web_results: Json | null
        }
        Insert: {
          created_at?: string
          results?: Json
          user_id: string
          web_results?: Json | null
        }
        Update: {
          created_at?: string
          results?: Json
          user_id?: string
          web_results?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          answers: Json | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          answers?: Json | null
          id: string
          name?: string
          updated_at?: string
        }
        Update: {
          answers?: Json | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_grants: {
        Row: {
          grant_id: string
          saved: boolean
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          grant_id: string
          saved?: boolean
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          grant_id?: string
          saved?: boolean
          status?: string | null
          updated_at?: string
          user_id?: string
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
