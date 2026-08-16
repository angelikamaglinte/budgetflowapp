import { differenceInCalendarDays, subMonths, addMonths, startOfMonth, endOfMonth, format } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import type { Invoice, Expense, RecurringInvoice } from '@/types'

export const DUE_SOON_DAYS = 7
export const FORECAST_LOOKBACK_MONTHS = 3
export const LATE_PAYER_MIN_SAMPLE = 2
export const LATE_PAYER_THRESHOLD = 0.5

// ─── 1. Invoice aging ───────────────────────────────────────────────────────

export type AgingBucket = 'overdue' | 'due-soon' | 'upcoming' | 'no-due-date'

export interface AgedInvoice {
  invoice: Invoice
  daysOverdue: number
  daysUntilDue: number | null
  bucket: AgingBucket
}

export interface InvoiceAgingResult {
  items: AgedInvoice[]
  totals: Record<AgingBucket, { count: number; amount: number }>
  totalOutstanding: number
}

const BUCKET_RANK: Record<AgingBucket, number> = {
  overdue: 0,
  'due-soon': 1,
  upcoming: 2,
  'no-due-date': 3,
}

export function computeInvoiceAging(invoices: Invoice[], today: Date = new Date()): InvoiceAgingResult {
  const unpaid = invoices.filter((inv) => inv.status !== 'paid')

  const items: AgedInvoice[] = unpaid.map((invoice) => {
    if (!invoice.due_date) {
      return { invoice, daysOverdue: 0, daysUntilDue: null, bucket: 'no-due-date' }
    }
    const diff = differenceInCalendarDays(parseLocalDate(invoice.due_date), today)
    if (diff < 0) {
      return { invoice, daysOverdue: -diff, daysUntilDue: diff, bucket: 'overdue' }
    }
    if (diff <= DUE_SOON_DAYS) {
      return { invoice, daysOverdue: 0, daysUntilDue: diff, bucket: 'due-soon' }
    }
    return { invoice, daysOverdue: 0, daysUntilDue: diff, bucket: 'upcoming' }
  })

  items.sort((a, b) => {
    const rankDiff = BUCKET_RANK[a.bucket] - BUCKET_RANK[b.bucket]
    if (rankDiff !== 0) return rankDiff
    if (a.bucket === 'overdue') return b.daysOverdue - a.daysOverdue
    if (a.bucket === 'due-soon' || a.bucket === 'upcoming') {
      return (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0)
    }
    return parseLocalDate(a.invoice.issue_date).getTime() - parseLocalDate(b.invoice.issue_date).getTime()
  })

  const totals: InvoiceAgingResult['totals'] = {
    overdue: { count: 0, amount: 0 },
    'due-soon': { count: 0, amount: 0 },
    upcoming: { count: 0, amount: 0 },
    'no-due-date': { count: 0, amount: 0 },
  }
  for (const item of items) {
    totals[item.bucket].count += 1
    totals[item.bucket].amount += item.invoice.amount
  }

  const totalOutstanding = unpaid.reduce((sum, inv) => sum + inv.amount, 0)

  return { items, totals, totalOutstanding }
}

// ─── 2. Client-level income tracking ───────────────────────────────────────

export interface ClientSummary {
  clientName: string
  invoiceCount: number
  totalInvoiced: number
  totalPaid: number
  totalPending: number
  avgPaymentDays: number | null
  latePaymentCount: number
  latePaymentSampleSize: number
  isChronicLatePayer: boolean
}

export function computeClientSummaries(invoices: Invoice[]): ClientSummary[] {
  const groups = new Map<string, Invoice[]>()
  for (const inv of invoices) {
    const key = inv.client_name.trim()
    const group = groups.get(key)
    if (group) group.push(inv)
    else groups.set(key, [inv])
  }

  const summaries: ClientSummary[] = []

  for (const [clientName, group] of groups) {
    const totalInvoiced = group.reduce((s, i) => s + i.amount, 0)
    const totalPaid = group.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
    const totalPending = group.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

    const paymentDurations = group
      .filter((i) => i.status === 'paid' && i.date_paid && i.issue_date)
      .map((i) => differenceInCalendarDays(parseLocalDate(i.date_paid!), parseLocalDate(i.issue_date)))
    const avgPaymentDays = paymentDurations.length > 0
      ? Math.round(paymentDurations.reduce((s, d) => s + d, 0) / paymentDurations.length)
      : null

    const lateComparable = group.filter((i) => i.status === 'paid' && i.date_paid && i.due_date)
    const latePaymentCount = lateComparable.filter(
      (i) => parseLocalDate(i.date_paid!) > parseLocalDate(i.due_date!)
    ).length
    const latePaymentSampleSize = lateComparable.length
    const isChronicLatePayer =
      latePaymentSampleSize >= LATE_PAYER_MIN_SAMPLE &&
      latePaymentCount / latePaymentSampleSize >= LATE_PAYER_THRESHOLD

    summaries.push({
      clientName,
      invoiceCount: group.length,
      totalInvoiced,
      totalPaid,
      totalPending,
      avgPaymentDays,
      latePaymentCount,
      latePaymentSampleSize,
      isChronicLatePayer,
    })
  }

  return summaries.sort((a, b) => b.totalInvoiced - a.totalInvoiced)
}

// ─── 3. Cash flow forecast ──────────────────────────────────────────────────

export interface ForecastBucket {
  label: string
  amount: number
}

export interface CashFlowForecast {
  expectedIncoming: number
  incomingBuckets: ForecastBucket[]
  avgMonthlyExpenses: number
  monthsOfDataUsed: number
  projectedNet30: number
}

export function computeCashFlowForecast(
  invoices: Invoice[],
  expenses: Expense[],
  today: Date = new Date()
): CashFlowForecast {
  const unpaid = invoices.filter((inv) => inv.status !== 'paid')
  const expectedIncoming = unpaid.reduce((s, inv) => s + inv.amount, 0)

  const buckets: ForecastBucket[] = [
    { label: 'Overdue', amount: 0 },
    { label: '0–30 days', amount: 0 },
    { label: '31–60 days', amount: 0 },
    { label: '61–90 days', amount: 0 },
    { label: '90+ / No due date', amount: 0 },
  ]

  for (const inv of unpaid) {
    if (!inv.due_date) {
      buckets[4].amount += inv.amount
      continue
    }
    const diff = differenceInCalendarDays(parseLocalDate(inv.due_date), today)
    if (diff < 0) buckets[0].amount += inv.amount
    else if (diff <= 30) buckets[1].amount += inv.amount
    else if (diff <= 60) buckets[2].amount += inv.amount
    else if (diff <= 90) buckets[3].amount += inv.amount
    else buckets[4].amount += inv.amount
  }

  let monthsOfDataUsed = 0
  let expenseSum = 0
  for (let i = 1; i <= FORECAST_LOOKBACK_MONTHS; i++) {
    const monthDate = subMonths(today, i)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    const monthTotal = expenses
      .filter((e) => {
        const d = parseLocalDate(e.date)
        return d >= start && d <= end
      })
      .reduce((s, e) => s + e.amount, 0)
    if (monthTotal > 0) {
      monthsOfDataUsed += 1
      expenseSum += monthTotal
    }
  }
  const avgMonthlyExpenses = monthsOfDataUsed > 0 ? expenseSum / monthsOfDataUsed : 0

  const projectedNet30 = buckets[0].amount + buckets[1].amount - avgMonthlyExpenses

  return {
    expectedIncoming,
    incomingBuckets: buckets,
    avgMonthlyExpenses,
    monthsOfDataUsed,
    projectedNet30,
  }
}

// ─── 4. Quarterly estimated tax ─────────────────────────────────────────────

export interface QuarterSummary {
  quarter: number
  label: string
  income: number
  taxReserve: number
  businessExpenses: number
}

// Income = paid invoices by date_paid; deductible expenses = business-type
// only (personal expenses aren't deductible). Tax reserve mirrors the same
// income × rate model used on the Dashboard and Settings — not tax advice.
export function computeQuarterlyTaxSummary(
  invoices: Invoice[],
  expenses: Expense[],
  taxRate: number,
  year: number
): QuarterSummary[] {
  const quarters: QuarterSummary[] = [1, 2, 3, 4].map((q) => ({
    quarter: q,
    label: `Q${q}`,
    income: 0,
    taxReserve: 0,
    businessExpenses: 0,
  }))

  for (const inv of invoices) {
    if (inv.status !== 'paid' || !inv.date_paid) continue
    const d = parseLocalDate(inv.date_paid)
    if (d.getFullYear() !== year) continue
    quarters[Math.floor(d.getMonth() / 3)].income += inv.amount
  }

  for (const exp of expenses) {
    if (exp.type !== 'business') continue
    const d = parseLocalDate(exp.date)
    if (d.getFullYear() !== year) continue
    quarters[Math.floor(d.getMonth() / 3)].businessExpenses += exp.amount
  }

  for (const q of quarters) {
    q.taxReserve = q.income * (taxRate / 100)
  }

  return quarters
}

// ─── 5. Profit & Loss (custom date range) ───────────────────────────────────

export interface ProfitLossCategoryLine {
  category: string
  amount: number
}

export interface ProfitLossResult {
  income: number
  totalExpenses: number
  netProfit: number
  expensesByCategory: ProfitLossCategoryLine[]
}

export function computeProfitAndLoss(
  invoices: Invoice[],
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): ProfitLossResult {
  const income = invoices
    .filter((inv) => inv.status === 'paid' && inv.date_paid)
    .filter((inv) => {
      const d = parseLocalDate(inv.date_paid!)
      return d >= startDate && d <= endDate
    })
    .reduce((sum, inv) => sum + inv.amount, 0)

  const periodExpenses = expenses.filter((e) => {
    const d = parseLocalDate(e.date)
    return d >= startDate && d <= endDate
  })

  const categoryTotals = new Map<string, number>()
  for (const e of periodExpenses) {
    categoryTotals.set(e.category, (categoryTotals.get(e.category) ?? 0) + e.amount)
  }
  const expensesByCategory = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0)

  return { income, totalExpenses, netProfit: income - totalExpenses, expensesByCategory }
}

// ─── 6. Category spending trend ─────────────────────────────────────────────

export const CATEGORY_TREND_MONTHS = 12

export interface CategoryTrendPoint {
  monthKey: string
  label: string
  amount: number
}

export function computeCategoryTrend(
  expenses: Expense[],
  category: string,
  months: number = CATEGORY_TREND_MONTHS,
  today: Date = new Date()
): CategoryTrendPoint[] {
  const points: CategoryTrendPoint[] = []
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(today, i)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    const amount = expenses
      .filter((e) => e.category === category)
      .filter((e) => {
        const d = parseLocalDate(e.date)
        return d >= start && d <= end
      })
      .reduce((sum, e) => sum + e.amount, 0)
    points.push({ monthKey: format(monthDate, 'yyyy-MM'), label: format(monthDate, 'MMM yyyy'), amount })
  }
  return points
}

// ─── 7. Unbilled / upcoming revenue ─────────────────────────────────────────

export const UPCOMING_REVENUE_MONTHS = 3

export interface UpcomingRevenueMonth {
  monthKey: string
  label: string
  pendingInvoices: number
  recurringProjected: number
}

// Pending invoices bucketed by due date (falls back to issue date if unset),
// plus a projection of what active recurring invoice templates would add if
// they fire on schedule. The current month excludes templates that have
// already fired this period, since that revenue is no longer "upcoming."
export function computeUpcomingRevenue(
  invoices: Invoice[],
  recurringInvoices: RecurringInvoice[],
  monthsAhead: number = UPCOMING_REVENUE_MONTHS,
  today: Date = new Date()
): UpcomingRevenueMonth[] {
  const months: UpcomingRevenueMonth[] = []
  for (let i = 0; i < monthsAhead; i++) {
    const monthDate = addMonths(today, i)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    const monthKey = format(monthDate, 'yyyy-MM')

    const pendingInvoices = invoices
      .filter((inv) => inv.status !== 'paid')
      .filter((inv) => {
        const refDate = inv.due_date ? parseLocalDate(inv.due_date) : parseLocalDate(inv.issue_date)
        return refDate >= start && refDate <= end
      })
      .reduce((sum, inv) => sum + inv.amount, 0)

    const recurringProjected = recurringInvoices
      .filter((r) => r.active)
      .filter((r) => i > 0 || r.last_run_period !== monthKey)
      .reduce((sum, r) => {
        const subtotal = r.line_items.reduce((s, li) => s + li.qty * li.rate, 0)
        return sum + subtotal * (1 + r.tax_rate / 100)
      }, 0)

    months.push({ monthKey, label: format(monthDate, 'MMM yyyy'), pendingInvoices, recurringProjected })
  }
  return months
}

// ─── 8. Year-over-year comparison ───────────────────────────────────────────

export interface YearComparisonMonth {
  monthIndex: number
  monthLabel: string
  currentYearIncome: number
  previousYearIncome: number
  currentYearExpenses: number
  previousYearExpenses: number
}

export function computeYearOverYear(invoices: Invoice[], expenses: Expense[], year: number): YearComparisonMonth[] {
  const incomeForYearMonth = (yr: number, m: number) =>
    invoices
      .filter((inv) => inv.status === 'paid' && inv.date_paid)
      .filter((inv) => {
        const d = parseLocalDate(inv.date_paid!)
        return d.getFullYear() === yr && d.getMonth() === m
      })
      .reduce((s, inv) => s + inv.amount, 0)

  const expensesForYearMonth = (yr: number, m: number) =>
    expenses
      .filter((e) => {
        const d = parseLocalDate(e.date)
        return d.getFullYear() === yr && d.getMonth() === m
      })
      .reduce((s, e) => s + e.amount, 0)

  const months: YearComparisonMonth[] = []
  for (let m = 0; m < 12; m++) {
    months.push({
      monthIndex: m,
      monthLabel: format(new Date(year, m, 1), 'MMM'),
      currentYearIncome: incomeForYearMonth(year, m),
      previousYearIncome: incomeForYearMonth(year - 1, m),
      currentYearExpenses: expensesForYearMonth(year, m),
      previousYearExpenses: expensesForYearMonth(year - 1, m),
    })
  }
  return months
}
