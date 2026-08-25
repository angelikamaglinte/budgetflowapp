import { subMonths, startOfMonth, endOfMonth, differenceInCalendarMonths, addMonths } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import type { Expense, Invoice, PurchasePlan } from '@/types'

export const CALCULATOR_LOOKBACK_MONTHS = 3

export interface MonthlyAverages {
  avgMonthlyIncome: number
  avgMonthlyExpenses: number
  monthsOfDataUsed: number
}

// Averages paid-invoice income and expenses over the trailing N complete
// months (excluding the current, still-in-progress month).
export function computeMonthlyAverages(
  expenses: Expense[],
  invoices: Invoice[],
  today: Date = new Date()
): MonthlyAverages {
  let monthsOfDataUsed = 0
  let incomeSum = 0
  let expenseSum = 0

  for (let i = 1; i <= CALCULATOR_LOOKBACK_MONTHS; i++) {
    const monthDate = subMonths(today, i)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)

    const monthIncome = invoices
      .filter((inv) => inv.status === 'paid' && inv.date_paid)
      .filter((inv) => {
        const d = parseLocalDate(inv.date_paid!)
        return d >= start && d <= end
      })
      .reduce((s, inv) => s + inv.amount, 0)

    const monthExpenses = expenses
      .filter((e) => {
        const d = parseLocalDate(e.date)
        return d >= start && d <= end
      })
      .reduce((s, e) => s + e.amount, 0)

    if (monthIncome > 0 || monthExpenses > 0) {
      monthsOfDataUsed += 1
      incomeSum += monthIncome
      expenseSum += monthExpenses
    }
  }

  return {
    avgMonthlyIncome: monthsOfDataUsed > 0 ? incomeSum / monthsOfDataUsed : 0,
    avgMonthlyExpenses: monthsOfDataUsed > 0 ? expenseSum / monthsOfDataUsed : 0,
    monthsOfDataUsed,
  }
}

export interface PurchaseProgress {
  avgMonthlyLeftover: number
  // Set only when the plan has a target_date
  monthsUntilTarget: number | null
  requiredMonthlyExtra: number | null
  onTrack: boolean | null
  shortfall: number | null
  // Set whenever avgMonthlyLeftover is positive, target date or not
  monthsAtCurrentRate: number | null
  projectedDate: Date | null
}

// Assumes the plan's full price is funded by dedicating the entire average
// monthly leftover (income minus expenses minus everything reserved across
// payout buckets) to it — not divided across other saved plans.
export function computePurchaseProgress(
  plan: Pick<PurchasePlan, 'price' | 'target_date'>,
  averages: MonthlyAverages,
  reservedRate: number,
  today: Date = new Date()
): PurchaseProgress {
  const avgMonthlyLeftover =
    averages.avgMonthlyIncome * (1 - reservedRate / 100) - averages.avgMonthlyExpenses

  let monthsUntilTarget: number | null = null
  let requiredMonthlyExtra: number | null = null
  let onTrack: boolean | null = null
  let shortfall: number | null = null

  if (plan.target_date) {
    monthsUntilTarget = Math.max(1, differenceInCalendarMonths(parseLocalDate(plan.target_date), today))
    requiredMonthlyExtra = plan.price / monthsUntilTarget
    onTrack = avgMonthlyLeftover >= requiredMonthlyExtra
    shortfall = onTrack ? 0 : requiredMonthlyExtra - avgMonthlyLeftover
  }

  let monthsAtCurrentRate: number | null = null
  let projectedDate: Date | null = null
  if (avgMonthlyLeftover > 0) {
    monthsAtCurrentRate = Math.ceil(plan.price / avgMonthlyLeftover)
    projectedDate = addMonths(today, monthsAtCurrentRate)
  }

  return {
    avgMonthlyLeftover,
    monthsUntilTarget,
    requiredMonthlyExtra,
    onTrack,
    shortfall,
    monthsAtCurrentRate,
    projectedDate,
  }
}

export function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
