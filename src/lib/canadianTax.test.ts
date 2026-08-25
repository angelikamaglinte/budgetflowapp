import { describe, it, expect } from 'vitest'
import {
  computeBracketTax,
  computeIncomeTax,
  computeCPP,
  backOutTax,
  computeAnnualNetIncome,
  computeTaxSummary,
  computeKeyDates,
  daysUntil,
  FEDERAL_BPA_2026,
  FEDERAL_BRACKETS_2026,
  PROVINCE_TAX_2026,
  CPP_2026,
} from './canadianTax'
import type { Invoice, Expense } from '@/types'

function makeInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'i1',
    user_id: 'u1',
    invoice_number: 'INV-001',
    client_name: 'Acme',
    client_email: null,
    amount: 1000,
    status: 'paid',
    issue_date: '2026-01-01',
    due_date: null,
    date_paid: '2026-01-15',
    notes: null,
    tax_rate: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeExpense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    user_id: 'u1',
    date: '2026-01-01',
    title: 'Test expense',
    vendor: null,
    category: 'Software',
    type: 'business',
    amount: 100,
    notes: null,
    receipt_url: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeBracketTax', () => {
  it('returns 0 for zero or negative income', () => {
    expect(computeBracketTax(0, FEDERAL_BRACKETS_2026)).toBe(0)
    expect(computeBracketTax(-500, FEDERAL_BRACKETS_2026)).toBe(0)
  })

  it('taxes income within the first bracket at that single rate', () => {
    expect(computeBracketTax(30000, FEDERAL_BRACKETS_2026)).toBeCloseTo(30000 * 0.14, 5)
  })

  it('taxes income exactly at a bracket boundary using only that bracket', () => {
    expect(computeBracketTax(58523, FEDERAL_BRACKETS_2026)).toBeCloseTo(58523 * 0.14, 5)
  })

  it('splits income across multiple brackets marginally', () => {
    const tax = computeBracketTax(100000, FEDERAL_BRACKETS_2026)
    const expected = 58523 * 0.14 + (100000 - 58523) * 0.205
    expect(tax).toBeCloseTo(expected, 5)
  })

  it('applies the top uncapped bracket for very high income', () => {
    const tax = computeBracketTax(300000, FEDERAL_BRACKETS_2026)
    const expected =
      58523 * 0.14 +
      (117045 - 58523) * 0.205 +
      (181440 - 117045) * 0.26 +
      (258482 - 181440) * 0.29 +
      (300000 - 258482) * 0.33
    expect(tax).toBeCloseTo(expected, 5)
  })
})

describe('computeIncomeTax', () => {
  it('subtracts the BPA as a credit at the lowest bracket rate, not a straight deduction', () => {
    // At an income spanning multiple brackets, subtracting BPA from income
    // first (the wrong method) shields a chunk of income from the higher
    // marginal rate — crediting BPA * lowestRate against the bracket tax
    // (the correct CRA method) does not, so the two methods diverge here.
    const income = 100000
    const tax = computeIncomeTax(income, FEDERAL_BPA_2026, FEDERAL_BRACKETS_2026)
    const wrongMethod = computeBracketTax(income - FEDERAL_BPA_2026, FEDERAL_BRACKETS_2026)
    const correctMethod = computeBracketTax(income, FEDERAL_BRACKETS_2026) - FEDERAL_BPA_2026 * 0.14
    expect(tax).toBeCloseTo(correctMethod, 5)
    expect(tax).not.toBeCloseTo(wrongMethod, 2)
  })

  it('never returns a negative tax', () => {
    expect(computeIncomeTax(5000, FEDERAL_BPA_2026, FEDERAL_BRACKETS_2026)).toBe(0)
  })

  it('computes provincial tax the same way for a province with its own BPA', () => {
    const on = PROVINCE_TAX_2026.ON
    const tax = computeIncomeTax(80000, on.bpa, on.brackets)
    const expected = computeBracketTax(80000, on.brackets) - on.bpa * on.brackets[0].rate
    expect(tax).toBeCloseTo(expected, 5)
  })
})

describe('computeCPP', () => {
  it('contributes nothing below the basic exemption', () => {
    const result = computeCPP(2000)
    expect(result.base).toBe(0)
    expect(result.cpp2).toBe(0)
    expect(result.total).toBe(0)
  })

  it('applies the base rate on income between the exemption and YMPE', () => {
    const result = computeCPP(50000)
    expect(result.base).toBeCloseTo((50000 - CPP_2026.exemption) * CPP_2026.baseRate, 5)
    expect(result.cpp2).toBe(0)
  })

  it('caps the base contribution at YMPE and starts CPP2 above it', () => {
    const result = computeCPP(80000)
    expect(result.base).toBeCloseTo(CPP_2026.baseMax, 5)
    expect(result.cpp2).toBeCloseTo((80000 - CPP_2026.ympe) * CPP_2026.cpp2Rate, 5)
  })

  it('caps CPP2 at YAMPE for income above it', () => {
    const result = computeCPP(100000)
    expect(result.base).toBeCloseTo(CPP_2026.baseMax, 5)
    expect(result.cpp2).toBeCloseTo(CPP_2026.cpp2Max, 5)
    expect(result.total).toBeCloseTo(CPP_2026.baseMax + CPP_2026.cpp2Max, 5)
  })
})

describe('computeAnnualNetIncome', () => {
  it('sums paid invoices and business expenses for the given year only', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1000, status: 'paid', date_paid: '2026-03-01' }),
      makeInvoice({ id: 'i2', amount: 2000, status: 'paid', date_paid: '2025-12-01' }), // wrong year
      makeInvoice({ id: 'i3', amount: 3000, status: 'pending', date_paid: null }), // not paid
    ]
    const expenses = [
      makeExpense({ id: 'e1', amount: 100, type: 'business', date: '2026-05-01' }),
      makeExpense({ id: 'e2', amount: 200, type: 'personal', date: '2026-05-01' }), // not deductible
      makeExpense({ id: 'e3', amount: 300, type: 'business', date: '2025-05-01' }), // wrong year
    ]

    const result = computeAnnualNetIncome(invoices, expenses, 2026)

    expect(result.grossIncome).toBe(1000)
    expect(result.businessExpenses).toBe(100)
    expect(result.netIncome).toBe(900)
  })

  it('returns all zeros for a year with no activity', () => {
    expect(computeAnnualNetIncome([], [], 2026)).toEqual({
      grossIncome: 0,
      businessExpenses: 0,
      netIncome: 0,
    })
  })

  it('backs out GST/HST from invoices that have a tax_rate, leaving plain invoices untouched', () => {
    const invoices = [
      makeInvoice({ id: 'i1', amount: 1050, tax_rate: 5, date_paid: '2026-06-01' }), // $1000 + 5% GST
      makeInvoice({ id: 'i2', amount: 1000, tax_rate: null, date_paid: '2026-02-01' }), // pre-GST-registration
    ]

    const result = computeAnnualNetIncome(invoices, [], 2026)

    expect(result.grossIncome).toBeCloseTo(2000, 5)
  })
})

describe('backOutTax', () => {
  it('splits a tax-inclusive amount into subtotal and tax', () => {
    const { subtotal, taxAmount } = backOutTax(1050, 5)
    expect(subtotal).toBeCloseTo(1000, 5)
    expect(taxAmount).toBeCloseTo(50, 5)
  })

  it('returns the full amount as subtotal at a 0% rate', () => {
    const { subtotal, taxAmount } = backOutTax(500, 0)
    expect(subtotal).toBe(500)
    expect(taxAmount).toBe(0)
  })
})

describe('computeTaxSummary', () => {
  it('sums federal tax, provincial tax, and CPP into a total owing', () => {
    const summary = computeTaxSummary(80000, 'ON')
    const on = PROVINCE_TAX_2026.ON
    const expectedFederal = computeIncomeTax(80000, FEDERAL_BPA_2026, FEDERAL_BRACKETS_2026)
    const expectedProvincial = computeIncomeTax(80000, on.bpa, on.brackets)
    const expectedCpp = computeCPP(80000)

    expect(summary.federalTax).toBeCloseTo(expectedFederal, 5)
    expect(summary.provincialTax).toBeCloseTo(expectedProvincial, 5)
    expect(summary.cpp.total).toBeCloseTo(expectedCpp.total, 5)
    expect(summary.totalOwing).toBeCloseTo(expectedFederal + expectedProvincial + expectedCpp.total, 5)
    expect(summary.afterTaxIncome).toBeCloseTo(80000 - summary.totalOwing, 5)
  })

  it('returns zero provincial tax when no province is set', () => {
    const summary = computeTaxSummary(80000, null)
    expect(summary.provincialTax).toBe(0)
  })

  it('returns a zero effective rate for zero or negative income', () => {
    expect(computeTaxSummary(0, 'ON').effectiveRate).toBe(0)
    expect(computeTaxSummary(-500, 'ON').effectiveRate).toBe(0)
  })
})

describe('computeKeyDates', () => {
  it('rolls the balance-owing and filing deadlines into the following year', () => {
    const dates = computeKeyDates(2026, 5000)
    expect(dates.balanceOwingDate).toEqual(new Date(2027, 3, 30))
    expect(dates.filingDeadlineDate).toEqual(new Date(2027, 5, 15))
  })

  it('returns the four installment dates within the tax year itself', () => {
    const dates = computeKeyDates(2026, 5000)
    expect(dates.installmentDates).toEqual([
      new Date(2026, 2, 15),
      new Date(2026, 5, 15),
      new Date(2026, 8, 15),
      new Date(2026, 11, 15),
    ])
  })

  it('flags likelyRequiresInstallments only above the $3,000 threshold', () => {
    expect(computeKeyDates(2026, 3000).likelyRequiresInstallments).toBe(false)
    expect(computeKeyDates(2026, 3000.01).likelyRequiresInstallments).toBe(true)
    expect(computeKeyDates(2026, 0).likelyRequiresInstallments).toBe(false)
  })
})

describe('daysUntil', () => {
  it('returns a positive number of days for a future date', () => {
    const today = new Date(2026, 0, 1)
    expect(daysUntil(new Date(2026, 0, 11), today)).toBe(10)
  })

  it('returns a negative number of days for a past date', () => {
    const today = new Date(2026, 0, 11)
    expect(daysUntil(new Date(2026, 0, 1), today)).toBe(-10)
  })

  it('returns zero for today', () => {
    const today = new Date(2026, 0, 1)
    expect(daysUntil(new Date(2026, 0, 1), today)).toBe(0)
  })
})
