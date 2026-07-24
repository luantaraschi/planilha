export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      ai_agent_settings: {
        Row: {
          api_key_auth_tag: string | null
          api_key_hint: string | null
          api_key_iv: string | null
          created_at: string
          enabled: boolean
          encrypted_api_key: string | null
          instructions: string
          model: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_auth_tag?: string | null
          api_key_hint?: string | null
          api_key_iv?: string | null
          created_at?: string
          enabled?: boolean
          encrypted_api_key?: string | null
          instructions?: string
          model?: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_auth_tag?: string | null
          api_key_hint?: string | null
          api_key_iv?: string | null
          created_at?: string
          enabled?: boolean
          encrypted_api_key?: string | null
          instructions?: string
          model?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
          occurred_at: string
          result: string
          user_id: string
        }
        Insert: {
          action: string
          actor: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
          occurred_at?: string
          result: string
          user_id: string
        }
        Update: {
          action?: string
          actor?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
          occurred_at?: string
          result?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount_cents: number
          category_id: string | null
          created_at: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category_id?: string | null
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          category_id?: string | null
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      expenses: {
        Row: {
          active: boolean
          amount: number
          category: string
          created_at: string
          description: string
          due_day: number | null
          expense_date: string
          expense_type: string
          id: string
          import_fingerprint: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          category: string
          created_at?: string
          description: string
          due_day?: number | null
          expense_date: string
          expense_type: string
          id?: string
          import_fingerprint?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_day?: number | null
          expense_date?: string
          expense_type?: string
          id?: string
          import_fingerprint?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_type: string
          active: boolean
          created_at: string
          id: string
          name: string
          opening_balance_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          active?: boolean
          created_at?: string
          id?: string
          name: string
          opening_balance_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          opening_balance_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          active: boolean
          category_type: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          category_type: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          category_type?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          created_at: string
          id: string
          name: string
          saved_cents: number
          status: string
          target_cents: number
          target_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          saved_cents?: number
          status?: string
          target_cents: number
          target_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          saved_cents?: number
          status?: string
          target_cents?: number
          target_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      import_batch_rows: {
        Row: {
          batch_id: string
          created_at: string
          description: string
          id: string
          import_fingerprint: string
          occurred_on: string | null
          review_status: string
          row_number: number
          signed_amount_cents: number
          transaction_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          description: string
          id?: string
          import_fingerprint: string
          occurred_on?: string | null
          review_status: string
          row_number: number
          signed_amount_cents: number
          transaction_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          description?: string
          id?: string
          import_fingerprint?: string
          occurred_on?: string | null
          review_status?: string
          row_number?: number
          signed_amount_cents?: number
          transaction_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batch_rows_batch_id_user_id_fkey"
            columns: ["batch_id", "user_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "import_batch_rows_transaction_id_user_id_fkey"
            columns: ["transaction_id", "user_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      import_batches: {
        Row: {
          account_id: string
          created_at: string
          duplicate_count: number
          file_name: string
          file_type: string
          id: string
          imported_count: number
          row_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          duplicate_count?: number
          file_name: string
          file_type: string
          id?: string
          imported_count?: number
          row_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          duplicate_count?: number
          file_name?: string
          file_type?: string
          id?: string
          imported_count?: number
          row_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      preferences: {
        Row: {
          ai_processing_consent: boolean
          created_at: string
          currency: string
          email_reminders: boolean
          locale: string
          timezone: string
          updated_at: string
          user_id: string
          week_starts_on: number
        }
        Insert: {
          ai_processing_consent?: boolean
          created_at?: string
          currency?: string
          email_reminders?: boolean
          locale?: string
          timezone?: string
          updated_at?: string
          user_id: string
          week_starts_on?: number
        }
        Update: {
          ai_processing_consent?: boolean
          created_at?: string
          currency?: string
          email_reminders?: boolean
          locale?: string
          timezone?: string
          updated_at?: string
          user_id?: string
          week_starts_on?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_entries: {
        Row: {
          account_id: string
          active: boolean
          amount_cents: number
          category_id: string | null
          created_at: string
          description: string
          frequency: string
          id: string
          next_due_on: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          active?: boolean
          amount_cents: number
          category_id?: string | null
          created_at?: string
          description: string
          frequency: string
          id?: string
          next_due_on: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          active?: boolean
          amount_cents?: number
          category_id?: string | null
          created_at?: string
          description?: string
          frequency?: string
          id?: string
          next_due_on?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_entries_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "recurring_entries_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount_cents: number
          category_id: string | null
          created_at: string
          description: string
          due_on: string | null
          id: string
          import_batch_id: string | null
          import_fingerprint: string | null
          occurred_on: string
          source: string
          status: string
          transaction_type: string
          transfer_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          category_id?: string | null
          created_at?: string
          description: string
          due_on?: string | null
          id?: string
          import_batch_id?: string | null
          import_fingerprint?: string | null
          occurred_on: string
          source?: string
          status: string
          transaction_type: string
          transfer_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          category_id?: string | null
          created_at?: string
          description?: string
          due_on?: string | null
          id?: string
          import_batch_id?: string | null
          import_fingerprint?: string | null
          occurred_on?: string
          source?: string
          status?: string
          transaction_type?: string
          transfer_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_user_id_fkey"
            columns: ["account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_category_id_user_id_fkey"
            columns: ["category_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_import_batch_id_user_id_fkey"
            columns: ["import_batch_id", "user_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_user_id_fkey"
            columns: ["transfer_account_id", "user_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_onboarding: {
        Args: {
          ai_consent_input: boolean
          display_name_input: string
          email_reminders_input: boolean
          timezone_input: string
        }
        Returns: undefined
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
