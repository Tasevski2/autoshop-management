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
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          customer_type: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          tax_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          customer_type?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string | null
          expense_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string
          notes: string | null
          pdf_storage_path: string | null
          service_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string
          notes?: string | null
          pdf_storage_path?: string | null
          service_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string
          notes?: string | null
          pdf_storage_path?: string | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_totals"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "invoices_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_dismissed: boolean
          message: string | null
          reminder_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_dismissed?: boolean
          message?: string | null
          reminder_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_dismissed?: boolean
          message?: string | null
          reminder_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_catalog: {
        Row: {
          buy_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sell_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sell_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sell_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_catalog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          service_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          service_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_totals"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "payments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          due_date: string
          id: string
          is_active: boolean
          note: string | null
          notify_days_before: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          is_active?: boolean
          note?: string | null
          notify_days_before?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          is_active?: boolean
          note?: string | null
          notify_days_before?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_images: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          id: string
          service_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          service_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          service_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_images_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_totals"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_images_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_parts: {
        Row: {
          buy_price: number
          catalog_part_id: string | null
          created_at: string
          id: string
          name: string
          quantity: number
          sell_price: number
          service_id: string
        }
        Insert: {
          buy_price?: number
          catalog_part_id?: string | null
          created_at?: string
          id?: string
          name: string
          quantity?: number
          sell_price?: number
          service_id: string
        }
        Update: {
          buy_price?: number
          catalog_part_id?: string | null
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          sell_price?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_parts_catalog_part_id_fkey"
            columns: ["catalog_part_id"]
            isOneToOne: false
            referencedRelation: "parts_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_parts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_totals"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_parts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          labor_cost: number
          mileage_at_service: number | null
          notes: string | null
          service_date: string
          status: Database["public"]["Enums"]["service_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          labor_cost?: number
          mileage_at_service?: number | null
          notes?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          labor_cost?: number
          mileage_at_service?: number | null
          notes?: string | null
          service_date?: string
          status?: Database["public"]["Enums"]["service_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          authorized_signer: string | null
          bank_account: string | null
          bank_name: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          next_invoice_number: number
          phone: string | null
          tax_id: string | null
          updated_at: string
          workshop_name: string | null
        }
        Insert: {
          address?: string | null
          authorized_signer?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          next_invoice_number?: number
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          workshop_name?: string | null
        }
        Update: {
          address?: string | null
          authorized_signer?: string | null
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          next_invoice_number?: number
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          workshop_name?: string | null
        }
        Relationships: []
      }
      vehicle_brands: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_brands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_models: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_models_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          chassis_number: string | null
          created_at: string
          customer_id: string
          engine_capacity: number | null
          engine_designation: string | null
          engine_type: string | null
          id: string
          last_known_mileage: number | null
          last_service_id: string | null
          model: string | null
          notes: string | null
          plate_number: string
          updated_at: string
          year: number | null
        }
        Insert: {
          brand: string
          chassis_number?: string | null
          created_at?: string
          customer_id: string
          engine_capacity?: number | null
          engine_designation?: string | null
          engine_type?: string | null
          id?: string
          last_known_mileage?: number | null
          last_service_id?: string | null
          model?: string | null
          notes?: string | null
          plate_number: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string
          chassis_number?: string | null
          created_at?: string
          customer_id?: string
          engine_capacity?: number | null
          engine_designation?: string | null
          engine_type?: string | null
          id?: string
          last_known_mileage?: number | null
          last_service_id?: string | null
          model?: string | null
          notes?: string | null
          plate_number?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_last_service_id_fkey"
            columns: ["last_service_id"]
            isOneToOne: false
            referencedRelation: "service_totals"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "vehicles_last_service_id_fkey"
            columns: ["last_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      service_totals: {
        Row: {
          balance_due: number | null
          labor_cost: number | null
          parts_cost: number | null
          parts_profit: number | null
          parts_total: number | null
          service_id: string | null
          service_total: number | null
          total_paid: number | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      consume_next_invoice_number: { Args: never; Returns: string }
      generate_reminder_notifications: { Args: never; Returns: undefined }
      get_brand_distribution: {
        Args: { p_from: string; p_to: string }
        Returns: {
          brand: string
          count: number
        }[]
      }
      get_customer_rankings: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_page?: number
          p_page_size?: number
          p_sort_column?: string
          p_sort_direction?: string
        }
        Returns: {
          collected: number
          customer_id: string
          full_name: string
          owes: number
          phone: string
          profit: number
          services_count: number
          total_count: number
          total_revenue: number
        }[]
      }
      get_customer_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          active_count: number
          avg_invoice: number
          new_count: number
        }[]
      }
      get_daily_breakdown: {
        Args: { p_from: string; p_to: string }
        Returns: {
          bucket_date: string
          collected: number
          net: number
          operating_expenses: number
          parts_cost: number
          revenue: number
          service_count: number
        }[]
      }
      get_expense_totals: {
        Args: { p_category?: string; p_date_from?: string; p_date_to?: string }
        Returns: {
          category: string
          total: number
        }[]
      }
      get_expenses_by_category: {
        Args: { p_from: string; p_to: string }
        Returns: {
          amount: number
          category: string
        }[]
      }
      get_financial_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          margin: number
          net_profit: number
          operating_expenses: number
          parts_cost: number
          parts_profit: number
          total_collected: number
          total_revenue: number
          uncollected: number
        }[]
      }
      get_next_invoice_number: { Args: never; Returns: string }
      get_part_rankings: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_page?: number
          p_page_size?: number
          p_sort_column?: string
          p_sort_direction?: string
        }
        Returns: {
          buy_cost_total: number
          part_name: string
          profit: number
          qty_sold: number
          sell_total: number
          total_count: number
        }[]
      }
      get_payments_by_method: {
        Args: { p_from: string; p_to: string }
        Returns: {
          amount: number
          method: string
        }[]
      }
      get_revenue_by_bucket: {
        Args: { p_from: string; p_to: string }
        Returns: {
          bucket_date: string
          labor: number
          parts_revenue: number
        }[]
      }
      get_revenue_trend: {
        Args: never
        Returns: {
          distinct_days: number
          month: string
          total_revenue: number
        }[]
      }
      get_services_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_labor: number
          avg_parts_per_service: number
          total_services: number
        }[]
      }
      get_today_expenses: { Args: { p_date: string }; Returns: number }
      get_today_revenue: { Args: { p_date: string }; Returns: number }
      get_total_unpaid: { Args: never; Returns: number }
      get_weekday_utilization: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day_index: number
          service_count: number
          weekday_occurrences: number
        }[]
      }
      get_year_distribution: {
        Args: { p_from: string; p_to: string }
        Returns: {
          count: number
          year_range: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      expense_category:
        | "rent"
        | "utilities"
        | "tools"
        | "salary"
        | "supplies"
        | "maintenance"
        | "insurance"
        | "taxes"
        | "other"
      notification_type: "upcoming_service" | "unpaid_invoice" | "general"
      payment_method: "cash" | "card" | "bank_transfer" | "other"
      service_status:
        | "in_progress"
        | "completed"
        | "invoiced"
        | "partially_paid"
        | "paid"
        | "cancelled"
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
    Enums: {
      expense_category: [
        "rent",
        "utilities",
        "tools",
        "salary",
        "supplies",
        "maintenance",
        "insurance",
        "taxes",
        "other",
      ],
      notification_type: ["upcoming_service", "unpaid_invoice", "general"],
      payment_method: ["cash", "card", "bank_transfer", "other"],
      service_status: [
        "in_progress",
        "completed",
        "invoiced",
        "partially_paid",
        "paid",
        "cancelled",
      ],
    },
  },
} as const

