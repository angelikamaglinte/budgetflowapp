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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
