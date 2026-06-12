export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      books: {
        Row: {
          created_at: string
          currency: string
          custom_categories: Json | null
          id: string
          name: string
          owner_id: string
          settled_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          custom_categories?: Json | null
          id?: string
          name: string
          owner_id: string
          settled_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          custom_categories?: Json | null
          id?: string
          name?: string
          owner_id?: string
          settled_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          amount: number
          created_at: string
          expense_id: string
          id: string
          member_id: string
          shares: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          expense_id: string
          id?: string
          member_id: string
          shares?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          expense_id?: string
          id?: string
          member_id?: string
          shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          book_id: string
          category: string
          created_at: string
          date: string
          id: string
          payer_member_id: string
          split_mode: Database["public"]["Enums"]["split_mode"]
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          book_id: string
          category?: string
          created_at?: string
          date: string
          id?: string
          payer_member_id: string
          split_mode: Database["public"]["Enums"]["split_mode"]
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          book_id?: string
          category?: string
          created_at?: string
          date?: string
          id?: string
          payer_member_id?: string
          split_mode?: Database["public"]["Enums"]["split_mode"]
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payer_member_id_fkey"
            columns: ["payer_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          book_id: string
          created_at: string
          display_name: string
          id: string
          profile_id: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          display_name: string
          id?: string
          profile_id?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          display_name?: string
          id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          line_user_id: string | null
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          display_name: string
          id: string
          line_user_id?: string | null
        }
        Update: {
          avatar_url?: string
          created_at?: string
          display_name?: string
          id?: string
          line_user_id?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          book_id: string
          created_at: string
          exchange_rate: number | null
          id: string
          payer_member_id: string
          receiver_member_id: string
          settlement_currency: string | null
        }
        Insert: {
          amount: number
          book_id: string
          created_at?: string
          exchange_rate?: number | null
          id?: string
          payer_member_id: string
          receiver_member_id: string
          settlement_currency?: string | null
        }
        Update: {
          amount?: number
          book_id?: string
          created_at?: string
          exchange_rate?: number | null
          id?: string
          payer_member_id?: string
          receiver_member_id?: string
          settlement_currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settlements_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_payer_member_id_fkey"
            columns: ["payer_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_receiver_member_id_fkey"
            columns: ["receiver_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_expense_with_category: {
        Args: {
          p_amount: number
          p_book_id: string
          p_category: string
          p_date: string
          p_payer_member_id: string
          p_pending_category?: Json
          p_split_mode: Database["public"]["Enums"]["split_mode"]
          p_splits: Json
          p_time: string
          p_title: string
        }
        Returns: string
      }
      get_book_bundle: { Args: { p_book_id: string }; Returns: Json }
      is_book_member: { Args: { book_id: string }; Returns: boolean }
      is_book_owner: { Args: { book_id: string }; Returns: boolean }
      update_expense_with_category: {
        Args: {
          p_amount: number
          p_book_id: string
          p_category: string
          p_date: string
          p_expense_id: string
          p_payer_member_id: string
          p_pending_category?: Json
          p_split_mode: Database["public"]["Enums"]["split_mode"]
          p_splits: Json
          p_time: string
          p_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      split_mode: "equal" | "custom"
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      split_mode: ["equal", "custom"],
    },
  },
} as const
