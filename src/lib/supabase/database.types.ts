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
      event_links: {
        Row: {
          created_at: string
          event_id: string
          id: string
          link_type: string
          linked_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          link_type: string
          linked_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          link_type?: string
          linked_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_links_event_fk"
            columns: ["event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          created_at: string
          ends_at: string
          event_type: string
          external_id: string | null
          id: string
          last_synced_at: string | null
          location: string | null
          notes: string | null
          parent_event_id: string | null
          recurrence_rule: string | null
          source: string
          starts_at: string
          timezone: string
          title: string
          trip_ends_on: string | null
          trip_starts_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          ends_at: string
          event_type?: string
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          location?: string | null
          notes?: string | null
          parent_event_id?: string | null
          recurrence_rule?: string | null
          source?: string
          starts_at: string
          timezone: string
          title: string
          trip_ends_on?: string | null
          trip_starts_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          ends_at?: string
          event_type?: string
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          location?: string | null
          notes?: string | null
          parent_event_id?: string | null
          recurrence_rule?: string | null
          source?: string
          starts_at?: string
          timezone?: string
          title?: string
          trip_ends_on?: string | null
          trip_starts_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_parent_fk"
            columns: ["parent_event_id", "user_id"]
            isOneToOne: false
            referencedRelation: "events"
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
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          occurred_on: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          occurred_on: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          occurred_on?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_fk"
            columns: ["habit_id", "user_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          created_at: string
          days_of_week: number[]
          id: string
          scheduled_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          days_of_week?: number[]
          id?: string
          scheduled_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          days_of_week?: number[]
          id?: string
          scheduled_time?: string
          title?: string
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
          confirmation_key: string
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
          confirmation_key: string
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
          confirmation_key?: string
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
      planning_areas: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      projects: {
        Row: {
          area_id: string | null
          color: string
          created_at: string
          ends_on: string | null
          id: string
          name: string
          notes: string | null
          starts_on: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_id?: string | null
          color?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          name: string
          notes?: string | null
          starts_on?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_id?: string | null
          color?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          name?: string
          notes?: string | null
          starts_on?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_area_fk"
            columns: ["area_id", "user_id"]
            isOneToOne: false
            referencedRelation: "planning_areas"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      recurring_entries: {
        Row: {
          account_id: string
          active: boolean
          amount_cents: number
          category_id: string | null
          created_at: string
          description: string
          due_day: number | null
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
          due_day?: number | null
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
          due_day?: number | null
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
      task_links: {
        Row: {
          created_at: string
          id: string
          link_type: string
          linked_id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type: string
          linked_id: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          linked_id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_links_task_fk"
            columns: ["task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      tasks: {
        Row: {
          carried_from_task_id: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          estimated_minutes: number | null
          id: string
          notes: string | null
          parent_task_id: string | null
          priority: string
          project_id: string | null
          recurrence_rule: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          timezone: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          carried_from_task_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_rule?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          timezone: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          carried_from_task_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          recurrence_rule?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_carried_from_fk"
            columns: ["carried_from_task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_parent_fk"
            columns: ["parent_task_id", "user_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "tasks_project_fk"
            columns: ["project_id", "user_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      confirm_statement_import: {
        Args: {
          account_id_input: string
          confirmation_key_input: string
          file_name_input: string
          file_type_input: string
          rows_input: Json
        }
        Returns: {
          duplicate_count: number
          imported_count: number
        }[]
      }
      planning_occurrences: {
        Args: { window_end: string; window_start: string }
        Returns: {
          all_day: boolean
          ends_at: string
          estimated_minutes: number
          id: string
          kind: string
          last_synced_at: string
          location: string
          parent_event_id: string
          source: string
          source_id: string
          starts_at: string
          title: string
        }[]
      }
      transition_task: {
        Args: { action_input: string; task_id_input: string }
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
