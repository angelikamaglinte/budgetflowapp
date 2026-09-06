import { describe, it, expect } from 'vitest'
import { matchesPeriod, periodLabel } from './PeriodContext'

describe('matchesPeriod', () => {
  it('matches everything when the filter is empty', () => {
    expect(matchesPeriod('2026-08-15', '')).toBe(true)
  })

  it('matches by year prefix', () => {
    expect(matchesPeriod('2026-08-15', '2026')).toBe(true)
    expect(matchesPeriod('2025-08-15', '2026')).toBe(false)
  })

  it('matches by year-month prefix', () => {
    expect(matchesPeriod('2026-08-15', '2026-08')).toBe(true)
    expect(matchesPeriod('2026-09-15', '2026-08')).toBe(false)
  })

  it('matches within a custom date range, inclusive of both ends', () => {
    const filter = 'range:2026-08-15:2026-09-10'
    expect(matchesPeriod('2026-08-15', filter)).toBe(true)
    expect(matchesPeriod('2026-09-10', filter)).toBe(true)
    expect(matchesPeriod('2026-08-20', filter)).toBe(true)
    expect(matchesPeriod('2026-08-14', filter)).toBe(false)
    expect(matchesPeriod('2026-09-11', filter)).toBe(false)
  })

  it('handles a full timestamp against a custom range', () => {
    expect(matchesPeriod('2026-08-15T10:30:00Z', 'range:2026-08-01:2026-08-31')).toBe(true)
  })
})

describe('periodLabel', () => {
  it('labels an empty filter as All time', () => {
    expect(periodLabel('')).toBe('All time')
  })

  it('labels a year filter as itself', () => {
    expect(periodLabel('2026')).toBe('2026')
  })

  it('labels a month filter as a full month name and year', () => {
    expect(periodLabel('2026-08')).toBe('August 2026')
  })

  it('labels a custom range as start – end', () => {
    expect(periodLabel('range:2026-08-15:2026-09-10')).toBe('Aug 15 – Sep 10, 2026')
  })
})
