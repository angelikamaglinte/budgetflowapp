import { format } from 'date-fns'
import { getOccurrences, getCurrentPeriodStart } from '@/lib/recurrence'
import type { InvoiceReminder } from '@/types'

export interface DueReminder {
  reminder: InvoiceReminder
  dueDate: Date
}

// A reminder is "due" when it has an occurrence, within its own current
// cycle (this month for a monthly rule, this week for a weekly one, etc.),
// on or before today that hasn't already been dismissed. Scoping the
// lookback to the rule's own cycle (instead of a flat N days) means a stale
// un-dismissed occurrence from a previous cycle doesn't keep nagging once a
// new one has started — same spirit as the old day-of-month behavior, now
// correct for any recurrence rule. Dismissing only suppresses that one
// occurrence's exact date, not the whole cycle.
export function getDueReminders(reminders: InvoiceReminder[], today: Date = new Date()): DueReminder[] {
  const result: DueReminder[] = []

  for (const r of reminders) {
    if (!r.anchor_date) continue
    const periodStart = getCurrentPeriodStart(r.recurrence_rule, today)
    const occurrences = getOccurrences(r.recurrence_rule, r.anchor_date, periodStart, today)
    const mostRecent = occurrences[occurrences.length - 1]
    if (!mostRecent) continue
    if (r.dismissed_occurrence_date === format(mostRecent, 'yyyy-MM-dd')) continue
    result.push({ reminder: r, dueDate: mostRecent })
  }

  return result
}

export interface ReminderOccurrence {
  reminder: InvoiceReminder
  date: Date
}

// Every occurrence, for every reminder, that falls within [rangeStart, rangeEnd].
export function getReminderOccurrences(
  reminders: InvoiceReminder[],
  rangeStart: Date,
  rangeEnd: Date
): ReminderOccurrence[] {
  const occurrences: ReminderOccurrence[] = []
  for (const r of reminders) {
    if (!r.anchor_date) continue
    for (const date of getOccurrences(r.recurrence_rule, r.anchor_date, rangeStart, rangeEnd)) {
      occurrences.push({ reminder: r, date })
    }
  }
  return occurrences
}
