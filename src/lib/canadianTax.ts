import { parseLocalDate } from '@/lib/utils'
import type { Invoice, Expense } from '@/types'

// 2026 CRA figures. These change every year via indexation — revisit annually.
export type ProvinceCode = 'ON' | 'BC' | 'AB' | 'QC' | 'MB' | 'SK' | 'NS' | 'NB' | 'NL' | 'PE' | 'NT' | 'YT' | 'NU'

export const PROVINCE_LABELS: Record<ProvinceCode, string> = {
  ON: 'Ontario',
  BC: 'British Columbia',
  AB: 'Alberta',
  QC: 'Quebec',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  PE: 'Prince Edward Island',
  NT: 'Northwest Territories',
  YT: 'Yukon',
  NU: 'Nunavut',
}

export interface TaxBracket {
  upTo: number | null // null = top bracket, no ceiling
  rate: number // e.g. 0.14 for 14%
}

export const FEDERAL_BPA_2026 = 16452
export const FEDERAL_BRACKETS_2026: TaxBracket[] = [
  { upTo: 58523, rate: 0.14 },
  { upTo: 117045, rate: 0.205 },
  { upTo: 181440, rate: 0.26 },
  { upTo: 258482, rate: 0.29 },
  { upTo: null, rate: 0.33 },
]

interface ProvinceTaxInfo {
  bpa: number
  brackets: TaxBracket[]
}

export const PROVINCE_TAX_2026: Record<ProvinceCode, ProvinceTaxInfo> = {
  ON: {
    bpa: 12989,
    brackets: [
      { upTo: 53891, rate: 0.0505 },
      { upTo: 107785, rate: 0.0915 },
      { upTo: 150000, rate: 0.1116 },
      { upTo: 220000, rate: 0.1216 },
      { upTo: null, rate: 0.1316 },
    ],
  },
  BC: {
    bpa: 13216,
    brackets: [
      { upTo: 50363, rate: 0.056 },
      { upTo: 100728, rate: 0.077 },
      { upTo: 115648, rate: 0.105 },
      { upTo: 140430, rate: 0.1229 },
      { upTo: 190405, rate: 0.147 },
      { upTo: 265545, rate: 0.168 },
      { upTo: null, rate: 0.205 },
    ],
  },
  AB: {
    bpa: 22769,
    brackets: [
      { upTo: 61200, rate: 0.08 },
      { upTo: 154259, rate: 0.1 },
      { upTo: 185111, rate: 0.12 },
      { upTo: 246813, rate: 0.13 },
      { upTo: 370220, rate: 0.14 },
      { upTo: null, rate: 0.15 },
    ],
  },
  QC: {
    bpa: 18952,
    brackets: [
      { upTo: 54345, rate: 0.14 },
      { upTo: 108680, rate: 0.19 },
      { upTo: 132245, rate: 0.24 },
      { upTo: null, rate: 0.2575 },
    ],
  },
  MB: {
    bpa: 15780,
    brackets: [
      { upTo: 47000, rate: 0.108 },
      { upTo: 100000, rate: 0.1275 },
      { upTo: null, rate: 0.174 },
    ],
  },
  SK: {
    bpa: 20381,
    brackets: [
      { upTo: 54532, rate: 0.105 },
      { upTo: 155805, rate: 0.125 },
      { upTo: null, rate: 0.145 },
    ],
  },
  NS: {
    bpa: 11932,
    brackets: [
      { upTo: 30995, rate: 0.0879 },
      { upTo: 61991, rate: 0.1495 },
      { upTo: 97417, rate: 0.1667 },
      { upTo: 157124, rate: 0.175 },
      { upTo: null, rate: 0.21 },
    ],
  },
  NB: {
    bpa: 13664,
    brackets: [
      { upTo: 52333, rate: 0.094 },
      { upTo: 104666, rate: 0.14 },
      { upTo: 193861, rate: 0.16 },
      { upTo: null, rate: 0.195 },
    ],
  },
  NL: {
    bpa: 13094,
    brackets: [
      { upTo: 44678, rate: 0.087 },
      { upTo: 89354, rate: 0.145 },
      { upTo: 159528, rate: 0.158 },
      { upTo: 223340, rate: 0.178 },
      { upTo: 285319, rate: 0.198 },
      { upTo: 570638, rate: 0.208 },
      { upTo: 1141275, rate: 0.213 },
      { upTo: null, rate: 0.218 },
    ],
  },
  PE: {
    bpa: 15000,
    brackets: [
      { upTo: 33928, rate: 0.095 },
      { upTo: 65820, rate: 0.1347 },
      { upTo: 106890, rate: 0.166 },
      { upTo: 142520, rate: 0.1762 },
      { upTo: 200000, rate: 0.19 },
      { upTo: null, rate: 0.2 },
    ],
  },
  NT: {
    bpa: 18198,
    brackets: [
      { upTo: 53003, rate: 0.059 },
      { upTo: 106009, rate: 0.086 },
      { upTo: 172346, rate: 0.122 },
      { upTo: null, rate: 0.1405 },
    ],
  },
  YT: {
    bpa: 16452,
    brackets: [
      { upTo: 58523, rate: 0.064 },
      { upTo: 117045, rate: 0.09 },
      { upTo: 181440, rate: 0.109 },
      { upTo: 500000, rate: 0.128 },
      { upTo: null, rate: 0.15 },
    ],
  },
  NU: {
    bpa: 19659,
    brackets: [
      { upTo: 55801, rate: 0.04 },
      { upTo: 111602, rate: 0.07 },
      { upTo: 181439, rate: 0.09 },
      { upTo: null, rate: 0.115 },
    ],
  },
}

export const CPP_2026 = {
  exemption: 3500,
  ympe: 74600,
  baseRate: 0.119,
  baseMax: 8460.9,
  yampe: 85000,
  cpp2Rate: 0.08,
  cpp2Max: 832.0,
}

// Marginal bracket tax on the full taxable income — the BPA is applied
// separately as a credit (see computeIncomeTax), not baked in here.
export function computeBracketTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0
  let tax = 0
  let lowerBound = 0
  for (const { upTo, rate } of brackets) {
    if (taxableIncome <= lowerBound) break
    const upperBound = upTo ?? Infinity
    const amountInBracket = Math.min(taxableIncome, upperBound) - lowerBound
    tax += amountInBracket * rate
    lowerBound = upperBound
  }
  return tax
}

// CRA values the Basic Personal Amount as a non-refundable credit at the
// LOWEST bracket rate, not as a deduction from income before bracketing —
// this is the actual calculation method, not a simplification.
export function computeIncomeTax(taxableIncome: number, bpa: number, brackets: TaxBracket[]): number {
  const grossTax = computeBracketTax(taxableIncome, brackets)
  const credit = bpa * brackets[0].rate
  return Math.max(0, grossTax - credit)
}

export interface CppContribution {
  base: number
  cpp2: number
  total: number
}

// Self-employed people pay both the "employee" and "employer" halves.
export function computeCPP(netSelfEmploymentIncome: number): CppContribution {
  const income = Math.max(0, netSelfEmploymentIncome)

  const baseEarnings = Math.max(0, Math.min(income, CPP_2026.ympe) - CPP_2026.exemption)
  const base = Math.min(baseEarnings * CPP_2026.baseRate, CPP_2026.baseMax)

  const cpp2Earnings = Math.max(0, Math.min(income, CPP_2026.yampe) - CPP_2026.ympe)
  const cpp2 = Math.min(cpp2Earnings * CPP_2026.cpp2Rate, CPP_2026.cpp2Max)

  return { base, cpp2, total: base + cpp2 }
}

// An invoice's `amount` may include GST/HST charged on top of the service
// fee (common when users record the full amount actually received). Backs
// out the tax portion so it isn't counted as income.
export function backOutTax(amountIncludingTax: number, taxRate: number): { subtotal: number; taxAmount: number } {
  const subtotal = amountIncludingTax / (1 + taxRate / 100)
  return { subtotal, taxAmount: amountIncludingTax - subtotal }
}

const MEALS_ENTERTAINMENT_CATEGORY = 'Meals & Entertainment'
const MEALS_ENTERTAINMENT_DEDUCTION_RATE = 0.5

// CRA limits meals & entertainment with a business purpose to 50%
// deductibility (Income Tax Act s. 67.1), even with a legitimate business
// reason — every other expense category is fully deductible.
export function computeDeductibleAmount(expense: Pick<Expense, 'category' | 'amount'>): number {
  return expense.category === MEALS_ENTERTAINMENT_CATEGORY
    ? expense.amount * MEALS_ENTERTAINMENT_DEDUCTION_RATE
    : expense.amount
}

export interface AnnualIncomeSummary {
  grossIncome: number
  businessExpenses: number
  netIncome: number
}

// Gross income = paid invoices by date_paid year, GST/HST backed out where
// an invoice has a tax_rate; deductible expenses = business-type only
// (personal expenses aren't deductible), with Meals & Entertainment capped
// at 50% per computeDeductibleAmount — same convention as
// computeQuarterlyTaxSummary in reports.ts, but for a full year rather
// than quarterly buckets.
export function computeAnnualNetIncome(invoices: Invoice[], expenses: Expense[], year: number): AnnualIncomeSummary {
  let grossIncome = 0
  for (const inv of invoices) {
    if (inv.status !== 'paid' || !inv.date_paid) continue
    if (parseLocalDate(inv.date_paid).getFullYear() !== year) continue
    grossIncome += inv.tax_rate ? backOutTax(inv.amount, inv.tax_rate).subtotal : inv.amount
  }

  let businessExpenses = 0
  for (const exp of expenses) {
    if (exp.type !== 'business') continue
    if (parseLocalDate(exp.date).getFullYear() !== year) continue
    businessExpenses += computeDeductibleAmount(exp)
  }

  return { grossIncome, businessExpenses, netIncome: grossIncome - businessExpenses }
}

export interface TuitionCreditResult {
  tax: number
  tuitionAmountUsed: number // consumed from the pool, in credit-amount units (not dollar value)
  remainingTuitionCredit: number
}

// Unused federal tuition credits carry forward indefinitely. CRA applies
// only as much as needed to zero out the remaining tax — it never creates
// a refund — and whatever's left over keeps carrying forward. This is a
// federal-only concept: Alberta discontinued its own tuition credit in
// 2020, so this is never applied to provincial tax.
export function applyTuitionCredit(
  taxAfterOtherCredits: number,
  availableTuitionCredit: number,
  lowestRate: number
): TuitionCreditResult {
  const tax = Math.max(0, taxAfterOtherCredits)
  if (tax <= 0 || availableTuitionCredit <= 0) {
    return { tax, tuitionAmountUsed: 0, remainingTuitionCredit: Math.max(0, availableTuitionCredit) }
  }

  const maxCreditValue = availableTuitionCredit * lowestRate
  const creditValueUsed = Math.min(tax, maxCreditValue)
  const tuitionAmountUsed = creditValueUsed / lowestRate

  return {
    tax: tax - creditValueUsed,
    tuitionAmountUsed,
    remainingTuitionCredit: availableTuitionCredit - tuitionAmountUsed,
  }
}

export interface TaxSummary {
  netIncome: number
  federalTax: number
  provincialTax: number
  cpp: CppContribution
  totalOwing: number
  afterTaxIncome: number
  effectiveRate: number
  tuitionCreditUsed: number
  remainingTuitionCredit: number
}

export function computeTaxSummary(
  netIncome: number,
  province: ProvinceCode | null,
  availableTuitionCredit: number = 0
): TaxSummary {
  const income = Math.max(0, netIncome)
  const federalTaxBeforeTuition = computeIncomeTax(income, FEDERAL_BPA_2026, FEDERAL_BRACKETS_2026)
  const tuitionResult = applyTuitionCredit(federalTaxBeforeTuition, availableTuitionCredit, FEDERAL_BRACKETS_2026[0].rate)
  const federalTax = tuitionResult.tax
  const provinceInfo = province ? PROVINCE_TAX_2026[province] : null
  const provincialTax = provinceInfo ? computeIncomeTax(income, provinceInfo.bpa, provinceInfo.brackets) : 0
  const cpp = computeCPP(income)
  const totalOwing = federalTax + provincialTax + cpp.total

  return {
    netIncome: income,
    federalTax,
    provincialTax,
    cpp,
    totalOwing,
    afterTaxIncome: income - totalOwing,
    effectiveRate: income > 0 ? (totalOwing / income) * 100 : 0,
    tuitionCreditUsed: tuitionResult.tuitionAmountUsed,
    remainingTuitionCredit: tuitionResult.remainingTuitionCredit,
  }
}

const INSTALLMENT_THRESHOLD = 3000

export interface KeyDates {
  balanceOwingDate: Date // April 30 of year+1
  filingDeadlineDate: Date // June 15 of year+1 — self-employed get an extension past April 30
  installmentDates: Date[] // Mar 15 / Jun 15 / Sep 15 / Dec 15 of `year` itself
  likelyRequiresInstallments: boolean
}

export function computeKeyDates(year: number, totalOwing: number): KeyDates {
  return {
    balanceOwingDate: new Date(year + 1, 3, 30),
    filingDeadlineDate: new Date(year + 1, 5, 15),
    installmentDates: [
      new Date(year, 2, 15),
      new Date(year, 5, 15),
      new Date(year, 8, 15),
      new Date(year, 11, 15),
    ],
    likelyRequiresInstallments: totalOwing > INSTALLMENT_THRESHOLD,
  }
}

export function daysUntil(date: Date, today: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((date.getTime() - startOfToday.getTime()) / msPerDay)
}
