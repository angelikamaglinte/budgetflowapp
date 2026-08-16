import { parseLocalDate } from '@/lib/utils'
import type { Invoice, InvoiceStatus } from '@/types'

// "Overdue" is never stored — it's always derived from due_date vs. today,
// so it's automatically correct without any background job keeping it in sync.
export function getEffectiveStatus(invoice: Pick<Invoice, 'status' | 'due_date'>, today: Date = new Date()): InvoiceStatus {
  if (invoice.status === 'pending' && invoice.due_date) {
    const due = parseLocalDate(invoice.due_date)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    if (due < todayStart) return 'overdue'
  }
  return invoice.status as InvoiceStatus
}
