import { describe, it, expect } from 'vitest'
import {
  parseFlexibleDate,
  parseFlexibleAmount,
  normalize,
  isLikelyDataRow,
  isLikelyDuplicate,
  splitTotal,
  isSplitBalanced,
} from './csvImport'

describe('parseFlexibleDate', () => {
  it('parses ISO dates', () => {
    expect(parseFlexibleDate('2025-12-01')).toBe('2025-12-01')
  })

  it('parses US-style MM/DD/YYYY dates', () => {
    expect(parseFlexibleDate('12/01/2025')).toBe('2025-12-01')
  })

  it('parses two-digit years', () => {
    expect(parseFlexibleDate('12/01/25')).toBe('2025-12-01')
  })

  it('returns null for unparseable text', () => {
    expect(parseFlexibleDate('not a date')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseFlexibleDate('')).toBeNull()
  })
})

describe('parseFlexibleAmount', () => {
  it('parses a plain number', () => {
    expect(parseFlexibleAmount('142.09')).toBe(142.09)
  })

  it('strips currency symbols and commas', () => {
    expect(parseFlexibleAmount('$1,360.97')).toBe(1360.97)
  })

  it('treats parenthesized amounts as negative', () => {
    expect(parseFlexibleAmount('(12.34)')).toBe(-12.34)
  })

  it('returns null for an empty string', () => {
    expect(parseFlexibleAmount('')).toBeNull()
  })

  it('returns null for non-numeric text', () => {
    expect(parseFlexibleAmount('n/a')).toBeNull()
  })
})

describe('normalize', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalize('SS CALGARY 6TH    _M')).toBe('ss calgary 6th m')
  })

  it('collapses repeated whitespace', () => {
    expect(normalize('Good   Earth  Coffee')).toBe('good earth coffee')
  })
})

describe('isLikelyDataRow', () => {
  it('flags a row as data when a cell parses as a date', () => {
    expect(isLikelyDataRow(['2025-12-01', 'WU MTCN 4518455912', '391', '', '211.35'])).toBe(true)
  })

  it('does not flag a plain header row', () => {
    expect(isLikelyDataRow(['Date', 'Description', 'Debit', 'Credit', 'Balance'])).toBe(false)
  })
})

describe('isLikelyDuplicate', () => {
  const existing = [{ date: '2025-12-10', amount: 2.61 }] as Parameters<typeof isLikelyDuplicate>[1]

  it('matches on exact date and amount', () => {
    expect(isLikelyDuplicate({ date: '2025-12-10', amount: 2.61 }, existing)).toBe(true)
  })

  it('does not match a different amount', () => {
    expect(isLikelyDuplicate({ date: '2025-12-10', amount: 2.62 }, existing)).toBe(false)
  })

  it('does not match a different date', () => {
    expect(isLikelyDuplicate({ date: '2025-12-11', amount: 2.61 }, existing)).toBe(false)
  })

  it('is false when the row has no date or amount', () => {
    expect(isLikelyDuplicate({ date: null, amount: 2.61 }, existing)).toBe(false)
  })
})

describe('split transaction helpers', () => {
  const parts = [
    { id: '1', amount: 113.67, category: 'Phone & Internet', type: 'business' as const },
    { id: '2', amount: 28.42, category: 'Phone & Internet', type: 'personal' as const },
  ]

  it('sums split parts', () => {
    expect(splitTotal(parts)).toBeCloseTo(142.09)
  })

  it('is balanced when parts sum to the original amount', () => {
    expect(isSplitBalanced({ amount: 142.09, splitParts: parts })).toBe(true)
  })

  it('is not balanced when parts are short', () => {
    expect(isSplitBalanced({ amount: 142.09, splitParts: [parts[0]] })).toBe(false)
  })

  it('is not balanced when the row amount is null', () => {
    expect(isSplitBalanced({ amount: null, splitParts: parts })).toBe(false)
  })
})
