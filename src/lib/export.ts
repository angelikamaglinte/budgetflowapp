import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import type { Expense, Invoice } from '@/types'
import { parseLocalDate } from '@/lib/utils'

function saveWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename)
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function exportExpenses(expenses: Expense[], label = 'All') {
  const rows = expenses.map((e) => ({
    Date: format(parseLocalDate(e.date), 'MM/dd/yyyy'),
    Title: e.title,
    Vendor: e.vendor ?? '',
    Category: e.category,
    Type: e.type === 'business' ? 'Business' : 'Personal',
    Amount: e.amount,
    Notes: e.notes ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 30 }, // Title
    { wch: 22 }, // Vendor
    { wch: 16 }, // Category
    { wch: 10 }, // Type
    { wch: 12 }, // Amount
    { wch: 30 }, // Notes
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `${label} Expenses`)

  const date = format(new Date(), 'yyyy-MM-dd')
  saveWorkbook(wb, `expenses-${label.toLowerCase()}-${date}.xlsx`)
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export function exportInvoices(invoices: Invoice[]) {
  const rows = invoices.map((inv) => ({
    'Invoice #': inv.invoice_number,
    Client: inv.client_name,
    'Client Email': inv.client_email ?? '',
    'Issue Date': format(parseLocalDate(inv.issue_date), 'MM/dd/yyyy'),
    'Due Date': inv.due_date ? format(parseLocalDate(inv.due_date), 'MM/dd/yyyy') : '',
    Status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
    Amount: inv.amount,
    Notes: inv.notes ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 14 }, // Invoice #
    { wch: 24 }, // Client
    { wch: 28 }, // Client Email
    { wch: 12 }, // Issue Date
    { wch: 12 }, // Due Date
    { wch: 10 }, // Status
    { wch: 12 }, // Amount
    { wch: 30 }, // Notes
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices')

  const date = format(new Date(), 'yyyy-MM-dd')
  saveWorkbook(wb, `invoices-${date}.xlsx`)
}

// ─── Tax Summary (multi-sheet) ────────────────────────────────────────────────

export function exportTaxSummary(expenses: Expense[], invoices: Invoice[], year?: number) {
  const targetYear = year ?? new Date().getFullYear()
  const wb = XLSX.utils.book_new()

  const yearExpenses = expenses.filter((e) => parseLocalDate(e.date).getFullYear() === targetYear)
  const yearInvoices = invoices.filter((i) => new Date(i.issue_date).getFullYear() === targetYear)

  // Sheet 1: Business Expenses
  const bizRows = yearExpenses
    .filter((e) => e.type === 'business')
    .map((e) => ({
      Date: format(parseLocalDate(e.date), 'MM/dd/yyyy'),
      Title: e.title,
      Vendor: e.vendor ?? '',
      Category: e.category,
      Amount: e.amount,
      Notes: e.notes ?? '',
    }))

  const bizTotal = bizRows.reduce((s, r) => s + r.Amount, 0)
  bizRows.push({ Date: '', Title: '', Vendor: '', Category: 'TOTAL', Amount: bizTotal, Notes: '' })

  const wsB = XLSX.utils.json_to_sheet(bizRows)
  wsB['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsB, 'Business Expenses')

  // Sheet 2: Personal Expenses
  const perRows = yearExpenses
    .filter((e) => e.type === 'personal')
    .map((e) => ({
      Date: format(parseLocalDate(e.date), 'MM/dd/yyyy'),
      Title: e.title,
      Vendor: e.vendor ?? '',
      Category: e.category,
      Amount: e.amount,
      Notes: e.notes ?? '',
    }))

  const perTotal = perRows.reduce((s, r) => s + r.Amount, 0)
  perRows.push({ Date: '', Title: '', Vendor: '', Category: 'TOTAL', Amount: perTotal, Notes: '' })

  const wsP = XLSX.utils.json_to_sheet(perRows)
  wsP['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsP, 'Personal Expenses')

  // Sheet 3: Invoices
  const invRows = yearInvoices.map((inv) => ({
    'Invoice #': inv.invoice_number,
    Client: inv.client_name,
    'Issue Date': format(parseLocalDate(inv.issue_date), 'MM/dd/yyyy'),
    'Due Date': inv.due_date ? format(parseLocalDate(inv.due_date), 'MM/dd/yyyy') : '',
    Status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1),
    Amount: inv.amount,
  }))

  const totalPaid = yearInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = yearInvoices.filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)
  invRows.push(
    { 'Invoice #': '', Client: '', 'Issue Date': '', 'Due Date': '', Status: 'TOTAL PAID', Amount: totalPaid },
    { 'Invoice #': '', Client: '', 'Issue Date': '', 'Due Date': '', Status: 'TOTAL PENDING', Amount: totalPending },
  )

  const wsI = XLSX.utils.json_to_sheet(invRows)
  wsI['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsI, 'Invoices')

  // Sheet 4: P&L Summary
  const months = Array.from({ length: 12 }, (_, i) => {
    const label = new Date(targetYear, i, 1).toLocaleString('default', { month: 'long' })
    const income = yearInvoices
      .filter((inv) => inv.status === 'paid' && parseLocalDate(inv.issue_date).getMonth() === i)
      .reduce((s, inv) => s + inv.amount, 0)
    const biz = yearExpenses
      .filter((e) => e.type === 'business' && parseLocalDate(e.date).getMonth() === i)
      .reduce((s, e) => s + e.amount, 0)
    const per = yearExpenses
      .filter((e) => e.type === 'personal' && parseLocalDate(e.date).getMonth() === i)
      .reduce((s, e) => s + e.amount, 0)
    return {
      Month: label,
      Income: income,
      'Business Expenses': biz,
      'Personal Expenses': per,
      'Net Profit': income - biz,
    }
  })

  const wsS = XLSX.utils.json_to_sheet(months)
  wsS['!cols'] = [{ wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsS, `${targetYear} Summary`)

  saveWorkbook(wb, `tax-summary-${targetYear}.xlsx`)
}
