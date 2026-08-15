import { format } from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import type { PdfLineItem } from '@/types'

export function lineItemAmount(item: PdfLineItem): number {
  return item.qty * item.rate
}

// Turns structured start/end dates into a display string matching invoice
// conventions, e.g. "July 2, 2026" for a single day, "July 2 to 8, 2026"
// for a range within the same month, expanding to the month/year on either
// side only when the range actually crosses a month or year boundary.
export function formatDateRange(dateStart: string | null, dateEnd: string | null): string {
  if (!dateStart) return ''
  const start = parseLocalDate(dateStart)
  if (!dateEnd || dateEnd === dateStart) {
    return format(start, 'MMMM d, yyyy')
  }
  const end = parseLocalDate(dateEnd)
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, 'MMMM d, yyyy')} to ${format(end, 'MMMM d, yyyy')}`
  }
  if (start.getMonth() !== end.getMonth()) {
    return `${format(start, 'MMMM d')} to ${format(end, 'MMMM d, yyyy')}`
  }
  return `${format(start, 'MMMM d')} to ${format(end, 'd, yyyy')}`
}

export function computeSubtotal(items: PdfLineItem[]): number {
  return items.reduce((sum, item) => sum + lineItemAmount(item), 0)
}

export function computeTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100)
}

export function computeTotal(subtotal: number, tax: number): number {
  return subtotal + tax
}

export function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
