import { describe, it, expect } from 'vitest'
import { format } from 'date-fns'
import { buildRRuleString, describeRRule, getOccurrences, getNextOccurrence } from './recurrence'

// Sep 7, 2026 is a Monday.
const MONDAY = '2026-09-07'

describe('buildRRuleString', () => {
  it('returns null for "none"', () => {
    expect(buildRRuleString('none', MONDAY)).toBeNull()
  })

  it('builds a daily rule', () => {
    expect(buildRRuleString('daily', MONDAY)).toBe('RRULE:FREQ=DAILY')
  })

  it('builds a weekday (Mon-Fri) rule', () => {
    expect(buildRRuleString('weekday', MONDAY)).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR')
  })

  it('builds a weekly rule on the anchor date\'s weekday', () => {
    expect(buildRRuleString('weekly', MONDAY)).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO')
  })

  it('builds a biweekly rule on the anchor date\'s weekday', () => {
    expect(buildRRuleString('biweekly', MONDAY)).toBe('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO')
  })

  it('builds a monthly rule on the anchor date\'s day-of-month', () => {
    expect(buildRRuleString('monthly', MONDAY)).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=7')
  })

  it('builds a monthly rule anchored on the 31st as "last day of month", not a literal 31', () => {
    expect(buildRRuleString('monthly', '2026-01-31')).toBe('RRULE:FREQ=MONTHLY;BYMONTHDAY=-1')
  })

  it('builds a yearly rule', () => {
    expect(buildRRuleString('yearly', MONDAY)).toBe('RRULE:FREQ=YEARLY')
  })

  it('builds a custom rule with interval, weekdays, and a count end condition', () => {
    const rule = buildRRuleString('custom', MONDAY, {
      interval: 2,
      unit: 'week',
      weekdays: [1, 3], // Mon, Wed
      end: { type: 'after', count: 5 },
    })
    expect(rule).toBe('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=5')
  })

  it('builds a custom rule with an until end condition', () => {
    const rule = buildRRuleString('custom', MONDAY, {
      interval: 1,
      unit: 'month',
      end: { type: 'on', date: '2026-12-01' },
    })
    expect(rule).toContain('FREQ=MONTHLY')
    expect(rule).toContain('UNTIL=')
  })

  it('throws if custom is picked without options', () => {
    expect(() => buildRRuleString('custom', MONDAY)).toThrow()
  })
})

describe('describeRRule', () => {
  it('describes a null rule', () => {
    expect(describeRRule(null, MONDAY)).toBe('Does not repeat')
  })

  it('describes each quick-pick with friendly phrasing', () => {
    expect(describeRRule(buildRRuleString('daily', MONDAY), MONDAY)).toBe('Every day')
    expect(describeRRule(buildRRuleString('weekday', MONDAY), MONDAY)).toBe('Every weekday')
    expect(describeRRule(buildRRuleString('weekly', MONDAY), MONDAY)).toBe('Every week on Mon')
    expect(describeRRule(buildRRuleString('biweekly', MONDAY), MONDAY)).toBe('Every 2 weeks on Mon')
    expect(describeRRule(buildRRuleString('monthly', MONDAY), MONDAY)).toBe('Every month on the 7th')
    expect(describeRRule(buildRRuleString('yearly', MONDAY), MONDAY)).toBe('Every year on Sep 7')
  })

  it('describes a day-31 monthly rule as "last day", not "-1th"', () => {
    expect(describeRRule(buildRRuleString('monthly', '2026-01-31'), '2026-01-31')).toBe('Every month on the last day')
  })

  it('falls back to a readable description for custom combos', () => {
    const rule = buildRRuleString('custom', MONDAY, { interval: 2, unit: 'week', weekdays: [1, 3], end: { type: 'never' } })
    const label = describeRRule(rule, MONDAY)
    expect(label.length).toBeGreaterThan(0)
    expect(label).not.toBe('Does not repeat')
  })
})

describe('getOccurrences', () => {
  it('returns a single occurrence on the anchor date for a null rule, if in range', () => {
    const inRange = getOccurrences(null, MONDAY, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(inRange).toHaveLength(1)
    expect(format(inRange[0], 'yyyy-MM-dd')).toBe(MONDAY)

    const outOfRange = getOccurrences(null, MONDAY, new Date('2026-10-01'), new Date('2026-10-31'))
    expect(outOfRange).toHaveLength(0)
  })

  it('returns every Monday within a weekly rule\'s range', () => {
    const rule = buildRRuleString('weekly', MONDAY)
    const occurrences = getOccurrences(rule, MONDAY, new Date('2026-09-01'), new Date('2026-09-30'))
    expect(occurrences.map((d) => format(d, 'yyyy-MM-dd'))).toEqual(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'])
  })

  it('respects a count-bounded custom rule', () => {
    const rule = buildRRuleString('custom', MONDAY, { interval: 1, unit: 'week', weekdays: [1], end: { type: 'after', count: 2 } })
    const occurrences = getOccurrences(rule, MONDAY, new Date('2026-09-01'), new Date('2026-12-31'))
    expect(occurrences).toHaveLength(2)
  })
})

describe('getNextOccurrence', () => {
  it('returns the anchor date for a non-recurring task not yet completed', () => {
    const next = getNextOccurrence(null, MONDAY, [], new Date('2026-09-01'))
    expect(next && format(next, 'yyyy-MM-dd')).toBe(MONDAY)
  })

  it('returns null for a non-recurring, already-completed task', () => {
    expect(getNextOccurrence(null, MONDAY, [MONDAY], new Date('2026-09-01'))).toBeNull()
  })

  it('skips completed occurrences and returns the next upcoming one', () => {
    const rule = buildRRuleString('weekly', MONDAY)
    const next = getNextOccurrence(rule, MONDAY, ['2026-09-07', '2026-09-14'], new Date('2026-09-01'))
    expect(next && format(next, 'yyyy-MM-dd')).toBe('2026-09-21')
  })

  it('returns null once a bounded rule is exhausted', () => {
    const rule = buildRRuleString('custom', MONDAY, { interval: 1, unit: 'week', weekdays: [1], end: { type: 'after', count: 1 } })
    const next = getNextOccurrence(rule, MONDAY, [MONDAY], new Date('2026-09-01'))
    expect(next).toBeNull()
  })
})
