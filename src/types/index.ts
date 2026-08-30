import type { Database } from './database'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type Receipt = Database['public']['Tables']['receipts']['Row']
export type ReceiptInsert = Database['public']['Tables']['receipts']['Insert']

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export type PurchasePlan = Database['public']['Tables']['purchase_plans']['Row']
export type PurchasePlanInsert = Database['public']['Tables']['purchase_plans']['Insert']
export type PurchasePlanUpdate = Database['public']['Tables']['purchase_plans']['Update']

export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type PayoutBucket = Database['public']['Tables']['payout_buckets']['Row']
export type PayoutBucketInsert = Database['public']['Tables']['payout_buckets']['Insert']
export type PayoutBucketUpdate = Database['public']['Tables']['payout_buckets']['Update']

export type InvoiceReminder = Database['public']['Tables']['invoice_reminders']['Row']
export type InvoiceReminderInsert = Database['public']['Tables']['invoice_reminders']['Insert']
export type InvoiceReminderUpdate = Database['public']['Tables']['invoice_reminders']['Update']

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']
export type NoteUpdate = Database['public']['Tables']['notes']['Update']

export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row']
export type BusinessProfileInsert = Database['public']['Tables']['business_profiles']['Insert']

export interface PdfLineItem {
  description: string
  date_start: string | null
  date_end: string | null
  qty: number
  rate: number
}

export type PdfInvoiceRow = Database['public']['Tables']['pdf_invoices']['Row']
export type PdfInvoice = Omit<PdfInvoiceRow, 'line_items'> & { line_items: PdfLineItem[] }
export type PdfInvoiceInsert = Omit<Database['public']['Tables']['pdf_invoices']['Insert'], 'line_items'> & {
  line_items: PdfLineItem[]
}
export type PdfInvoiceUpdate = Omit<Database['public']['Tables']['pdf_invoices']['Update'], 'line_items'> & {
  line_items?: PdfLineItem[]
}

export type RecurringExpense = Database['public']['Tables']['recurring_expenses']['Row']
export type RecurringExpenseInsert = Database['public']['Tables']['recurring_expenses']['Insert']
export type RecurringExpenseUpdate = Database['public']['Tables']['recurring_expenses']['Update']

export interface RecurringLineItem {
  description: string
  qty: number
  rate: number
}

export type RecurringInvoiceRow = Database['public']['Tables']['recurring_invoices']['Row']
export type RecurringInvoice = Omit<RecurringInvoiceRow, 'line_items'> & { line_items: RecurringLineItem[] }
export type RecurringInvoiceInsert = Omit<Database['public']['Tables']['recurring_invoices']['Insert'], 'line_items'> & {
  line_items: RecurringLineItem[]
}
export type RecurringInvoiceUpdate = Omit<Database['public']['Tables']['recurring_invoices']['Update'], 'line_items'> & {
  line_items?: RecurringLineItem[]
}

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type ExpenseType = 'business' | 'personal'
export type FileCategory = 'contract' | 'invoice' | 'receipt' | 'other'

export const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  business: 'bg-[#E9F3F7] text-[#487CA5]',
  personal: 'bg-[#F9F2F5] text-[#B35488]',
}

export const EXPENSE_CATEGORIES = [
  'Software',
  'Office',
  'Transport',
  'Food & Dining',
  'Meals & Entertainment',
  'Marketing',
  'Equipment',
  'Education',
  'Utilities',
  'Phone & Internet',
  'Family Support',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// Category colors follow Notion's 9-color muted tag system (verified hex, light-mode
// text/bg pairs). 12 categories share 9 colors — Blue, Pink, and Gray are each reused
// once for categories unlikely to appear side by side often.
export const CATEGORY_COLORS: Record<string, string> = {
  Software: 'bg-[#E9F3F7] text-[#487CA5]', // Blue
  Office: 'bg-[#F1F1EF] text-[#787774]', // Gray
  Transport: 'bg-[#F3EEEE] text-[#976D57]', // Brown
  'Food & Dining': 'bg-[#EEF3ED] text-[#548164]', // Green
  'Meals & Entertainment': 'bg-[#F8ECDF] text-[#CC782F]', // Orange
  Marketing: 'bg-[#F9F2F5] text-[#B35488]', // Pink
  Equipment: 'bg-[#FAF3DD] text-[#C29343]', // Yellow
  Education: 'bg-[#F6F3F8] text-[#8A67AB]', // Purple
  Utilities: 'bg-[#FAECEC] text-[#C4554D]', // Red
  'Phone & Internet': 'bg-[#E9F3F7] text-[#487CA5]', // Blue (reuse)
  'Family Support': 'bg-[#F9F2F5] text-[#B35488]', // Pink (reuse)
  Other: 'bg-[#F1F1EF] text-[#787774]', // Gray (reuse)
}

// Parallel hex map for recharts fills (same Notion palette, text-color values)
export const CATEGORY_CHART_COLORS: Record<string, string> = {
  Software: '#487CA5',
  Office: '#787774',
  Transport: '#976D57',
  'Food & Dining': '#548164',
  'Meals & Entertainment': '#CC782F',
  Marketing: '#B35488',
  Equipment: '#C29343',
  Education: '#8A67AB',
  Utilities: '#C4554D',
  'Phone & Internet': '#487CA5',
  'Family Support': '#B35488',
  Other: '#787774',
}

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: 'bg-[#FAF3DD] text-[#C29343]', // Yellow
  paid: 'bg-[#EEF3ED] text-[#548164]', // Green
  overdue: 'bg-[#FAECEC] text-[#C4554D]', // Red
}

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  contract: 'Contract',
  invoice: 'Invoice',
  receipt: 'Receipt',
  other: 'Other',
}

export const FILE_CATEGORY_COLORS: Record<FileCategory, string> = {
  contract: 'bg-[#F6F3F8] text-[#8A67AB]', // Purple
  invoice: 'bg-[#E9F3F7] text-[#487CA5]', // Blue
  receipt: 'bg-[#EEF3ED] text-[#548164]', // Green
  other: 'bg-[#F1F1EF] text-[#787774]', // Gray
}
