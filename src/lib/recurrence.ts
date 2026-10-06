import { RRule } from 'rrule'
import type { Options as RRuleOptions, Weekday } from 'rrule'
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'

// Sunday-first, matching JS's Date#getDay() (0 = Sunday) and the day-picker
// convention already used elsewhere in this app (DayOfMonthPicker, etc.).
const WEEKDAYS: Weekday[] = [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export type RepeatQuickPick = 'none' | 'daily' | 'weekday' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom'

export type RepeatEnd = { type: 'never' } | { type: 'on'; date: string } | { type: 'after'; count: number }

export interface CustomRepeatOptions {
  interval: number
  unit: 'day' | 'week' | 'month' | 'year'
  weekdays?: number[] // 0=Sun..6=Sat — only meaningful when unit === 'week'
  end: RepeatEnd
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

function applyEnd(options: Partial<RRuleOptions>, end: RepeatEnd): void {
  if (end.type === 'on') options.until = parseLocalDate(end.date)
  else if (end.type === 'after') options.count = end.count
}

// Builds a storable RRULE string with no DTSTART — the real anchor date
// (tasks.due_date / invoice_reminders.anchor_date) is reattached later via
// hydrate(), so the same rule text stays valid if the anchor is ever edited.
export function buildRRuleString(pick: RepeatQuickPick, startDateStr: string, custom?: CustomRepeatOptions): string | null {
  if (pick === 'none') return null
  const anchorWeekday = WEEKDAYS[parseLocalDate(startDateStr).getDay()]

  switch (pick) {
    case 'daily':
      return new RRule({ freq: RRule.DAILY }).toString()
    case 'weekday':
      return new RRule({ freq: RRule.WEEKLY, byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR] }).toString()
    case 'weekly':
      return new RRule({ freq: RRule.WEEKLY, byweekday: [anchorWeekday] }).toString()
    case 'biweekly':
      return new RRule({ freq: RRule.WEEKLY, interval: 2, byweekday: [anchorWeekday] }).toString()
    case 'monthly': {
      const day = parseLocalDate(startDateStr).getDate()
      // Day 31 exists in only 7 months a year — RRULE's literal BYMONTHDAY=31
      // would silently skip every other month. -1 means "the month's actual
      // last day" natively, which is what a day-31 anchor is really meant to
      // express (and what the old day-of-month reminders always did).
      return new RRule({ freq: RRule.MONTHLY, bymonthday: [day === 31 ? -1 : day] }).toString()
    }
    case 'yearly':
      return new RRule({ freq: RRule.YEARLY }).toString()
    case 'custom': {
      if (!custom) throw new Error('custom repeat options are required when pick is "custom"')
      const freqMap = { day: RRule.DAILY, week: RRule.WEEKLY, month: RRule.MONTHLY, year: RRule.YEARLY }
      const options: Partial<RRuleOptions> = { freq: freqMap[custom.unit], interval: custom.interval }
      if (custom.unit === 'week' && custom.weekdays && custom.weekdays.length > 0) {
        options.byweekday = custom.weekdays.map((d) => WEEKDAYS[d])
      }
      applyEnd(options, custom.end)
      return new RRule(options).toString()
    }
  }
}

// Reattaches the real anchor date to a stored RRULE-only string.
function hydrate(rule: string, startDateStr: string): RRule {
  const parsed = RRule.parseString(rule)
  return new RRule({ ...parsed, dtstart: parseLocalDate(startDateStr) })
}

// Human label for cards/badges. Recognizes the exact shapes the quick-picks
// above produce and phrases those the way the picker itself does; anything
// else (genuine custom combos) falls back to rrule's own toText().
export function describeRRule(rule: string | null, startDateStr: string): string {
  if (!rule) return 'Does not repeat'
  const r = hydrate(rule, startDateStr)
  const o = r.options
  const wd = o.byweekday as number[] | null
  // rrule's `options.bymonthday` getter drops negative values (BYMONTHDAY=-1
  // normalizes to [] there, even though occurrence generation itself works
  // fine) — origOptions keeps the real value, as either a scalar or array.
  const rawMonthday = r.origOptions.bymonthday
  const monthday = rawMonthday == null ? [] : Array.isArray(rawMonthday) ? rawMonthday : [rawMonthday]

  if (o.freq === RRule.DAILY && o.interval === 1) return 'Every day'
  if (o.freq === RRule.WEEKLY && o.interval === 1 && wd?.length === 5 && [1, 2, 3, 4, 5].every((d) => wd.includes(d))) {
    return 'Every weekday'
  }
  if (o.freq === RRule.WEEKLY && o.interval === 1 && wd?.length === 1) {
    return `Every week on ${WEEKDAY_SHORT[(wd[0] + 1) % 7]}`
  }
  if (o.freq === RRule.WEEKLY && o.interval === 2 && wd?.length === 1) {
    return `Every 2 weeks on ${WEEKDAY_SHORT[(wd[0] + 1) % 7]}`
  }
  if (o.freq === RRule.MONTHLY && o.interval === 1 && monthday.length === 1) {
    const day = monthday[0]
    return day === -1 ? 'Every month on the last day' : `Every month on the ${ordinal(day)}`
  }
  if (o.freq === RRule.YEARLY && o.interval === 1) {
    return `Every year on ${format(parseLocalDate(startDateStr), 'MMM d')}`
  }

  const text = r.toText()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Start of the "current" cycle containing `today`, scoped to the rule's own
// frequency — e.g. start of this month for a monthly rule, start of this
// week for a weekly one. Lets a caller ask "is there a due-but-unacknowledged
// occurrence in the current cycle" without reaching back into a previous
// cycle's occurrence that's since been superseded (a monthly reminder on the
// 20th shouldn't still read as "due" on the 5th just because last month's
// 20th was never dismissed).
export function getCurrentPeriodStart(rule: string | null, today: Date): Date {
  if (!rule) return startOfDay(today)
  switch (RRule.parseString(rule).freq) {
    case RRule.DAILY:
      return startOfDay(today)
    case RRule.WEEKLY:
      return startOfWeek(today)
    case RRule.YEARLY:
      return startOfYear(today)
    default:
      return startOfMonth(today)
  }
}

// All occurrences within [rangeStart, rangeEnd], inclusive. A null rule
// yields a single occurrence on startDateStr if it falls in range.
export function getOccurrences(rule: string | null, startDateStr: string, rangeStart: Date, rangeEnd: Date): Date[] {
  const start = startOfDay(rangeStart)
  const end = endOfDay(rangeEnd)
  if (!rule) {
    const anchor = parseLocalDate(startDateStr)
    return anchor >= start && anchor <= end ? [anchor] : []
  }
  return hydrate(rule, startDateStr).between(start, end, true)
}

// First occurrence on/after `after` that isn't already in excludeDateStrs
// (completed occurrences, for recurring tasks/reminders). Bounded to a
// 2-year horizon so an indefinitely-repeating rule can't loop forever.
export function getNextOccurrence(
  rule: string | null,
  startDateStr: string,
  excludeDateStrs: string[],
  after: Date = new Date()
): Date | null {
  const exclude = new Set(excludeDateStrs)
  if (!rule) {
    return exclude.has(startDateStr) ? null : parseLocalDate(startDateStr)
  }
  const horizon = new Date(after.getFullYear() + 2, after.getMonth(), after.getDate())
  const candidates = hydrate(rule, startDateStr).between(startOfDay(after), horizon, true)
  for (const d of candidates) {
    if (!exclude.has(format(d, 'yyyy-MM-dd'))) return d
  }
  return null
}
