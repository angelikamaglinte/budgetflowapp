import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/types'
import { STATUS_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface RecentInvoicesProps {
  invoices: Invoice[]
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const recent = invoices.slice(0, 5)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
          <p className="text-xs text-gray-400">Your latest invoices</p>
        </div>
        <Link
          to="/invoices"
          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 transition"
        >
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No invoices yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{inv.client_name}</p>
                <p className="text-xs text-gray-400">
                  {inv.invoice_number} · {format(new Date(inv.issue_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full capitalize',
                    STATUS_COLORS[inv.status as InvoiceStatus] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {inv.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  ${inv.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
