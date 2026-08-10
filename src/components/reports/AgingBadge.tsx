import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { parseLocalDate } from '@/lib/utils'
import type { AgedInvoice } from '@/lib/reports'

const BUCKET_STYLES: Record<AgedInvoice['bucket'], string> = {
  overdue: 'bg-[#FAECEC] text-[#C4554D]',
  'due-soon': 'bg-[#FAF3DD] text-[#C29343]',
  upcoming: 'bg-[#E9F3F7] text-[#487CA5]',
  'no-due-date': 'bg-[#F1F1EF] text-[#787774]',
}

export function AgingBadge({ agedInvoice }: { agedInvoice: AgedInvoice }) {
  const { bucket, daysOverdue, daysUntilDue, invoice } = agedInvoice

  let label: string
  if (bucket === 'overdue') {
    label = `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`
  } else if (bucket === 'no-due-date') {
    label = 'No due date'
  } else if (daysUntilDue === 0) {
    label = 'Due today'
  } else if (bucket === 'due-soon') {
    label = `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
  } else {
    label = `Due ${format(parseLocalDate(invoice.due_date!), 'MMM d')}`
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', BUCKET_STYLES[bucket])}>
      {label}
    </span>
  )
}
