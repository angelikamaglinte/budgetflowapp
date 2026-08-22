import { describe, it, expect } from 'vitest'
import { periodKey, effectiveDayForMonth, getDueReminders, getReminderOccurrences } from './reminders'
import type { InvoiceReminder } from '@/types'

function makeReminder(overrides: Partial<InvoiceReminder>): InvoiceReminder {
  return {
    id: 'r1',
    user_id: 'u1',
    client_name: 'Acme',
    reminder_day: 15,
    notes: null,
    dismissed_period: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('periodKey', () => {
  it('formats a date as yyyy-MM', () => {
    expect(periodKey(new Date('2026-08-15T12:00:00'))).toBe('2026-08')
  })
})

describe('effectiveDayForMonth', () => {
  it('returns the reminder day unchanged when the month has enough days', () => {
    expect(effectiveDayForMonth(15, new Date('2026-08-01T12:00:00'))).toBe(15)
  })

  it('falls back to the last day of a shorter month for day 31', () => {
    expect(effectiveDayForMonth(31, new Date('2026-04-01T12:00:00'))).toBe(30)
  })

  it('falls back to Feb 28 on a non-leap year', () => {
    expect(effectiveDayForMonth(31, new Date('2026-02-01T12:00:00'))).toBe(28)
  })

  it('falls back to Feb 29 on a leap year', () => {
    expect(effectiveDayForMonth(31, new Date('2028-02-01T12:00:00'))).toBe(29)
  })
})

describe('getDueReminders', () => {
  const today = new Date('2026-08-15T12:00:00')

  it('includes a reminder whose day has passed this month', () => {
    const reminders = [makeReminder({ reminder_day: 10 })]
    const result = getDueReminders(reminders, today)

    expect(result).toHaveLength(1)
    expect(result[0].dueDate).toEqual(new Date(2026, 7, 10))
  })

  it('excludes a reminder whose day has not yet arrived this month', () => {
    const reminders = [makeReminder({ reminder_day: 20 })]
    expect(getDueReminders(reminders, today)).toHaveLength(0)
  })

  it('includes a reminder due exactly today', () => {
    const reminders = [makeReminder({ reminder_day: 15 })]
    expect(getDueReminders(reminders, today)).toHaveLength(1)
  })

  it('excludes a reminder already dismissed for the current period', () => {
    const reminders = [makeReminder({ reminder_day: 10, dismissed_period: '2026-08' })]
    expect(getDueReminders(reminders, today)).toHaveLength(0)
  })

  it('includes a reminder dismissed for a different period', () => {
    const reminders = [makeReminder({ reminder_day: 10, dismissed_period: '2026-07' })]
    expect(getDueReminders(reminders, today)).toHaveLength(1)
  })
})

describe('getReminderOccurrences', () => {
  it('returns one occurrence per month touched by the range', () => {
    const reminders = [makeReminder({ reminder_day: 15 })]
    const start = new Date('2026-06-01T00:00:00')
    const end = new Date('2026-08-31T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result).toHaveLength(3)
    expect(result.map((o) => o.date)).toEqual([
      new Date(2026, 5, 15),
      new Date(2026, 6, 15),
      new Date(2026, 7, 15),
    ])
  })

  it('applies the day-31 fallback per month within the range', () => {
    const reminders = [makeReminder({ reminder_day: 31 })]
    const start = new Date('2026-01-01T00:00:00')
    const end = new Date('2026-02-28T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result.map((o) => o.date)).toEqual([new Date(2026, 0, 31), new Date(2026, 1, 28)])
  })

  it('excludes an occurrence that falls before the range start within its month', () => {
    const reminders = [makeReminder({ reminder_day: 5 })]
    // Range starts mid-June, so June's day-5 occurrence is out of range, July's isn't.
    const start = new Date('2026-06-10T00:00:00')
    const end = new Date('2026-07-31T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result).toHaveLength(1)
    expect(result[0].date).toEqual(new Date(2026, 6, 5))
  })

  it('returns occurrences for multiple reminders in the same month', () => {
    const reminders = [makeReminder({ id: 'r1', reminder_day: 5 }), makeReminder({ id: 'r2', reminder_day: 20 })]
    const start = new Date('2026-08-01T00:00:00')
    const end = new Date('2026-08-31T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result).toHaveLength(2)
    expect(result.map((o) => o.reminder.id).sort()).toEqual(['r1', 'r2'])
  })

  it('returns no occurrences for an empty reminders list', () => {
    const result = getReminderOccurrences([], new Date('2026-08-01'), new Date('2026-08-31'))
    expect(result).toHaveLength(0)
  })
})
