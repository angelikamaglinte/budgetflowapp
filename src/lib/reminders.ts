import { getDaysInMonth, format, startOfDay, endOfDay } from 'date-fns'
import type { InvoiceReminder } from '@/types'

export function periodKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

// Reminder day is 1-31; months with fewer days fall back to their last day
// (e.g. a day-31 reminder lands on Feb 28/29).
export function effectiveDayForMonth(reminderDay: number, monthDate: Date): number {
  return Math.min(reminderDay, getDaysInMonth(monthDate))
}

export interface DueReminder {
  reminder: InvoiceReminder
  dueDate: Date
}

export function getDueReminders(reminders: InvoiceReminder[], today: Date = new Date()): DueReminder[] {
  const thisPeriod = periodKey(today)
  return reminders
    .filter((r) => r.dismissed_period !== thisPeriod)
    .filter((r) => today.getDate() >= effectiveDayForMonth(r.reminder_day, today))
    .map((r) => ({
      reminder: r,
      dueDate: new Date(today.getFullYear(), today.getMonth(), effectiveDayForMonth(r.reminder_day, today)),
    }))
}

export interface ReminderOccurrence {
  reminder: InvoiceReminder
  date: Date
}

// One occurrence per reminder per calendar month touched by [rangeStart, rangeEnd].
export function getReminderOccurrences(
  reminders: InvoiceReminder[],
  rangeStart: Date,
  rangeEnd: Date
): ReminderOccurrence[] {
  const start = startOfDay(rangeStart)
  const end = endOfDay(rangeEnd)
  const occurrences: ReminderOccurrence[] = []

  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= endCursor) {
    for (const r of reminders) {
      const day = effectiveDayForMonth(r.reminder_day, cursor)
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), day)
      if (date >= start && date <= end) {
        occurrences.push({ reminder: r, date })
      }
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }

  return occurrences
}
