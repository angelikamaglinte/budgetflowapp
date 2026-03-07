import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse a YYYY-MM-DD date string as local time (not UTC)
// Without this, new Date('2025-09-01') is treated as UTC midnight,
// which shifts to Aug 31 in negative-offset timezones (e.g. Canada)
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00')
}
