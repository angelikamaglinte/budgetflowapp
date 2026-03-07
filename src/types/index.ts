import type { Database } from './database'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type Receipt = Database['public']['Tables']['receipts']['Row']
export type ReceiptInsert = Database['public']['Tables']['receipts']['Insert']

export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type ExpenseType = 'business' | 'personal'

export const EXPENSE_TYPE_COLORS: Record<ExpenseType, string> = {
  business: 'bg-blue-50 text-blue-700',
  personal: 'bg-pink-50 text-pink-700',
}

export const EXPENSE_CATEGORIES = [
  'Software',
  'Office',
  'Transport',
  'Food & Dining',
  'Marketing',
  'Equipment',
  'Education',
  'Utilities',
  'Phone & Internet',
  'Family Support',
  'Other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const CATEGORY_COLORS: Record<string, string> = {
  Software: 'bg-blue-100 text-blue-700',
  Office: 'bg-blue-100 text-blue-700',
  Transport: 'bg-sky-100 text-sky-700',
  'Food & Dining': 'bg-green-100 text-green-700',
  Marketing: 'bg-orange-100 text-orange-700',
  Equipment: 'bg-amber-100 text-amber-700',
  Education: 'bg-teal-100 text-teal-700',
  Utilities: 'bg-cyan-100 text-cyan-700',
  'Phone & Internet': 'bg-violet-100 text-violet-700',
  'Family Support': 'bg-rose-100 text-rose-700',
  Other: 'bg-gray-100 text-gray-700',
}

export const CATEGORY_CHART_COLORS: Record<string, string> = {
  Software: '#8b5cf6',
  Office: '#3b82f6',
  Transport: '#0ea5e9',
  'Food & Dining': '#22c55e',
  Marketing: '#f97316',
  Equipment: '#f59e0b',
  Education: '#14b8a6',
  Utilities: '#06b6d4',
  'Phone & Internet': '#7c3aed',
  'Family Support': '#f43f5e',
  Other: '#9ca3af',
}

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}
