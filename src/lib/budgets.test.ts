import { describe, it, expect } from 'vitest'
import { computeBudgetActual, computeBudgetProgress } from './budgets'
import type { BudgetCategory, Expense, Invoice, PayoutBucket } from '@/types'

function makeBudget(overrides: Partial<BudgetCategory>): BudgetCategory {
  return {
    id: 'bg1',
    user_id: 'u1',
    name: 'Groceries',
    monthly_target: 400,
    source_type: 'expense',
    expense_category: 'Food & Dining',
    bucket_id: null,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    user_id: 'u1',
    date: '2026-08-15',
    title: 'Groceries',
    vendor: null,
    category: 'Food & Dining',
    type: 'personal',
    amount: 100,
    notes: null,
    receipt_url: null,
    tax_rate: null,
    created_at: '2026-08-15T00:00:00Z',
    ...overrides,
  }
}

function makeInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'i1',
    user_id: 'u1',
    invoice_number: 'INV-001',
    client_name: 'Client',
    client_email: null,
    amount: 1000,
    status: 'paid',
    issue_date: '2026-08-01',
    due_date: null,
    date_paid: '2026-08-10',
    notes: null,
    tax_rate: null,
    created_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function makeBucket(overrides: Partial<PayoutBucket>): PayoutBucket {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Tax Reserve',
    percentage: 20,
    sort_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeBudgetActual', () => {
  it('sums only matching-category expenses within the target month', () => {
    const budget = makeBudget({ source_type: 'expense', expense_category: 'Food & Dining' })
    const expenses = [
      makeExpense({ id: 'e1', date: '2026-08-05', category: 'Food & Dining', amount: 100 }),
      makeExpense({ id: 'e2', date: '2026-08-20', category: 'Food & Dining', amount: 50 }),
      makeExpense({ id: 'e3', date: '2026-08-10', category: 'Software', amount: 999 }),
      makeExpense({ id: 'e4', date: '2026-07-31', category: 'Food & Dining', amount: 999 }),
    ]

    const actual = computeBudgetActual(budget, expenses, [], [], new Date('2026-08-15'))

    expect(actual).toBe(150)
  })

  it('sums only the target bucket share across paid invoices within the month', () => {
    const buckets = [
      makeBucket({ id: 'tax', percentage: 20, sort_order: 0 }),
      makeBucket({ id: 'owner', percentage: null, sort_order: 1 }),
    ]
    const budget = makeBudget({ source_type: 'bucket', bucket_id: 'tax', expense_category: null })
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-08-05' }),
      makeInvoice({ id: 'i2', amount: 500, status: 'paid', date_paid: '2026-08-20' }),
      makeInvoice({ id: 'i3', amount: 500, status: 'pending', date_paid: null }),
      makeInvoice({ id: 'i4', amount: 2000, status: 'paid', date_paid: '2026-07-31' }),
    ]

    const actual = computeBudgetActual(budget, [], invoices, buckets, new Date('2026-08-15'))

    expect(actual).toBe(300) // 20% of (1000 + 500)
  })

  it('returns 0 for a bucket-type budget whose linked bucket was deleted', () => {
    const budget = makeBudget({ source_type: 'bucket', bucket_id: null })
    const invoices = [makeInvoice({ amount: 1000, status: 'paid', date_paid: '2026-08-05' })]
    expect(computeBudgetActual(budget, [], invoices, [], new Date('2026-08-15'))).toBe(0)
  })
})

describe('computeBudgetProgress', () => {
  it('is "ok" below 80% used', () => {
    expect(computeBudgetProgress(400, 0).status).toBe('ok')
    expect(computeBudgetProgress(400, 319).status).toBe('ok')
  })

  it('is "warning" at 80% and above but not over', () => {
    expect(computeBudgetProgress(400, 320).status).toBe('warning')
    expect(computeBudgetProgress(400, 400).status).toBe('warning')
  })

  it('is "over" once actual exceeds target', () => {
    expect(computeBudgetProgress(400, 480).status).toBe('over')
  })

  it('computes remaining and percentUsed', () => {
    const progress = computeBudgetProgress(400, 100)
    expect(progress.remaining).toBe(300)
    expect(progress.percentUsed).toBe(25)
  })
})
