import { describe, it, expect } from 'vitest'
import { format } from 'date-fns'
import { getDueReminders, getReminderOccurrences } from './reminders'
import { buildRRuleString } from './recurrence'
import type { InvoiceReminder } from '@/types'

function makeReminder(overrides: Partial<InvoiceReminder>): InvoiceReminder {
  return {
    id: 'r1',
    user_id: 'u1',
    client_name: 'Acme',
    reminder_day: 15,
    notes: null,
    dismissed_period: null,
    recurrence_rule: buildRRuleString('monthly', '2026-01-15'),
    anchor_date: '2026-01-15',
    dismissed_occurrence_date: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getDueReminders', () => {
  const today = new Date('2026-08-15T12:00:00')

  it('includes a reminder whose day has passed this month', () => {
    const reminders = [makeReminder({ anchor_date: '2026-01-10', recurrence_rule: buildRRuleString('monthly', '2026-01-10') })]
    const result = getDueReminders(reminders, today)

    expect(result).toHaveLength(1)
    expect(format(result[0].dueDate, 'yyyy-MM-dd')).toBe('2026-08-10')
  })

  it('excludes a reminder whose day has not yet arrived this month', () => {
    const reminders = [makeReminder({ anchor_date: '2026-01-20', recurrence_rule: buildRRuleString('monthly', '2026-01-20') })]
    expect(getDueReminders(reminders, today)).toHaveLength(0)
  })

  it('includes a reminder due exactly today', () => {
    const reminders = [makeReminder({ anchor_date: '2026-01-15', recurrence_rule: buildRRuleString('monthly', '2026-01-15') })]
    expect(getDueReminders(reminders, today)).toHaveLength(1)
  })

  it('excludes a reminder already dismissed for its exact occurrence date', () => {
    const reminders = [
      makeReminder({
        anchor_date: '2026-01-10',
        recurrence_rule: buildRRuleString('monthly', '2026-01-10'),
        dismissed_occurrence_date: '2026-08-10',
      }),
    ]
    expect(getDueReminders(reminders, today)).toHaveLength(0)
  })

  it('includes a reminder dismissed for a different occurrence date', () => {
    const reminders = [
      makeReminder({
        anchor_date: '2026-01-10',
        recurrence_rule: buildRRuleString('monthly', '2026-01-10'),
        dismissed_occurrence_date: '2026-07-10',
      }),
    ]
    expect(getDueReminders(reminders, today)).toHaveLength(1)
  })

  it('works for a weekly rule, not just monthly', () => {
    // 2026-08-10 is a Monday.
    const reminders = [makeReminder({ anchor_date: '2026-08-10', recurrence_rule: buildRRuleString('weekly', '2026-08-10') })]
    const result = getDueReminders(reminders, today) // today = Aug 15, a Saturday
    expect(result).toHaveLength(1)
    expect(format(result[0].dueDate, 'yyyy-MM-dd')).toBe('2026-08-10')
  })
})

describe('getReminderOccurrences', () => {
  it('returns one occurrence per month touched by the range', () => {
    const reminders = [makeReminder({ anchor_date: '2026-06-15', recurrence_rule: buildRRuleString('monthly', '2026-06-15') })]
    const start = new Date('2026-06-01T00:00:00')
    const end = new Date('2026-08-31T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result.map((o) => format(o.date, 'yyyy-MM-dd'))).toEqual(['2026-06-15', '2026-07-15', '2026-08-15'])
  })

  it('applies the day-31 fallback per month within the range', () => {
    const reminders = [makeReminder({ anchor_date: '2026-01-31', recurrence_rule: buildRRuleString('monthly', '2026-01-31') })]
    const start = new Date('2026-01-01T00:00:00')
    const end = new Date('2026-02-28T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result.map((o) => format(o.date, 'yyyy-MM-dd'))).toEqual(['2026-01-31', '2026-02-28'])
  })

  it('excludes an occurrence that falls before the range start', () => {
    const reminders = [makeReminder({ anchor_date: '2026-06-05', recurrence_rule: buildRRuleString('monthly', '2026-06-05') })]
    // Range starts mid-June, so June's occurrence is out of range, July's isn't.
    const start = new Date('2026-06-10T00:00:00')
    const end = new Date('2026-07-31T23:59:59')

    const result = getReminderOccurrences(reminders, start, end)

    expect(result).toHaveLength(1)
    expect(format(result[0].date, 'yyyy-MM-dd')).toBe('2026-07-05')
  })

  it('returns occurrences for multiple reminders in the same month', () => {
    const reminders = [
      makeReminder({ id: 'r1', anchor_date: '2026-08-05', recurrence_rule: buildRRuleString('monthly', '2026-08-05') }),
      makeReminder({ id: 'r2', anchor_date: '2026-08-20', recurrence_rule: buildRRuleString('monthly', '2026-08-20') }),
    ]
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

  it('ignores a reminder with no anchor_date (not yet backfilled)', () => {
    const reminders = [makeReminder({ anchor_date: null })]
    const result = getReminderOccurrences(reminders, new Date('2026-08-01'), new Date('2026-08-31'))
    expect(result).toHaveLength(0)
  })
})
