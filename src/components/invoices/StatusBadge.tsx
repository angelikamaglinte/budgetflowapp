import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types'
import { STATUS_COLORS } from '@/types'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize',
        STATUS_COLORS[status as InvoiceStatus] ?? 'bg-gray-100 text-gray-600'
      )}
    >
      {status}
    </span>
  )
}
