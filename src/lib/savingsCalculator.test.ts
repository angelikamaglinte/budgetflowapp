import { describe, it, expect } from 'vitest'
import { computeMonthlyAverages, computePurchaseProgress, formatMoney } from './savingsCalculator'
import type { Expense, Invoice, PurchasePlan } from '@/types'

// today is fixed mid-month so "trailing 3 complete months" is unambiguous:
// May, June, July are complete; August (today's month) is excluded.
const TODAY = new Date('2026-08-15T12:00:00')

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    user_id: 'u1',
    date: '2026-07-01',
    title: 'Test expense',
    vendor: null,
    category: 'Software',
    type: 'business',
    amount: 100,
    notes: null,
    receipt_url: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function makeInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'i1',
    user_id: 'u1',
    invoice_number: 'INV-001',
    client_name: 'Acme',
    client_email: null,
    amount: 1000,
    status: 'paid',
    issue_date: '2026-07-01',
    due_date: null,
    date_paid: '2026-07-15',
    notes: null,
    tax_rate: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeMonthlyAverages', () => {
  it('averages paid income and expenses across the trailing 3 complete months', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, date_paid: '2026-05-10' }),
      makeInvoice({ id: 'i2', amount: 2000, date_paid: '2026-06-10' }),
      makeInvoice({ id: 'i3', amount: 3000, date_paid: '2026-07-10' }),
    ]
    const expenses = [
      makeExpense({ id: 'e1', amount: 100, date: '2026-05-05' }),
      makeExpense({ id: 'e2', amount: 200, date: '2026-06-05' }),
      makeExpense({ id: 'e3', amount: 300, date: '2026-07-05' }),
    ]

    const result = computeMonthlyAverages(expenses, invoices, TODAY)

    expect(result.monthsOfDataUsed).toBe(3)
    expect(result.avgMonthlyIncome).toBe(2000)
    expect(result.avgMonthlyExpenses).toBe(200)
  })

  it('excludes the current, still-in-progress month', () => {
    const invoices = [makeInvoice({ date_paid: '2026-08-10' })]
    const expenses = [makeExpense({ date: '2026-08-05' })]

    const result = computeMonthlyAverages(expenses, invoices, TODAY)

    expect(result.monthsOfDataUsed).toBe(0)
    expect(result.avgMonthlyIncome).toBe(0)
    expect(result.avgMonthlyExpenses).toBe(0)
  })

  it('ignores unpaid invoices even if within range', () => {
    const invoices = [
      makeInvoice({ status: 'pending', date_paid: null, amount: 5000 }),
      makeInvoice({ status: 'paid', date_paid: '2026-07-10', amount: 1000 }),
    ]

    const result = computeMonthlyAverages([], invoices, TODAY)

    expect(result.monthsOfDataUsed).toBe(1)
    expect(result.avgMonthlyIncome).toBe(1000)
  })

  it('only counts months that have income or expense activity', () => {
    const invoices = [makeInvoice({ date_paid: '2026-07-10', amount: 900 })]
    const expenses: Expense[] = []

    const result = computeMonthlyAverages(expenses, invoices, TODAY)

    // May and June had nothing at all, so only July counts.
    expect(result.monthsOfDataUsed).toBe(1)
    expect(result.avgMonthlyIncome).toBe(900)
    expect(result.avgMonthlyExpenses).toBe(0)
  })

  it('returns all zeros when there is no data in range', () => {
    const result = computeMonthlyAverages([], [], TODAY)

    expect(result).toEqual({
      avgMonthlyIncome: 0,
      avgMonthlyExpenses: 0,
      monthsOfDataUsed: 0,
    })
  })
})

describe('computePurchaseProgress', () => {
  const averages = { avgMonthlyIncome: 5000, avgMonthlyExpenses: 1000, monthsOfDataUsed: 3 }

  it('computes leftover after tax and savings rates', () => {
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 3000, target_date: null }
    const result = computePurchaseProgress(plan, averages, 20, 10, TODAY)

    // 5000 * (1 - 0.30) - 1000 = 3500 - 1000 = 2500
    expect(result.avgMonthlyLeftover).toBe(2500)
  })

  it('leaves target-date fields null when the plan has no target_date', () => {
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 3000, target_date: null }
    const result = computePurchaseProgress(plan, averages, 0, 0, TODAY)

    expect(result.monthsUntilTarget).toBeNull()
    expect(result.requiredMonthlyExtra).toBeNull()
    expect(result.onTrack).toBeNull()
    expect(result.shortfall).toBeNull()
  })

  it('marks onTrack true and shortfall 0 when leftover covers the required pace', () => {
    // leftover = 5000 - 1000 = 4000/mo, target is 2 months away, price 6000 -> needs 3000/mo
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 6000, target_date: '2026-10-15' }
    const result = computePurchaseProgress(plan, averages, 0, 0, TODAY)

    expect(result.monthsUntilTarget).toBe(2)
    expect(result.requiredMonthlyExtra).toBe(3000)
    expect(result.onTrack).toBe(true)
    expect(result.shortfall).toBe(0)
  })

  it('marks onTrack false and computes shortfall when leftover falls short', () => {
    // leftover = 4000/mo, target is 1 month away, price 6000 -> needs 6000/mo
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 6000, target_date: '2026-09-10' }
    const result = computePurchaseProgress(plan, averages, 0, 0, TODAY)

    expect(result.monthsUntilTarget).toBe(1)
    expect(result.requiredMonthlyExtra).toBe(6000)
    expect(result.onTrack).toBe(false)
    expect(result.shortfall).toBe(2000)
  })

  it('floors monthsUntilTarget at 1 even for a target date in the past', () => {
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 1000, target_date: '2026-01-01' }
    const result = computePurchaseProgress(plan, averages, 0, 0, TODAY)

    expect(result.monthsUntilTarget).toBe(1)
  })

  it('projects monthsAtCurrentRate and projectedDate when leftover is positive', () => {
    // leftover = 4000/mo, price 10000 -> ceil(2.5) = 3 months
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 10000, target_date: null }
    const result = computePurchaseProgress(plan, averages, 0, 0, TODAY)

    expect(result.monthsAtCurrentRate).toBe(3)
    expect(result.projectedDate).toEqual(new Date('2026-11-15T12:00:00'))
  })

  it('leaves monthsAtCurrentRate and projectedDate null when leftover is zero or negative', () => {
    const zeroAverages = { avgMonthlyIncome: 500, avgMonthlyExpenses: 500, monthsOfDataUsed: 1 }
    const plan: Pick<PurchasePlan, 'price' | 'target_date'> = { price: 1000, target_date: null }
    const result = computePurchaseProgress(plan, zeroAverages, 0, 0, TODAY)

    expect(result.avgMonthlyLeftover).toBe(0)
    expect(result.monthsAtCurrentRate).toBeNull()
    expect(result.projectedDate).toBeNull()
  })
})

describe('formatMoney', () => {
  it('formats positive numbers with a dollar sign, commas, and 2 decimals', () => {
    expect(formatMoney(1234.5)).toBe('$1,234.50')
  })

  it('formats zero', () => {
    expect(formatMoney(0)).toBe('$0.00')
  })

  it('formats negative numbers', () => {
    // '$' is prepended before the sign, since formatMoney does '$' + n.toLocaleString(...)
    expect(formatMoney(-42)).toBe('$-42.00')
  })
})
