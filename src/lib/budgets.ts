import { startOfMonth, endOfMonth } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import { computeBucketSplit } from '@/lib/payoutBuckets'
import type { BudgetCategory, Expense, Invoice, PayoutBucket } from '@/types'

// source_type === 'expense' sums matching expenses in the month; 'bucket'
// re-runs the same per-invoice split shown on the Dashboard and sums the
// target bucket's share across every invoice paid within the month.
export function computeBudgetActual(
  budget: BudgetCategory,
  expenses: Expense[],
  invoices: Invoice[],
  buckets: PayoutBucket[],
  monthDate: Date
): number {
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)

  if (budget.source_type === 'expense') {
    return expenses
      .filter((e) => e.category === budget.expense_category)
      .filter((e) => {
        const d = parseLocalDate(e.date)
        return d >= start && d <= end
      })
      .reduce((sum, e) => sum + e.amount, 0)
  }

  if (!budget.bucket_id) return 0

  return invoices
    .filter((inv) => inv.status === 'paid' && inv.date_paid)
    .filter((inv) => {
      const d = parseLocalDate(inv.date_paid!)
      return d >= start && d <= end
    })
    .reduce((sum, inv) => {
      const split = computeBucketSplit(inv.amount, buckets)
      const entry = split.find((s) => s.bucket.id === budget.bucket_id)
      return sum + (entry?.amount ?? 0)
    }, 0)
}

export interface BudgetProgress {
  actual: number
  remaining: number
  percentUsed: number
  status: 'ok' | 'warning' | 'over'
}

export function computeBudgetProgress(target: number, actual: number): BudgetProgress {
  const percentUsed = target > 0 ? (actual / target) * 100 : 0
  const status: BudgetProgress['status'] = actual > target ? 'over' : percentUsed >= 80 ? 'warning' : 'ok'
  return {
    actual,
    remaining: target - actual,
    percentUsed,
    status,
  }
}
