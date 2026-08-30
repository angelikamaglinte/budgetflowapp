import { startOfMonth, endOfMonth, format } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import { computeBucketSplit } from '@/lib/payoutBuckets'
import type { BucketSplitEntry } from '@/lib/payoutBuckets'
import type { Expense, Invoice, PayoutBucket } from '@/types'

export interface InvoiceSplit {
  invoice: Invoice
  split: BucketSplitEntry[]
}

export interface MonthlySummary {
  invoiceSplits: InvoiceSplit[]
  remainderBucket: PayoutBucket | null
  remainderTotal: number
  monthExpenses: Expense[]
  monthExpensesTotal: number
  leftover: number
}

// Everything here reflects what's already happened this month — no
// projections. "Owner Pay" is whichever bucket is the remainder
// (percentage === null); every expense this month reduces it, business
// and personal alike, since both are real cash leaving the same pool of
// money (a separate question from what reduces taxable income on the Tax tab).
export function computeMonthlySummary(
  invoices: Invoice[],
  expenses: Expense[],
  buckets: PayoutBucket[],
  monthDate: Date
): MonthlySummary {
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)
  const targetMonth = format(monthDate, 'yyyy-MM')

  // budget_month lets the user tag which month's budget a payment counts
  // toward, independent of when it actually landed (date_paid) — a fixed
  // "always N months behind" rule doesn't work since her payment timing
  // straddles month boundaries inconsistently. Falls back to date_paid's
  // own month for invoices that predate this field.
  const paidInvoices = invoices
    .filter((inv) => inv.status === 'paid' && inv.date_paid)
    .filter((inv) => (inv.budget_month ?? inv.date_paid!.slice(0, 7)) === targetMonth)

  const invoiceSplits: InvoiceSplit[] = paidInvoices.map((invoice) => ({
    invoice,
    split: computeBucketSplit(invoice.amount, buckets),
  }))

  const remainderBucket = buckets.find((b) => b.percentage == null) ?? null
  const remainderTotal = remainderBucket
    ? invoiceSplits.reduce((sum, { split }) => {
        const entry = split.find((s) => s.bucket.id === remainderBucket.id)
        return sum + (entry?.amount ?? 0)
      }, 0)
    : 0

  const monthExpenses = expenses.filter((e) => {
    const d = parseLocalDate(e.date)
    return d >= start && d <= end
  })
  const monthExpensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)

  return {
    invoiceSplits,
    remainderBucket,
    remainderTotal,
    monthExpenses,
    monthExpensesTotal,
    leftover: remainderTotal - monthExpensesTotal,
  }
}
