export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string
          user_id: string
          date: string
          title: string
          vendor: string | null
          category: string
          type: string
          amount: number
          notes: string | null
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          date: string
          title: string
          vendor?: string | null
          category: string
          type?: string
          amount: number
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          title?: string
          vendor?: string | null
          category?: string
          type?: string
          amount?: number
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string
          client_name: string
          client_email: string | null
          amount: number
          status: string
          issue_date: string
          due_date: string | null
          date_paid: string | null
          notes: string | null
          tax_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          invoice_number: string
          client_name: string
          client_email?: string | null
          amount: number
          status?: string
          issue_date: string
          due_date?: string | null
          date_paid?: string | null
          notes?: string | null
          tax_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_number?: string
          client_name?: string
          client_email?: string | null
          amount?: number
          status?: string
          issue_date?: string
          due_date?: string | null
          date_paid?: string | null
          notes?: string | null
          tax_rate?: number | null
          created_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          filename: string
          storage_path: string
          public_url: string
          expense_id: string | null
          uploaded_at: string
          category: string
        }
        Insert: {
          id?: string
          user_id?: string
          filename: string
          storage_path: string
          public_url: string
          expense_id?: string | null
          uploaded_at?: string
          category?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          storage_path?: string
          public_url?: string
          expense_id?: string | null
          uploaded_at?: string
          category?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      recurring_expenses: {
        Row: {
          id: string
          user_id: string
          title: string
          vendor: string | null
          category: string
          type: string
          amount: number
          day_of_month: number
          notes: string | null
          active: boolean
          last_run_period: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          vendor?: string | null
          category: string
          type?: string
          amount: number
          day_of_month: number
          notes?: string | null
          active?: boolean
          last_run_period?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          vendor?: string | null
          category?: string
          type?: string
          amount?: number
          day_of_month?: number
          notes?: string | null
          active?: boolean
          last_run_period?: string | null
          created_at?: string
        }
      }
      recurring_invoices: {
        Row: {
          id: string
          user_id: string
          client_name: string
          client_company: string | null
          client_address: string | null
          terms: string | null
          tax_rate: number
          thank_you_note: string | null
          line_items: Json
          invoice_number_prefix: string
          next_sequence: number
          due_in_days: number | null
          day_of_month: number
          active: boolean
          last_run_period: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_name: string
          client_company?: string | null
          client_address?: string | null
          terms?: string | null
          tax_rate?: number
          thank_you_note?: string | null
          line_items?: Json
          invoice_number_prefix?: string
          next_sequence?: number
          due_in_days?: number | null
          day_of_month: number
          active?: boolean
          last_run_period?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_name?: string
          client_company?: string | null
          client_address?: string | null
          terms?: string | null
          tax_rate?: number
          thank_you_note?: string | null
          line_items?: Json
          invoice_number_prefix?: string
          next_sequence?: number
          due_in_days?: number | null
          day_of_month?: number
          active?: boolean
          last_run_period?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          message: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          link?: string | null
          read?: boolean
          created_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      business_profiles: {
        Row: {
          user_id: string
          business_name: string | null
          address: string | null
          phone: string | null
          email: string | null
          province: string | null
          tax_rate: number
          savings_rate: number
          gst_registered: boolean
          gst_rate: number | null
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          user_id?: string
          business_name?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          province?: string | null
          tax_rate?: number
          savings_rate?: number
          gst_registered?: boolean
          gst_rate?: number | null
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          business_name?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          province?: string | null
          tax_rate?: number
          savings_rate?: number
          gst_registered?: boolean
          gst_rate?: number | null
          onboarding_completed?: boolean
          updated_at?: string
        }
      }
      pdf_invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string
          invoice_date: string
          due_date: string | null
          terms: string | null
          client_name: string
          client_company: string | null
          client_address: string | null
          tax_rate: number
          thank_you_note: string | null
          line_items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          invoice_number: string
          invoice_date: string
          due_date?: string | null
          terms?: string | null
          client_name: string
          client_company?: string | null
          client_address?: string | null
          tax_rate?: number
          thank_you_note?: string | null
          line_items?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_number?: string
          invoice_date?: string
          due_date?: string | null
          terms?: string | null
          client_name?: string
          client_company?: string | null
          client_address?: string | null
          tax_rate?: number
          thank_you_note?: string | null
          line_items?: Json
          created_at?: string
          updated_at?: string
        }
      }
      invoice_reminders: {
        Row: {
          id: string
          user_id: string
          client_name: string
          reminder_day: number
          notes: string | null
          dismissed_period: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          client_name: string
          reminder_day: number
          notes?: string | null
          dismissed_period?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_name?: string
          reminder_day?: number
          notes?: string | null
          dismissed_period?: string | null
          created_at?: string
        }
      }
      purchase_plans: {
        Row: {
          id: string
          user_id: string
          item_name: string
          price: number
          target_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          item_name: string
          price: number
          target_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_name?: string
          price?: number
          target_date?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          due_date: string | null
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          due_date?: string | null
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          due_date?: string | null
          completed?: boolean
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
