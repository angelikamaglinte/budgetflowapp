import { describe, it, expect } from 'vitest'
import { computeMonthlySummary } from './budgets'
import type { Expense, Invoice, PayoutBucket } from '@/types'

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
    budget_month: null,
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

const buckets = [
  makeBucket({ id: 'tax', name: 'Tax Reserve', percentage: 20, sort_order: 0 }),
  makeBucket({ id: 'owner', name: 'Owner Pay', percentage: null, sort_order: 1 }),
]

describe('computeMonthlySummary', () => {
  it('only includes paid invoices within the target month', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-08-05' }),
      makeInvoice({ id: 'i2', amount: 500, status: 'pending', date_paid: null }),
      makeInvoice({ id: 'i3', amount: 2000, status: 'paid', date_paid: '2026-07-31' }),
    ]

    const summary = computeMonthlySummary(invoices, [], buckets, new Date('2026-08-15'))

    expect(summary.invoiceSplits).toHaveLength(1)
    expect(summary.invoiceSplits[0].invoice.id).toBe('i1')
  })

  it('uses budget_month over date_paid when the invoice is explicitly tagged', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-08-31', budget_month: '2026-09' }),
    ]

    const augustSummary = computeMonthlySummary(invoices, [], buckets, new Date('2026-08-15'))
    const septemberSummary = computeMonthlySummary(invoices, [], buckets, new Date('2026-09-15'))

    expect(augustSummary.invoiceSplits).toHaveLength(0)
    expect(septemberSummary.invoiceSplits).toHaveLength(1)
  })

  it('falls back to date_paid\'s month when budget_month is not set', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-08-05', budget_month: null }),
    ]

    const summary = computeMonthlySummary(invoices, [], buckets, new Date('2026-08-15'))

    expect(summary.invoiceSplits).toHaveLength(1)
  })

  it('lets two invoices with the same date_paid land in different months via budget_month', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-08-31', budget_month: '2026-08' }),
      makeInvoice({ id: 'i2', amount: 500, status: 'paid', date_paid: '2026-08-31', budget_month: '2026-09' }),
    ]

    const augustSummary = computeMonthlySummary(invoices, [], buckets, new Date('2026-08-15'))
    const septemberSummary = computeMonthlySummary(invoices, [], buckets, new Date('2026-09-15'))

    expect(augustSummary.invoiceSplits.map((s) => s.invoice.id)).toEqual(['i1'])
    expect(septemberSummary.invoiceSplits.map((s) => s.invoice.id)).toEqual(['i2'])
  })

  it('accumulates the remainder bucket share across multiple invoices in the same month', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-08-05' }),
      makeInvoice({ id: 'i2', amount: 500, status: 'paid', date_paid: '2026-08-20' }),
    ]

    const summary = computeMonthlySummary(invoices, [], buckets, new Date('2026-08-15'))

    // 80% remainder of 1000 + 80% remainder of 500 = 800 + 400
    expect(summary.remainderTotal).toBe(1200)
    expect(summary.remainderBucket?.id).toBe('owner')
  })

  it('includes both business and personal expenses in the monthly deduction', () => {
    const expenses = [
      makeExpense({ id: 'e1', date: '2026-08-05', type: 'personal', amount: 100 }),
      makeExpense({ id: 'e2', date: '2026-08-10', type: 'business', category: 'Software', amount: 50 }),
      makeExpense({ id: 'e3', date: '2026-07-31', type: 'personal', amount: 999 }),
    ]

    const summary = computeMonthlySummary([], expenses, buckets, new Date('2026-08-15'))

    expect(summary.monthExpensesTotal).toBe(150)
    expect(summary.monthExpenses.map((e) => e.id).sort()).toEqual(['e1', 'e2'])
  })

  it('computes leftover as remainder minus expenses, going negative when expenses exceed it', () => {
    const invoices = [makeInvoice({ amount: 1000, status: 'paid', date_paid: '2026-08-05' })]
    const expenses = [makeExpense({ date: '2026-08-10', amount: 2000 })]

    const summary = computeMonthlySummary(invoices, expenses, buckets, new Date('2026-08-15'))

    expect(summary.remainderTotal).toBe(800)
    expect(summary.monthExpensesTotal).toBe(2000)
    expect(summary.leftover).toBe(-1200)
  })

  it('returns a null remainder bucket and zero remainder total when there is no remainder bucket', () => {
    const noRemainderBuckets = [makeBucket({ id: 'tax', percentage: 20 })]
    const invoices = [makeInvoice({ amount: 1000, status: 'paid', date_paid: '2026-08-05' })]

    const summary = computeMonthlySummary(invoices, [], noRemainderBuckets, new Date('2026-08-15'))

    expect(summary.remainderBucket).toBeNull()
    expect(summary.remainderTotal).toBe(0)
  })

  it('handles no buckets at all gracefully', () => {
    const invoices = [makeInvoice({ amount: 1000, status: 'paid', date_paid: '2026-08-05' })]
    const summary = computeMonthlySummary(invoices, [], [], new Date('2026-08-15'))

    expect(summary.remainderBucket).toBeNull()
    expect(summary.remainderTotal).toBe(0)
    expect(summary.invoiceSplits[0].split).toEqual([])
  })
})
